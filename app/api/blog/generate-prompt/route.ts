import fs from 'fs'
import path from 'path'
import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import {
  detectCommunity,
  detectMood,
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

const SYSTEM_PROMPT = `You are a world-class YouTube thumbnail designer who has studied every MrBeast, Graham Stephan, and Meet Kevin thumbnail ever made.

You write image generation prompts for gpt-image-1 that produce jaw-dropping, scroll-stopping YouTube thumbnails.

Your prompts are HYPER-SPECIFIC. You describe:
- EXACT font styling: tilt angles, 3D extrusion depth, outline colors, glow colors, mixed weights
- TOPIC-SPECIFIC graphics: you invent a unique illustration directly tied to the article subject — not generic icons
- Layered composition with overlapping elements, depth, and energy

CRITICAL RULES you never break:
1. ZERO humans, figures, faces, silhouettes, or crowds anywhere in the image
2. The RIGHT THIRD (from 67% width to right edge) stays as clean empty atmospheric space — sky, water, bokeh only. No text, no graphics here.
3. The background image is used AS-IS — do not ask to recolor or enhance it
4. All text and graphics on LEFT TWO-THIRDS only

Output ONLY the image generation prompt. No explanation. No preamble. No markdown. No <|token|> artifacts.`

function buildUserPrompt(title: string, community: string, mood: string): string {
  return `Design a MrBeast-style YouTube thumbnail for this real estate article.

ARTICLE TITLE: "${title}"
COMMUNITY: ${community}, VA
MOOD: ${mood}

BACKGROUND: The attached photo of ${community}, VA is the base layer. Use it exactly as-is — no color changes, no filters, no gradients added to it. The right third of the image must stay as clean open atmospheric space from this background.

⚠️ NO PERSON RULE: Zero humans, figures, faces, or silhouettes anywhere. Right third = empty atmospheric background only. A photo of the host will be composited programmatically after generation.

YOUR JOB — write a complete gpt-image-1 prompt that specifies:

1. TEXT HIERARCHY (left two-thirds only):
   - Analyze the article title and extract the most emotionally charged 2-3 word hook
   - Main headline: those words in MASSIVE styled typography — specify exact colors, outline stroke color, 3D extrusion direction, slight rotation angle (±3-5°), and glow halo color
   - Secondary element: remaining key phrase on a bold colored banner/ribbon
   - Kicker: "${community.toUpperCase()}, VA" small badge top-left
   - Every text element must have: hard drop shadow, color outline, and glow effect specified explicitly

2. TOPIC-SPECIFIC GRAPHIC (lower-left quadrant):
   - Invent ONE illustration that is DIRECTLY and UNIQUELY tied to this specific article topic
   - Think: what physical object or document or visual metaphor represents THIS article's subject?
   - Examples for appraisal article: a stamped appraisal report document tilted at an angle with "APPRAISAL" header, a house sketch inside it, a bold red "LOW VALUE" stamp overlaid
   - Examples for mortgage rate article: a giant interest rate percentage number, a Federal Reserve building sketch, a rate chart
   - Examples for community spotlight: a stylized map pin over a neighborhood aerial view sketch
   - Describe the graphic with: exact tilt angle, glow color, shadow depth, 3D perspective
   - This graphic overlaps slightly with the text for dynamic layering

3. ENERGY & STYLE:
   - Extreme saturation, bold contrasts, cinematic depth
   - Elements feel like they're bursting out of the screen
   - MrBeast-level visual impact — if someone is scrolling at speed, this stops them

CANVAS: 1536x1024px landscape. Left two-thirds = text + graphic. Right third = empty background.

Now write the complete gpt-image-1 prompt:`
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
          ],
        },
      ],
      max_tokens: 1500,
    })

    const prompt = completion.choices[0]?.message?.content?.trim() ?? ''
    if (!prompt) {
      return NextResponse.json({ error: 'GPT-4o returned empty prompt' }, { status: 500 })
    }

    const cleanedPrompt = prompt
      .replace(/<\|[^|]*\|>/g, '')
      .replace(/^\s*\n+/, '')
      .trim()

    if (!cleanedPrompt) {
      return NextResponse.json({ error: 'GPT-4o returned empty prompt after cleanup' }, { status: 500 })
    }

    return NextResponse.json({
      prompt: cleanedPrompt,
      mood,
      community,
      backgroundFile: bgRelative.replace(/\\/g, '/'),
      backgroundPreviewUrl: toDataUrl(bgBuffer, bgMime),
    })
  } catch (err) {
    console.error('[generate-prompt]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    )
  }
}
