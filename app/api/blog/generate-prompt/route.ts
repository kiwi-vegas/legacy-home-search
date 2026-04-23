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
You write precise, detailed image generation prompts for gpt-image-1 that produce
complete, professional YouTube thumbnails in one shot.

Your prompts describe the ENTIRE SCENE: background, person, text, and graphics together.
Output ONLY the image generation prompt. No explanation. No preamble. No markdown.`

function buildUserPrompt(title: string, community: string, mood: string): string {
  const moodGraphics = [
    mood === 'exciting-positive' || mood === 'investment'
      ? 'Green rising bar chart + upward arrow + wallet with cash'
      : '',
    mood === 'negative' ? 'Red downward arrow, warning badge, falling chart' : '',
    mood === 'shocked' ? 'Explosive burst graphics, bold alert elements' : '',
    mood === 'buying' ? 'House icon with glow, key graphic' : '',
    mood === 'selling' ? 'SOLD badge, house with price tag' : '',
  ].filter(Boolean).map((s) => `- ${s}`).join('\n')

  return `Write a gpt-image-1 prompt that generates a complete YouTube thumbnail.

ARTICLE: "${title}"
COMMUNITY: ${community}
MOOD: ${mood}

BACKGROUND IMAGE: [attach background image]
Use this exact scene/location as the backdrop. Describe enhancing it with dramatic cinematic
lighting, rich saturated colors, and a dark left-side gradient for text readability.

EXPRESSION REFERENCE: [attach expression image]
This shows the facial expression and energy Barry should have.
IMPORTANT: Focus on his FACE and EXPRESSION as the hero element.
Describe him wearing a professional navy 3-piece suit with blue tie — ignore any casual
clothing visible in the reference. His face/expression is what matters.
He should be positioned on the RIGHT THIRD of the image, large and prominent.

TEXT & LAYOUT (left two-thirds only):
- Extract 3-5 power keywords from the article title
- Bold YouTube-style typography: massive main keywords in yellow (#FFE600) with black stroke
- Community name as kicker at top
- Red ribbon banner with supporting text
- All text and graphics on LEFT two-thirds ONLY

GRAPHIC ELEMENTS matching the mood/topic:
${moodGraphics}
- Stylized 3D overlays with glow/neon effects

STYLE: MrBeast-level YouTube thumbnail. Extreme saturation, bold, dramatic, cinematic.
High contrast. Maximum clickability. Professional motion-graphics quality.

COMPOSITION: 1536x1024. Left two-thirds = text + graphics. Right third = Barry (large, prominent face).`
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
