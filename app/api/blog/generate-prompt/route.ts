import fs from 'fs'
import path from 'path'
import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import {
  detectCommunity,
  detectMood,
  MOOD_EXPRESSION_FILE,
} from '@/lib/image-gen-openai'

export const maxDuration = 120

function communitySlug(community: string): string {
  return community.toLowerCase().replace(/\s+/g, '-')
}

function pickRandomBackground(community: string): string | null {
  const slug = communitySlug(community)
  const dir = path.join(process.cwd(), 'public', 'community-photos', slug)
  if (!fs.existsSync(dir)) return null
  const files = fs
    .readdirSync(dir)
    .filter((f) => /\.(jpe?g|png|webp)$/i.test(f))
  if (files.length === 0) return null
  const pick = files[Math.floor(Math.random() * files.length)]
  return path.join('community-photos', slug, pick)
}

function mimeForPath(p: string): string {
  const ext = path.extname(p).toLowerCase()
  if (ext === '.png') return 'image/png'
  if (ext === '.webp') return 'image/webp'
  return 'image/jpeg'
}

function toDataUrl(buf: Buffer, mime: string): string {
  return `data:${mime};base64,${buf.toString('base64')}`
}

const SYSTEM_PROMPT = `You are an expert YouTube thumbnail art director specializing in real estate content.
You write precise, detailed image generation prompts for gpt-image-1.

CRITICAL RULE: The prompt you write must NEVER include any person, human, figure, face, body, silhouette, or crowd — not even in the background distance.
The RIGHT THIRD of the image (from 67% width to the right edge) must be described as completely empty atmospheric space — sky, ocean, bokeh, haze only.
Barry Jenkins (the host) will be composited onto the right third programmatically AFTER generation. Do NOT describe him or any person in the prompt.

Your prompt describes ONLY: background scene, text/typography, graphic elements, and mood/style.
Output ONLY the image generation prompt. No explanation. No preamble. No markdown.`

function buildUserPrompt(title: string, community: string, mood: string): string {
  const moodGraphics: string[] = []
  if (mood === 'exciting-positive' || mood === 'investment') {
    moodGraphics.push('A bar chart trending upward with a bright green glowing upward arrow')
    moodGraphics.push('A wallet with cash sticking out')
  }
  if (mood === 'negative') {
    moodGraphics.push('A red downward arrow with a falling chart and warning badge')
  }
  if (mood === 'shocked') {
    moodGraphics.push('Explosive burst graphic and bold alert badge')
  }
  if (mood === 'buying') {
    moodGraphics.push('A glowing house icon with a key graphic')
  }
  if (mood === 'selling') {
    moodGraphics.push('A SOLD badge and house with a price tag graphic')
  }
  if (moodGraphics.length === 0) {
    moodGraphics.push('A bold mood-appropriate graphic element with glow and depth')
  }
  const moodGraphicsText = moodGraphics.map((s) => `- ${s}`).join('\n')

  return `Create a high-converting YouTube thumbnail in a MrBeast-style design.

BACKGROUND:
The attached background image shows ${community}, VA. Use it as the backdrop. Enhance it with dramatic cinematic lighting, rich saturated colors, vibrant sunset tones (deep pink, orange, crimson sky), and high contrast. Apply a dark gradient on the LEFT side only for text readability. The right third of the image must remain as clean, empty, vibrant atmospheric space — sky, water, bokeh, or haze ONLY. No text, no graphics, nothing in the right third.

⚠️ CRITICAL: Do NOT place any person, human, figure, silhouette, or crowd anywhere in the image. The right third is reserved for a composited photo that will be added programmatically after generation.

TEXT HIERARCHY (left two-thirds only, bold YouTube thumbnail style):
- TOP small kicker badge: "${community.toUpperCase()}, VA" — small white or yellow text, top-left
- MAIN headline: Extract the 2–3 most powerful words from "${title}" — render in MASSIVE bright yellow (#FFE600) bold all-caps typography with heavy black stroke and drop shadow. This is the largest element on the left side.
- SECONDARY banner: Remaining key phrase from the title — white text on a bold red rectangle banner, slightly smaller than the headline
- SUBTEXT: Supporting context line — smaller, white and yellow mixed, below the red banner

All text must be crisp, sharp, and readable — not distorted, not blurry, not warped.

GRAPHIC ELEMENTS (lower-left quadrant only):
${moodGraphicsText}
Add glow effects, drop shadows, and 3D depth to every graphic element to make them pop.

STYLE: Bold, modern, high-energy, extreme saturation, maximum clickability. Optimized for YouTube click-through rate. MrBeast-level visual impact.

CANVAS: 1536x1024px landscape.
- Left two-thirds: all text + all graphics + scene drama
- Right third: clean empty atmospheric background only — absolutely nothing here

FINAL REMINDER: Zero humans anywhere in the image. Right third = empty atmospheric space only.`
}

export async function POST(request: Request) {
  try {
    const { postId, title, category, secret } = await request.json()

    if (secret !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!postId || !title || !category) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OPENAI_API_KEY not set' }, { status: 500 })
    }

    const community = detectCommunity(title)
    const mood = detectMood(title, category)

    const bgRelative = pickRandomBackground(community)
    if (!bgRelative) {
      return NextResponse.json(
        { error: `No background photos found for community "${community}"` },
        { status: 500 },
      )
    }
    const bgAbsolute = path.join(process.cwd(), 'public', bgRelative)
    const bgBuffer = fs.readFileSync(bgAbsolute)
    const bgMime = mimeForPath(bgAbsolute)

    const expressionFilename = MOOD_EXPRESSION_FILE[mood] ?? MOOD_EXPRESSION_FILE['default']
    const expressionRelative = path.join('expressions', expressionFilename)
    const expressionAbsolute = path.join(process.cwd(), 'public', 'expressions', expressionFilename)
    if (!fs.existsSync(expressionAbsolute)) {
      return NextResponse.json(
        { error: `Expression file not found: ${expressionRelative}` },
        { status: 500 },
      )
    }
    const exprBuffer = fs.readFileSync(expressionAbsolute)
    const exprMime = mimeForPath(expressionAbsolute)

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const userText = buildUserPrompt(title, community, mood)

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: [
            { type: 'text', text: userText },
            { type: 'image_url', image_url: { url: toDataUrl(bgBuffer, bgMime) } },
            { type: 'image_url', image_url: { url: toDataUrl(exprBuffer, exprMime) } },
          ],
        },
      ],
      max_tokens: 1500,
    })

    const prompt = completion.choices[0]?.message?.content?.trim() ?? ''
    if (!prompt) {
      return NextResponse.json({ error: 'GPT-4o returned empty prompt' }, { status: 500 })
    }

    return NextResponse.json({
      prompt,
      mood,
      community,
      backgroundFile: bgRelative.replace(/\\/g, '/'),
      backgroundPreviewUrl: toDataUrl(bgBuffer, bgMime),
      expressionFile: expressionRelative.replace(/\\/g, '/'),
      expressionPreviewUrl: toDataUrl(exprBuffer, exprMime),
    })
  } catch (err) {
    console.error('[generate-prompt]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    )
  }
}
