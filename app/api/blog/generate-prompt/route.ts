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
    moodGraphics.push('Green rising bar chart + upward arrow + wallet with cash in lower-left')
  }
  if (mood === 'negative') {
    moodGraphics.push('Red downward arrow, warning badge, falling chart in lower-left')
  }
  if (mood === 'shocked') {
    moodGraphics.push('Explosive burst graphics, bold alert badge in lower-left')
  }
  if (mood === 'buying') {
    moodGraphics.push('House icon with glow, key graphic in lower-left')
  }
  if (mood === 'selling') {
    moodGraphics.push('SOLD badge, house with price tag in lower-left')
  }
  const moodGraphicsText = moodGraphics.length > 0
    ? moodGraphics.map((s) => `- ${s}`).join('\n')
    : '- Bold mood-appropriate graphic element in lower-left'

  return `Write a gpt-image-1 prompt that generates ONLY the background scene and text/graphics for a YouTube thumbnail. A real person photo will be composited on the right third later — do NOT include any person.

ARTICLE: "${title}"
COMMUNITY: ${community}
MOOD: ${mood}

BACKGROUND IMAGE: [the attached background photo is provided for reference]
Use this exact scene/location as the backdrop. Enhance with dramatic cinematic lighting, rich saturated colors, and a dark gradient on the left side for text readability.

⚠️ CRITICAL — NO PERSON RULE:
- DO NOT include any person, human, figure, face, body, silhouette, hand, or crowd ANYWHERE in the image.
- The ENTIRE RIGHT THIRD of the image (from 67% width to the right edge) must remain EMPTY atmospheric background — sky, ocean, bokeh, haze, depth only. No text, no graphics, no people in this zone. This space is reserved for a composited photo.
- All text and ALL graphic elements must stay on the LEFT TWO-THIRDS only.

TEXT & LAYOUT (left two-thirds only):
- Extract 3-5 power keywords from: "${title}"
- Bold YouTube-style typography: massive main keywords in yellow (#FFE600) with black stroke
- Community name "${community.toUpperCase()}, VA" as a small kicker badge at the top-left
- Red ribbon banner with supporting context text below the headline
- All text strictly on LEFT two-thirds only

GRAPHIC ELEMENTS (left two-thirds only):
${moodGraphicsText}
- Stylized 3D overlays with glow/neon effects matching the mood

STYLE: MrBeast-level YouTube thumbnail — extreme saturation, bold, dramatic, cinematic. High contrast. Maximum clickability.

CANVAS: 1536x1024px landscape.
LEFT two-thirds: text + graphics + scene drama.
RIGHT third: clean empty atmospheric background only — absolutely nothing else.

FINAL REMINDER: Zero humans anywhere. Right third = empty atmospheric space only. Barry will be added by the compositor.`
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
