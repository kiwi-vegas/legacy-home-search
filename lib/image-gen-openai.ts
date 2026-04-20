/**
 * Barry Jenkins Thumbnail Generator — Pure Sharp Compositing Pipeline
 *
 * The background photo is NEVER touched by AI. Ever.
 *
 * Pipeline:
 *   1. Load community photo from public/community-photos/[slug]/  (REQUIRED)
 *   2. sharp → resize to 1536×1024
 *   3. GPT-4o → writes a prompt describing text/graphics to render on a TRANSPARENT canvas
 *   4. gpt-image-1 images.generate() → generates ONLY the text overlay on a black background
 *   5. sharp → extract the text layer using 'screen' blend (drops the black, keeps bright text/graphics)
 *   6. sharp.composite() → text layer over community photo (background untouched)
 *   7. sharp.composite() → Barry's transparent PNG on the right side
 *   8. Upload to Sanity CDN
 *
 * Why this works when images.edit() didn't:
 *   images.edit() treats the input image as a canvas to modify — it always alters the background
 *   no matter what the prompt says. This pipeline never gives AI the background photo at all.
 *   AI only generates the text/graphics layer in isolation. Sharp does all compositing.
 */

import fs from 'fs'
import path from 'path'
import OpenAI from 'openai'
import { getSanityWriteClient } from './sanity-write'
import type { ScoredArticle } from './types'

// ─── BARRY'S PHOTO ───────────────────────────────────────────────────────────

const BARRY_TRANSPARENT_PATH = path.join(process.cwd(), 'public', 'Barry-AI-transparent.png')

function getBarryTransparent(): Buffer | null {
  try {
    if (!fs.existsSync(BARRY_TRANSPARENT_PATH)) return null
    return fs.readFileSync(BARRY_TRANSPARENT_PATH)
  } catch { return null }
}

// ─── COMMUNITY PHOTOS ────────────────────────────────────────────────────────

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp'])
const COMMUNITIES = ['Virginia Beach', 'Chesapeake', 'Norfolk', 'Suffolk', 'Hampton', 'Newport News']
const FALLBACK_COMMUNITY = 'Virginia Beach'

function detectCommunity(title: string): string {
  const lower = title.toLowerCase()
  const stripped = lower.replace(/hampton roads/g, '')
  for (const c of COMMUNITIES) {
    if (stripped.includes(c.toLowerCase())) return c
  }
  if (lower.includes('hampton roads')) return 'Hampton Roads'
  return FALLBACK_COMMUNITY
}

function getRequiredCommunityPhoto(community: string): { buffer: Buffer; community: string } | null {
  const candidates = community === FALLBACK_COMMUNITY
    ? [community]
    : [community, FALLBACK_COMMUNITY]

  for (const c of candidates) {
    try {
      const slug = c.toLowerCase().replace(/\s+/g, '-')
      const dir = path.join(process.cwd(), 'public', 'community-photos', slug)
      if (!fs.existsSync(dir)) continue
      const files = fs.readdirSync(dir).filter(f =>
        IMAGE_EXTENSIONS.has(path.extname(f).toLowerCase()) &&
        !fs.statSync(path.join(dir, f)).isDirectory()
      )
      if (!files.length) continue
      const chosen = files[Math.floor(Math.random() * files.length)]
      const buffer = fs.readFileSync(path.join(dir, chosen))
      console.log(`[image-gen-openai] Community photo: community-photos/${slug}/${chosen}`)
      return { buffer, community: c }
    } catch (err) {
      console.warn(`[image-gen-openai] Could not read photo for "${c}":`, err instanceof Error ? err.message : err)
    }
  }

  console.error('[image-gen-openai] No community photos found — aborting. Add photos to public/community-photos/.')
  return null
}

// ─── MOOD SYSTEM ─────────────────────────────────────────────────────────────

type ThumbnailMood =
  | 'shocked'
  | 'exciting-positive'
  | 'investment'
  | 'negative'
  | 'selling'
  | 'buying'
  | 'community'
  | 'neutral'

const MOOD_STYLES: Record<ThumbnailMood, { line1: string; line2: string; accent: string; overlay: string }> = {
  'shocked':           { line1: 'bright RED (#FF1A1A)',      line2: 'bright YELLOW (#FFE600)', accent: 'a bold red semi-transparent banner strip behind the text', overlay: 'dark red semi-transparent rectangle behind text block' },
  'exciting-positive': { line1: 'bright YELLOW (#FFE600)',   line2: 'pure WHITE (#FFFFFF)',    accent: 'a bold upward-pointing gold arrow graphic to the right of the text', overlay: 'dark semi-transparent rectangle behind text block' },
  'investment':        { line1: 'pure WHITE (#FFFFFF)',       line2: 'bright GOLD (#FFD700)',   accent: 'a bold gold dollar-sign badge or banner', overlay: 'dark semi-transparent rectangle behind text block' },
  'negative':          { line1: 'pure WHITE (#FFFFFF)',       line2: 'sky BLUE (#38BDF8)',      accent: 'a bold downward-pointing blue arrow graphic', overlay: 'dark semi-transparent rectangle behind text block' },
  'selling':           { line1: 'bright GREEN (#22C55E)',     line2: 'pure WHITE (#FFFFFF)',    accent: 'a bold green horizontal stripe behind the text', overlay: 'dark semi-transparent rectangle behind text block' },
  'buying':            { line1: 'pure WHITE (#FFFFFF)',       line2: 'sky BLUE (#38BDF8)',      accent: 'a bold blue house icon or banner badge', overlay: 'dark semi-transparent rectangle behind text block' },
  'community':         { line1: 'warm ORANGE (#FF8C00)',      line2: 'pure WHITE (#FFFFFF)',    accent: 'a bold location pin graphic above the text', overlay: 'dark semi-transparent rectangle behind text block' },
  'neutral':           { line1: 'bright YELLOW (#FFE600)',    line2: 'pure WHITE (#FFFFFF)',    accent: 'a bold horizontal yellow stripe behind the text block', overlay: 'dark semi-transparent rectangle behind text block' },
}

function detectMood(title: string, category: string): ThumbnailMood {
  const t = title.toLowerCase()
  if (/ vs\.? | versus | compared? to | which is /.test(t)) return 'neutral'
  if (/record|skyrocket|soar|surge|spike|shocking|unbelievable|incredible|historic/.test(t)) return 'shocked'
  if (/rising|rise|up \d|jump|climb|grow|increas|appreciat|boom|hot market|heating/.test(t)) return 'exciting-positive'
  if (/invest|roi|return|equity|wealth|profit|cash flow|rental income/.test(t)) return 'investment'
  if (/fall|drop|declin|cooling|slow|afford|challeng|difficult|concern|worry|problem/.test(t)) return 'negative'
  if (category === 'selling-tips' || /sell|list your|maximize value|top dollar/.test(t)) return 'selling'
  if (category === 'buying-tips' || /buy|first[- ]time|how to|guide|tips for/.test(t)) return 'buying'
  if (category === 'community-spotlight' || /neighborhood|community|living in|best place|why .* great/.test(t)) return 'community'
  return 'neutral'
}

// ─── STEP 3: Build the text-layer generation prompt ──────────────────────────
// This prompt goes to images.generate() — NOT images.edit().
// AI never sees the background photo. It only generates the text overlay.
// The output will be text/graphics on a BLACK background.
// Sharp then uses 'screen' blend mode to composite it — black drops out, bright text stays.

function buildTextLayerPrompt(
  article: ScoredArticle,
  community: string,
  mood: ThumbnailMood
): string {
  const style = MOOD_STYLES[mood]

  // Break the title into 2 punchy chunks
  const words = article.title.split(' ')
  const mid = Math.ceil(words.length / 2)
  const line1 = words.slice(0, mid).join(' ').toUpperCase()
  const line2 = words.slice(mid).join(' ').toUpperCase()

  return `Generate a text overlay graphic on a PURE BLACK background. This will be composited over a photo using screen blend mode, so the black areas will be invisible and only the bright text and graphics will show through.

CANVAS: 1536×1024px, pure black background (#000000). Nothing else in the background — just black.

LEFT ZONE ONLY (pixels 0–700 wide, top 500px tall): Place ALL elements here.
RIGHT ZONE (pixels 700–1536): Leave completely black — empty.

TEXT BLOCK (required):
- Line 1: "${line1}"
  - Color: ${style.line1}
  - Size: 110–130px tall, bold condensed Impact/Bebas Neue style
  - Black stroke outline: 8px thick on every letter
  - Hard black drop shadow: 5px offset, no blur
- Line 2: "${line2}"
  - Color: ${style.line2}
  - Size: 95–115px tall, same bold condensed font
  - Black stroke outline: 8px thick
  - Hard black drop shadow: 5px offset, no blur
- Position: top-left area, starting around x=40, y=60
- Maximum 2 lines — do not add more lines

BACKGROUND BEHIND TEXT (required):
- ${style.overlay}
- Slightly larger than the text block
- Opacity ~60–70% — dark but not fully opaque
- Rounded corners are fine

GRAPHIC ACCENT (required — pick one):
- ${style.accent}
- Place it adjacent to the text block, within the left zone
- It should be bright and bold, visible against the black background

COMMUNITY LABEL (optional but nice):
- Small badge or pill shape: "${community}, VA" or "${community}"
- Place below the main text lines
- White or yellow text, small (40–50px), bold

DO NOT add: any background scene, landscape, buildings, sky, people, photos, or any imagery other than text and simple graphic elements on pure black.`
}

// ─── STEP 4: Generate text layer via images.generate() ───────────────────────
// Generates text/graphics on black. Sharp 'screen' blend makes black transparent.

async function generateTextLayer(
  openai: OpenAI,
  prompt: string
): Promise<Buffer | null> {
  try {
    console.log('[image-gen-openai] Generating text layer (black background, screen blend)...')
    const response = await openai.images.generate({
      model: 'gpt-image-1',
      prompt,
      n: 1,
      size: '1536x1024',
    })
    const b64 = response.data?.[0]?.b64_json
    if (b64) {
      const buf = Buffer.from(b64, 'base64')
      console.log(`[image-gen-openai] Text layer generated — ${Math.round(buf.length / 1024)}KB`)
      return buf
    }
    console.warn('[image-gen-openai] images.generate() returned no image')
  } catch (err) {
    console.error('[image-gen-openai] images.generate() error:', err instanceof Error ? err.message : err)
  }
  return null
}

// ─── STEP 5+6: Composite text layer over community photo ─────────────────────
// 'screen' blend: black (0,0,0) drops out completely, bright colors show through.
// The community photo background is completely untouched.

async function compositeTextOverBackground(
  backgroundBuffer: Buffer,
  textLayerBuffer: Buffer
): Promise<Buffer> {
  const sharp = (await import('sharp')).default

  // Resize background to exact canvas size
  const background = await sharp(backgroundBuffer)
    .resize(1536, 1024, { fit: 'cover', position: 'center' })
    .png()
    .toBuffer()

  // Resize text layer to match (should already be 1536×1024 but ensure it)
  const textLayer = await sharp(textLayerBuffer)
    .resize(1536, 1024, { fit: 'fill' })
    .png()
    .toBuffer()

  // Composite text over background using 'screen' blend — black becomes transparent
  const result = await sharp(background)
    .composite([{ input: textLayer, top: 0, left: 0, blend: 'screen' }])
    .png()
    .toBuffer()

  console.log(`[image-gen-openai] Text composited over background — ${Math.round(result.length / 1024)}KB`)
  return result
}

// ─── STEP 7: Composite Barry on the right side ───────────────────────────────

async function compositeBarry(
  backgroundBuffer: Buffer,
  barryTransparentBuffer: Buffer
): Promise<Buffer> {
  const sharp = (await import('sharp')).default

  const BARRY_W = 710
  const BARRY_H = 1024
  const LEFT_OFFSET = 1536 - BARRY_W // 826px from left

  const barryResized = await sharp(barryTransparentBuffer)
    .resize(BARRY_W, BARRY_H, { fit: 'cover', position: 'top' })
    .toBuffer()

  const result = await sharp(backgroundBuffer)
    .composite([{ input: barryResized, top: 0, left: LEFT_OFFSET, blend: 'over' }])
    .png()
    .toBuffer()

  console.log(`[image-gen-openai] Barry composited — final size ${Math.round(result.length / 1024)}KB`)
  return result
}

// ─── UPLOAD TO SANITY ────────────────────────────────────────────────────────

async function uploadToSanity(
  buffer: Buffer,
  filename = `openai-cover-${Date.now()}.png`
): Promise<{ _type: 'reference'; _ref: string } | null> {
  try {
    const client = getSanityWriteClient()
    const asset = await client.assets.upload('image', buffer, {
      filename,
      contentType: 'image/png',
    })
    console.log(`[image-gen-openai] Uploaded to Sanity: ${asset._id}`)
    return { _type: 'reference', _ref: asset._id }
  } catch (err) {
    console.error('[image-gen-openai] Sanity upload error:', err instanceof Error ? err.message : err)
    return null
  }
}

// ─── MAIN EXPORT: Card Thumbnail (1536×1024) ─────────────────────────────────

export async function generateAndUploadCoverImageOpenAI(
  article: ScoredArticle
): Promise<{ _type: 'reference'; _ref: string } | null> {
  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    const community = detectCommunity(article.title)
    const mood = detectMood(article.title, article.category)

    console.log(`[image-gen-openai] Article: "${article.title.slice(0, 60)}"`)
    console.log(`[image-gen-openai] Community: ${community} | Mood: ${mood}`)

    // Step 1: Load community photo (REQUIRED — no AI background ever)
    const photoResult = getRequiredCommunityPhoto(community)
    if (!photoResult) return null

    // Step 2: Resize background to thumbnail canvas
    const sharp = (await import('sharp')).default
    const background = await sharp(photoResult.buffer)
      .resize(1536, 1024, { fit: 'cover', position: 'center' })
      .png()
      .toBuffer()

    // Step 3: Build text-layer prompt (AI never sees the background)
    const textPrompt = buildTextLayerPrompt(article, photoResult.community, mood)

    // Step 4: Generate text layer on black background
    const textLayer = await generateTextLayer(openai, textPrompt)
    if (!textLayer) return null

    // Step 5+6: Composite text over the real community photo
    const withText = await compositeTextOverBackground(background, textLayer)

    // Step 7: Composite Barry on the right side
    const barryBuffer = getBarryTransparent()
    let finalBuffer: Buffer

    if (barryBuffer) {
      console.log('[image-gen-openai] Compositing Barry (pixel-exact transparent PNG)')
      finalBuffer = await compositeBarry(withText, barryBuffer)
    } else {
      console.warn('[image-gen-openai] Barry-AI-transparent.png not found — skipping Barry composite')
      finalBuffer = withText
    }

    return await uploadToSanity(finalBuffer)
  } catch (err) {
    console.error('[image-gen-openai] Uncaught error:', err instanceof Error ? err.message : err)
    return null
  }
}

// ─── HERO BANNER (1920×480) ──────────────────────────────────────────────────

function buildHeroBannerTextPrompt(
  article: ScoredArticle,
  community: string,
  mood: ThumbnailMood
): string {
  const style = MOOD_STYLES[mood]

  const words = article.title.split(' ')
  const mid = Math.ceil(words.length / 2)
  const line1 = words.slice(0, mid).join(' ').toUpperCase()
  const line2 = words.slice(mid).join(' ').toUpperCase()

  return `Generate a text overlay graphic on a PURE BLACK background (#000000). This will be composited over a photo using screen blend mode — black areas become invisible, only bright text and graphics show through.

CANVAS: 1536×1024px (will be cropped to a wide banner afterward), PURE BLACK background. Nothing else.

LEFT ZONE ONLY (pixels 0–700 wide, top 400px tall): Place ALL elements here.
RIGHT ZONE (pixels 700–1536): Leave completely black — empty.

TEXT BLOCK:
- Line 1: "${line1}"
  - Color: ${style.line1}
  - Size: 70–85px tall, bold condensed Impact/Bebas Neue style
  - Black stroke: 6px, hard black drop shadow 4px
- Line 2: "${line2}"
  - Color: ${style.line2}
  - Size: 60–75px tall, same font
  - Black stroke: 6px, hard black drop shadow 4px
- Position: top-left, starting around x=40, y=40
- Maximum 2 lines

BACKGROUND BEHIND TEXT: ${style.overlay}, ~60% opacity

GRAPHIC ACCENT: ${style.accent}, bright, in the left zone

COMMUNITY LABEL: Small badge "${community}, VA", white/yellow text, 35–45px, below main text

DO NOT add any background imagery, landscapes, buildings, sky, or photos. Pure black with text and simple graphic elements only.`
}

export async function generateAndUploadHeroBannerOpenAI(
  article: ScoredArticle
): Promise<{ _type: 'reference'; _ref: string } | null> {
  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const sharp = (await import('sharp')).default

    const community = detectCommunity(article.title)
    const mood = detectMood(article.title, article.category)

    console.log(`[image-gen-openai] [hero-banner] Article: "${article.title.slice(0, 60)}"`)
    console.log(`[image-gen-openai] [hero-banner] Community: ${community} | Mood: ${mood}`)

    // Step 1: Load community photo
    const photoResult = getRequiredCommunityPhoto(community)
    if (!photoResult) return null

    // Step 2: Resize background to 1920×480
    const background = await sharp(photoResult.buffer)
      .resize(1920, 480, { fit: 'cover', position: 'center' })
      .png()
      .toBuffer()

    // Step 3: Build hero banner text prompt
    const textPrompt = buildHeroBannerTextPrompt(article, photoResult.community, mood)

    // Step 4: Generate text layer at 1536×1024 (gpt-image-1's closest wide format)
    const textLayer = await generateTextLayer(openai, textPrompt)
    if (!textLayer) return null

    // Step 5: Resize text layer to 1920×480 to match banner
    const textLayerResized = await sharp(textLayer)
      .resize(1920, undefined, { fit: 'outside' })
      .extract({ left: 0, top: 0, width: 1920, height: 480 })
      .png()
      .toBuffer()

    // Step 6: Composite text over background using screen blend
    const withText = await sharp(background)
      .composite([{ input: textLayerResized, top: 0, left: 0, blend: 'screen' }])
      .png()
      .toBuffer()

    // Step 7: Composite Barry on the right side (480×480, flush right)
    const barryBuffer = getBarryTransparent()
    let finalBuffer: Buffer

    if (barryBuffer) {
      const BARRY_W = 480
      const BARRY_H = 480
      const LEFT_OFFSET = 1920 - BARRY_W

      const barryResized = await sharp(barryBuffer)
        .resize(BARRY_W, BARRY_H, { fit: 'cover', position: 'top' })
        .toBuffer()

      finalBuffer = await sharp(withText)
        .composite([{ input: barryResized, top: 0, left: LEFT_OFFSET, blend: 'over' }])
        .png()
        .toBuffer()

      console.log(`[image-gen-openai] [hero-banner] Barry composited — ${Math.round(finalBuffer.length / 1024)}KB`)
    } else {
      console.warn('[image-gen-openai] [hero-banner] Barry-AI-transparent.png not found')
      finalBuffer = withText
    }

    return await uploadToSanity(finalBuffer, `openai-hero-banner-${Date.now()}.png`)
  } catch (err) {
    console.error('[image-gen-openai] [hero-banner] Uncaught error:', err instanceof Error ? err.message : err)
    return null
  }
}

// ─── COMBINED EXPORT ─────────────────────────────────────────────────────────

export type DualImageRefs = {
  coverImage: { _type: 'reference'; _ref: string } | null
  heroBannerImage: { _type: 'reference'; _ref: string } | null
}

export async function generateAndUploadBothImages(article: ScoredArticle): Promise<DualImageRefs> {
  const [coverImage, heroBannerImage] = await Promise.all([
    generateAndUploadCoverImageOpenAI(article),
    generateAndUploadHeroBannerOpenAI(article),
  ])
  return { coverImage, heroBannerImage }
}
