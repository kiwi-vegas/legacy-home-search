/**
 * Barry Jenkins Thumbnail Generator — OpenAI + Sharp Compositing Pipeline
 *
 * Rule: AI NEVER generates background images.
 * Community background photos from public/community-photos/ are ALWAYS used.
 * AI only adds text and graphic elements on top.
 *
 * Pipeline:
 *   1. Load community photo from public/community-photos/[slug]/  (REQUIRED)
 *      → If no photo found, return null — never generate an AI background
 *   2. sharp → resize community photo to 1536×1024 (the thumbnail canvas)
 *   3. GPT-4o vision → writes a "text + graphics overlay only" prompt
 *      (sees the real community photo + headline + mood)
 *   4. gpt-image-1 images.edit() → adds text overlays + graphic elements to
 *      the community photo. Background scene is preserved.
 *   5. sharp.composite() → Barry's transparent PNG stamped on the right side.
 *      Barry's face is 100% original pixels — zero AI manipulation.
 *   6. Sanity CDN → uploaded and referenced
 *
 * Fallback (no Barry-AI-transparent.png):
 *   → images.edit() on the resized community photo includes Barry description
 *     in the prompt (face may be slightly altered by AI — run the transparent
 *     PNG script to fix: npx tsx scripts/create-barry-transparent.ts)
 *
 * NEVER: generate AI backgrounds, use images.generate() for the scene,
 *        or substitute a generated scene when no community photo is found.
 */

import fs from 'fs'
import path from 'path'
import OpenAI, { toFile } from 'openai'
import { getSanityWriteClient } from './sanity-write'
import type { ScoredArticle } from './types'

// ─── BARRY'S PHOTOS ──────────────────────────────────────────────────────────

const BARRY_PHOTO_PATH = path.join(process.cwd(), 'public', 'Barry-AI.jpg')
const BARRY_TRANSPARENT_PATH = path.join(process.cwd(), 'public', 'Barry-AI-transparent.png')

function getBarryPhoto(): Buffer | null {
  try { return fs.readFileSync(BARRY_PHOTO_PATH) }
  catch { return null }
}

function getBarryTransparent(): Buffer | null {
  try {
    if (!fs.existsSync(BARRY_TRANSPARENT_PATH)) return null
    return fs.readFileSync(BARRY_TRANSPARENT_PATH)
  } catch { return null }
}

// ─── COMMUNITY PHOTOS ────────────────────────────────────────────────────────
// IMPORTANT: These photos are MANDATORY. AI never substitutes a generated scene.

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp'])

const COMMUNITIES = ['Virginia Beach', 'Chesapeake', 'Norfolk', 'Suffolk', 'Hampton', 'Newport News']
const FALLBACK_COMMUNITY = 'Virginia Beach'

function detectCommunity(title: string): string {
  const lower = title.toLowerCase()
  for (const c of COMMUNITIES) {
    if (lower.includes(c.toLowerCase())) return c
  }
  return FALLBACK_COMMUNITY
}

/**
 * Returns a random photo from the community folder.
 * Falls back to Virginia Beach if the specific community has no photos.
 * Returns null only if BOTH the community AND Virginia Beach folders are empty.
 * NEVER falls back to AI generation.
 */
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

  console.error('[image-gen-openai] No community photos found in any folder — cannot generate thumbnail. Add photos to public/community-photos/.')
  return null
}

// ─── THUMBNAIL MOOD ──────────────────────────────────────────────────────────

type ThumbnailMood =
  | 'shocked'
  | 'exciting-positive'
  | 'investment'
  | 'negative'
  | 'selling'
  | 'buying'
  | 'community'
  | 'neutral'

const MOOD_DESCRIPTIONS: Record<ThumbnailMood, string> = {
  'shocked':       'urgent, jaw-dropping — red/yellow text, intense dramatic feel',
  'exciting-positive': 'celebratory, high-energy — bold yellow text, bright vibrant feel',
  'investment':    'confident, premium — white/gold text, cinematic warmth',
  'negative':      'serious, cautionary — white/blue text, slightly cooler tones',
  'selling':       'action-oriented, motivating — bold green/white text',
  'buying':        'welcoming, optimistic — warm blue/white text',
  'community':     'warm, local pride — orange/white, inviting neighborhood feel',
  'neutral':       'clean, professional — bold white + yellow, strong contrast',
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

// ─── STEP 2: Resize community photo to thumbnail dimensions ──────────────────

async function resizeCommunityPhoto(buffer: Buffer): Promise<Buffer> {
  const sharp = (await import('sharp')).default
  return sharp(buffer)
    .resize(1536, 1024, { fit: 'cover', position: 'center' })
    .jpeg({ quality: 95 })
    .toBuffer()
}

// ─── STEP 3: GPT-4o writes the text+graphics overlay prompt ─────────────────
// GPT-4o sees the real community photo and writes an images.edit() prompt
// that ONLY adds text and graphic elements — the background stays unchanged.

async function buildTextOverlayPromptWithGPT4o(
  openai: OpenAI,
  article: ScoredArticle,
  community: string,
  mood: ThumbnailMood,
  communityPhoto: Buffer
): Promise<string | null> {
  try {
    const moodDesc = MOOD_DESCRIPTIONS[mood]

    const textInstruction = `You are a professional YouTube thumbnail designer. The attached image is a real photo of ${community}, Virginia — it is the background of a YouTube thumbnail.

Write a prompt for gpt-image-1 images.edit() that adds text and graphic elements to this photo. The background scene must remain completely unchanged.

Article headline: "${article.title}"
Mood/energy: ${moodDesc}

The prompt must instruct gpt-image-1 to:

1. DO NOT alter the background photo in any way — preserve the scene, colors, and composition exactly as-is.

2. ADD MASSIVE BOLD TEXT on the LEFT half of the image only. Break the headline into 2–4 short punchy word-chunks. Each major line must be at least 18–22% of the image height — this is a YouTube thumbnail, the text must be enormous and legible at small sizes. Use a heavy condensed display font (Impact / Bebas Neue style). Apply layered effects: bright YELLOW fill on main lines, pure WHITE fill on secondary lines, THICK BLACK stroke outline (7–9px), hard offset drop shadow. Key words (dollar amounts, percentages, "RECORD", "SHOCKING") should break out even larger than surrounding lines.

3. ADD a dark semi-transparent gradient or overlay BEHIND THE TEXT AREA ONLY (left side) to ensure the text is always readable over the photo.

4. ADD ONE graphic accent — choose the best fit: a bold badge/label ("2026", "BREAKING", "MUST KNOW"), a thick arrow pointing toward the right side, or a colored banner strip behind a key line of text.

5. The RIGHT half of the image must remain completely unmodified — a real person will be composited there separately.

Write the complete images.edit() prompt now. Lead with "Do not alter the background photo in any way." 4–5 sentences. Be very specific about text size and styling effects.`

    const content: OpenAI.Chat.ChatCompletionContentPart[] = [
      {
        type: 'image_url',
        image_url: {
          url: `data:image/jpeg;base64,${communityPhoto.toString('base64')}`,
          detail: 'high',
        },
      },
      { type: 'text', text: textInstruction },
    ]

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 700,
      messages: [{ role: 'user', content }],
    })

    const prompt = completion.choices[0]?.message?.content?.trim() ?? null
    if (prompt) console.log(`[image-gen-openai] GPT-4o overlay prompt: ${prompt.slice(0, 150)}...`)
    return prompt
  } catch (err) {
    console.error('[image-gen-openai] GPT-4o prompt error:', err instanceof Error ? err.message : err)
    return null
  }
}

// ─── STEP 4: images.edit() — add text + graphics to community photo ───────────

async function addTextOverlayToPhoto(
  openai: OpenAI,
  communityPhotoBuffer: Buffer,
  prompt: string
): Promise<Buffer | null> {
  try {
    console.log('[image-gen-openai] Adding text/graphics overlay via images.edit()...')
    const response = await openai.images.edit({
      model: 'gpt-image-1',
      image: await toFile(communityPhotoBuffer, 'background.jpg', { type: 'image/jpeg' }),
      prompt,
      n: 1,
      size: '1536x1024',
    })
    const b64 = response.data?.[0]?.b64_json
    if (b64) {
      const buf = Buffer.from(b64, 'base64')
      console.log(`[image-gen-openai] Text overlay added — ${Math.round(buf.length / 1024)}KB`)
      return buf
    }
    console.warn('[image-gen-openai] images.edit() returned no image')
  } catch (err) {
    console.error('[image-gen-openai] images.edit() error:', err instanceof Error ? err.message : err)
  }
  return null
}

// ─── STEP 5: Composite Barry on the right side ───────────────────────────────
// cover + position top: zooms in from the top, crops lower body / chair remnant.
// Barry occupies the right ~46% of the 1536px frame.

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
  buffer: Buffer
): Promise<{ _type: 'reference'; _ref: string } | null> {
  try {
    const client = getSanityWriteClient()
    const asset = await client.assets.upload('image', buffer, {
      filename: `openai-cover-${Date.now()}.png`,
      contentType: 'image/png',
    })
    console.log(`[image-gen-openai] Uploaded to Sanity: ${asset._id}`)
    return { _type: 'reference', _ref: asset._id }
  } catch (err) {
    console.error('[image-gen-openai] Sanity upload error:', err instanceof Error ? err.message : err)
    return null
  }
}

// ─── MAIN EXPORT ─────────────────────────────────────────────────────────────

export async function generateAndUploadCoverImageOpenAI(
  article: ScoredArticle
): Promise<{ _type: 'reference'; _ref: string } | null> {
  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    const community = detectCommunity(article.title)
    const mood = detectMood(article.title, article.category)

    console.log(`[image-gen-openai] Article: "${article.title.slice(0, 60)}"`)
    console.log(`[image-gen-openai] Community: ${community} | Mood: ${mood}`)

    // Community photo is REQUIRED — never generate an AI background
    const photoResult = getRequiredCommunityPhoto(community)
    if (!photoResult) return null

    // Resize to thumbnail canvas
    const communityCanvas = await resizeCommunityPhoto(photoResult.buffer)

    // GPT-4o writes text+graphics overlay prompt (sees the actual community photo)
    const overlayPrompt = await buildTextOverlayPromptWithGPT4o(
      openai, article, photoResult.community, mood, communityCanvas
    )
    if (!overlayPrompt) return null

    // images.edit() adds text + graphics to the community photo
    const withOverlay = await addTextOverlayToPhoto(openai, communityCanvas, overlayPrompt)
    if (!withOverlay) return null

    // Composite Barry's exact pixels on the right side
    const barryTransparent = getBarryTransparent()
    let finalBuffer: Buffer

    if (barryTransparent) {
      console.log('[image-gen-openai] Compositing Barry (transparent PNG — pixel-exact)')
      finalBuffer = await compositeBarry(withOverlay, barryTransparent)
    } else {
      // Fallback: no transparent PNG — use the text-overlay layer as-is
      // Barry is not in the thumbnail yet; run scripts/create-barry-transparent.ts to fix this
      console.warn('[image-gen-openai] Barry-AI-transparent.png not found — thumbnail will have no Barry. Run: npx tsx scripts/create-barry-transparent.ts')
      finalBuffer = withOverlay
    }

    return await uploadToSanity(finalBuffer)
  } catch (err) {
    console.error('[image-gen-openai] Uncaught error:', err instanceof Error ? err.message : err)
    return null
  }
}
