/**
 * Barry Jenkins Thumbnail Generator — Responses API + Sharp Compositing Pipeline
 *
 * Pipeline:
 *   1. Load community photo from public/community-photos/[slug]/  (REQUIRED)
 *      → If no photo found, return null — never generate an AI background
 *   2. sharp → resize community photo to 1536×1024
 *   3. GPT-4o vision → writes a thumbnail design prompt
 *      (sees the real community photo + headline + mood)
 *   4. Responses API (openai.responses.create) → generates thumbnail
 *      community photo is passed as input_image reference — the output
 *      looks like the community scene with text overlays on the left.
 *      Barry is NOT an input here (avoids generating a different person).
 *   5. sharp.composite() → Barry's transparent PNG stamped on the right side.
 *      Barry's face is 100% original pixels — zero AI manipulation.
 *   6. Sanity CDN → uploaded and referenced
 *
 * This matches exactly what the user does manually in ChatGPT:
 *   upload community photo + ask for thumbnail → Responses API uses it as scene reference
 *   Barry is composited separately so his face is always pixel-exact.
 *
 * Fallback (if Responses API returns no image):
 *   → images.generate() text-only using the same prompt
 */

import fs from 'fs'
import path from 'path'
import OpenAI from 'openai'
import { getSanityWriteClient } from './sanity-write'
import type { ScoredArticle } from './types'

// ─── BARRY'S PHOTOS ──────────────────────────────────────────────────────────

const BARRY_TRANSPARENT_PATH = path.join(process.cwd(), 'public', 'Barry-AI-transparent.png')

function getBarryTransparent(): Buffer | null {
  try {
    if (!fs.existsSync(BARRY_TRANSPARENT_PATH)) return null
    return fs.readFileSync(BARRY_TRANSPARENT_PATH)
  } catch { return null }
}

// ─── COMMUNITY PHOTOS ────────────────────────────────────────────────────────
// These photos are REQUIRED. If none found, the pipeline aborts.

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
 * Returns null only if BOTH folders are empty — never falls back to AI generation.
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

  console.error('[image-gen-openai] No community photos found — cannot generate thumbnail. Add photos to public/community-photos/.')
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
  'shocked':           'urgent, jaw-dropping — red/yellow text, intense dramatic feel',
  'exciting-positive': 'celebratory, high-energy — bold yellow text, bright vibrant feel',
  'investment':        'confident, premium — white/gold text, cinematic warmth',
  'negative':          'serious, cautionary — white/blue text, slightly cooler tones',
  'selling':           'action-oriented, motivating — bold green/white text',
  'buying':            'welcoming, optimistic — warm blue/white text',
  'community':         'warm, local pride — orange/white, inviting neighborhood feel',
  'neutral':           'clean, professional — bold white + yellow, strong contrast',
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

// ─── STEP 3: GPT-4o writes the thumbnail design prompt ───────────────────────
// GPT-4o sees the real community photo and writes a Responses API prompt.
// The prompt asks the model to use the community photo as the scene reference
// and generate text overlays on the left — leaving the right side for Barry.

async function buildPromptWithGPT4o(
  openai: OpenAI,
  article: ScoredArticle,
  community: string,
  mood: ThumbnailMood,
  communityPhoto: Buffer
): Promise<string | null> {
  try {
    const moodDesc = MOOD_DESCRIPTIONS[mood]

    const textInstruction = `You are a professional YouTube thumbnail designer. The attached image is a real photo of ${community}, Virginia. It will be used as the background scene reference for a YouTube thumbnail (1536×1024px).

Write a single prompt for gpt-image-1 to generate a complete thumbnail that:

1. USES THE COMMUNITY PHOTO (Image 1) as the visual reference for the background scene. The generated background should look like this specific community — match the location, colors, sky, atmosphere, and any recognizable landmarks or features visible in the photo.

2. ADDS BOLD TEXT on the LEFT half of the image only. Break the headline into 2–3 short punchy word-chunks MAXIMUM. Each line should be 9–12% of the image height (about 90–120px tall). Use a heavy condensed display font (Impact / Bebas Neue style). Apply layered effects: bright YELLOW fill on main lines, pure WHITE fill on secondary lines, THICK BLACK stroke outline (6–8px), hard offset drop shadow. Add a dark semi-transparent overlay behind the text area so it reads clearly over the background.

3. KEEPS THE RIGHT HALF CLEAN — a real person (Barry Jenkins, a REALTOR®) will be composited onto the right side separately. Design the right side as clean background only — no text, no graphics, just the community scene continuing naturally.

4. ADDS ONE graphic accent near the text — a bold badge, colored banner, or arrow — within the top 50% of the image.

IMPORTANT SIZING CONSTRAINT: All text and graphics must stay within the TOP 55% of the image (top 563px). The thumbnail is displayed cropped at the top in the blog hero — nothing below that line will be visible.

Article headline: "${article.title}"
Mood/energy: ${moodDesc}

Write the complete gpt-image-1 prompt now. One focused paragraph, no headers.`

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
    if (prompt) console.log(`[image-gen-openai] GPT-4o prompt: ${prompt.slice(0, 150)}...`)
    return prompt
  } catch (err) {
    console.error('[image-gen-openai] GPT-4o prompt error:', err instanceof Error ? err.message : err)
    return null
  }
}

// ─── STEP 4: Responses API — generate thumbnail using community photo as reference
// This matches what ChatGPT does when you upload a background photo:
// the community photo is passed as input_image and the model generates a
// fresh composition that looks like that community scene.
// Barry is NOT passed here — he's composited afterward via sharp.

async function generateWithResponsesAPI(
  openai: OpenAI,
  communityPhotoBuffer: Buffer,
  prompt: string
): Promise<Buffer | null> {
  try {
    console.log('[image-gen-openai] Calling gpt-image-1 via Responses API (community photo as scene reference)...')

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await (openai as any).responses.create({
      model: 'gpt-image-1',
      input: [{
        role: 'user',
        content: [
          {
            type: 'input_image',
            image_url: `data:image/jpeg;base64,${communityPhotoBuffer.toString('base64')}`,
          },
          { type: 'input_text', text: prompt },
        ],
      }],
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const item of (response?.output ?? []) as any[]) {
      if (item?.type === 'image_generation_call' && item?.result) {
        const buf = Buffer.from(item.result as string, 'base64')
        console.log(`[image-gen-openai] Responses API SUCCESS — ${Math.round(buf.length / 1024)}KB`)
        return buf
      }
    }
    console.warn('[image-gen-openai] Responses API returned no image — falling back to text-only generate')
  } catch (err) {
    console.error('[image-gen-openai] Responses API error:', err instanceof Error ? err.message : err)
  }
  return null
}

// ─── STEP 4 FALLBACK: images.generate text-only ───────────────────────────────

async function generateTextOnly(
  openai: OpenAI,
  prompt: string
): Promise<Buffer | null> {
  try {
    console.log('[image-gen-openai] Falling back to images.generate (text-only)...')
    const response = await openai.images.generate({
      model: 'gpt-image-1',
      prompt,
      n: 1,
      size: '1536x1024',
    })
    const b64 = response.data?.[0]?.b64_json
    if (b64) {
      const buf = Buffer.from(b64, 'base64')
      console.log(`[image-gen-openai] images.generate SUCCESS — ${Math.round(buf.length / 1024)}KB`)
      return buf
    }
  } catch (err) {
    console.error('[image-gen-openai] images.generate error:', err instanceof Error ? err.message : err)
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

    // Community photo is REQUIRED
    const photoResult = getRequiredCommunityPhoto(community)
    if (!photoResult) return null

    // Resize to thumbnail canvas
    const communityCanvas = await resizeCommunityPhoto(photoResult.buffer)

    // GPT-4o writes the thumbnail design prompt (sees the actual community photo)
    const thumbnailPrompt = await buildPromptWithGPT4o(
      openai, article, photoResult.community, mood, communityCanvas
    )
    if (!thumbnailPrompt) return null

    // Responses API: community photo as scene reference → generates community-matching background + text
    const generated = await generateWithResponsesAPI(openai, communityCanvas, thumbnailPrompt)
      ?? await generateTextOnly(openai, thumbnailPrompt)
    if (!generated) return null

    // Composite Barry's exact pixels on the right side
    const barryTransparent = getBarryTransparent()
    let finalBuffer: Buffer

    if (barryTransparent) {
      console.log('[image-gen-openai] Compositing Barry (transparent PNG — pixel-exact)')
      finalBuffer = await compositeBarry(generated, barryTransparent)
    } else {
      console.warn('[image-gen-openai] Barry-AI-transparent.png not found — run: npx tsx scripts/create-barry-transparent.ts')
      finalBuffer = generated
    }

    return await uploadToSanity(finalBuffer)
  } catch (err) {
    console.error('[image-gen-openai] Uncaught error:', err instanceof Error ? err.message : err)
    return null
  }
}
