/**
 * Barry Jenkins Thumbnail Generator — Sharp Compositing Pipeline
 *
 * Pipeline:
 *   1. Load community photo from public/community-photos/[slug]/  (REQUIRED)
 *      → If no photo found, return null — never generate an AI background
 *   2. sharp → resize community photo to 1536×1024
 *   3. GPT-4o vision → writes a tight images.edit() prompt
 *      (sees the real community photo + headline + mood)
 *      → Instructs AI to ONLY add text to the LEFT half — never touch the background or right side
 *   4. images.edit() → adds YouTube-style text overlays to the LEFT half ONLY
 *      → Background is preserved as-is (edit mode, not generation mode)
 *      → Right half is explicitly off-limits
 *   5. sharp.composite() → Barry's transparent PNG stamped pixel-exact on the right side
 *      Barry's face is 100% original pixels — zero AI manipulation.
 *   6. Sanity CDN → uploaded and referenced
 *
 * Why images.edit() and NOT the Responses API:
 *   The Responses API treats the community photo as a STYLE REFERENCE and generates
 *   a new background that "looks like" the scene. images.edit() treats it as a CANVAS
 *   and modifies only what the prompt requests — preserving the real landmark photo.
 *
 * Fallback (if images.edit() fails):
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
  // Strip "hampton roads" before checking "hampton" to avoid false positives
  const stripped = lower.replace(/hampton roads/g, '')
  for (const c of COMMUNITIES) {
    if (stripped.includes(c.toLowerCase())) return c
  }
  // If "hampton roads" was in the title (a regional/general post), use Hampton Roads folder
  if (lower.includes('hampton roads')) return 'Hampton Roads'
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

const MOOD_STYLES: Record<ThumbnailMood, { textColors: string; accent: string; atmosphere: string }> = {
  'shocked':           { textColors: 'bright RED on line 1, bright YELLOW on line 2', accent: 'bold red badge or "BREAKING" banner', atmosphere: 'darken the background slightly for urgency' },
  'exciting-positive': { textColors: 'bright YELLOW on line 1, pure WHITE on line 2', accent: 'upward arrow or gold star burst', atmosphere: 'warm golden glow behind the text area' },
  'investment':        { textColors: 'pure WHITE on line 1, bright GOLD (#FFD700) on line 2', accent: 'premium gold banner or dollar badge', atmosphere: 'subtle cinematic warm vignette' },
  'negative':          { textColors: 'pure WHITE on line 1, light BLUE on line 2', accent: 'downward arrow or cautionary stripe', atmosphere: 'slightly cooler/darker tone over background' },
  'selling':           { textColors: 'bright GREEN on line 1, pure WHITE on line 2', accent: 'bold green stripe behind text', atmosphere: 'slight warm overlay' },
  'buying':            { textColors: 'pure WHITE on line 1, sky BLUE on line 2', accent: 'blue banner or house icon badge', atmosphere: 'clean bright feel, minimal darkening' },
  'community':         { textColors: 'warm ORANGE on line 1, pure WHITE on line 2', accent: 'location pin or neighborhood badge', atmosphere: 'warm inviting glow, minimal darkening' },
  'neutral':           { textColors: 'bright YELLOW on line 1, pure WHITE on line 2', accent: 'bold horizontal stripe behind text block', atmosphere: 'subtle dark vignette behind text only' },
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

// ─── STEP 3: GPT-4o writes the images.edit() prompt ─────────────────────────
// GPT-4o sees the real community photo and writes a tight, focused prompt.
// The prompt tells images.edit() EXACTLY what to add and EXACTLY what NOT to touch.
// Key: we ask for text ONLY — no background changes, no people, no right side touches.

async function buildPromptWithGPT4o(
  openai: OpenAI,
  article: ScoredArticle,
  community: string,
  mood: ThumbnailMood,
  communityPhoto: Buffer
): Promise<string | null> {
  try {
    const style = MOOD_STYLES[mood]

    const instruction = `You are a YouTube thumbnail text designer. The attached image is the EXACT background photo that will be used as-is for a real estate blog thumbnail (1536×1024px). Your job is to write a prompt for an image editing AI (images.edit) that adds text overlays ONLY — nothing else changes.

STRICT ZONE RULES:
- LEFT HALF ONLY (pixels 0–768 wide): This is where all text and graphic accents go.
- RIGHT HALF (pixels 769–1536): COMPLETELY OFF-LIMITS. No text, no graphics, no alterations of any kind. A person will be composited here separately.
- TOP 55% ONLY (top 563px tall): All elements must fit within this band. Nothing below this line will be visible in the published hero image.
- DO NOT ALTER THE BACKGROUND — not the colors, not the scene, not the lighting. The photo stays exactly as-is.
- DO NOT ADD ANY PEOPLE, faces, silhouettes, or figures.

TEXT REQUIREMENTS (non-negotiable):
- Break the headline into 2 lines MAX (3 lines absolute maximum if unavoidable)
- Each line: ~100–120px tall (roughly 10–12% of image height) — this must look MASSIVE
- Font style: bold, condensed, Impact or Bebas Neue style — NO thin or script fonts
- Line 1 color: ${style.textColors.split(',')[0].trim()}
- Line 2 color: ${style.textColors.split(',')[1]?.trim() ?? 'pure WHITE'}
- Text stroke: thick BLACK outline, 6–8px, on every letter
- Drop shadow: hard black, 4–5px offset, no blur
- Anchor position: TOP-LEFT corner of the left half — text starts near the top

GRAPHIC ACCENT (required — exactly one):
- ${style.accent}
- Must be in the LEFT half, within the top 55% of the image height
- ${style.atmosphere}

Article headline to display: "${article.title}"
Community: ${community}, Virginia

Now write the complete images.edit() prompt. Be specific and direct. One paragraph, no headers, no bullet points.`

    const content: OpenAI.Chat.ChatCompletionContentPart[] = [
      {
        type: 'image_url',
        image_url: {
          url: `data:image/jpeg;base64,${communityPhoto.toString('base64')}`,
          detail: 'high',
        },
      },
      { type: 'text', text: instruction },
    ]

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 600,
      messages: [{ role: 'user', content }],
    })

    const prompt = completion.choices[0]?.message?.content?.trim() ?? null
    if (prompt) console.log(`[image-gen-openai] GPT-4o prompt (first 200 chars): ${prompt.slice(0, 200)}...`)
    return prompt
  } catch (err) {
    console.error('[image-gen-openai] GPT-4o prompt error:', err instanceof Error ? err.message : err)
    return null
  }
}

// ─── STEP 4: images.edit() — add text to community photo canvas ───────────────
// images.edit() modifies the existing photo rather than generating a new scene.
// This is the correct API for preserving the real community background.

async function generateWithImagesEdit(
  openai: OpenAI,
  communityPhotoBuffer: Buffer,
  prompt: string
): Promise<Buffer | null> {
  try {
    console.log('[image-gen-openai] Calling gpt-image-1 via images.edit() (preserves real community photo)...')

    // images.edit() requires a PNG, so convert if needed
    const sharp = (await import('sharp')).default
    const pngBuffer = await sharp(communityPhotoBuffer).png().toBuffer()

    const { toFile } = await import('openai')
    const imageFile = await toFile(pngBuffer, 'community-background.png', { type: 'image/png' })

    const response = await openai.images.edit({
      model: 'gpt-image-1',
      image: imageFile,
      prompt: `IMPORTANT: Do NOT alter the background scene in any way. Do NOT change colors, lighting, or composition. Do NOT add any people or figures. Only add the following text and graphic elements to the LEFT HALF of the image within the top 55% of the frame:\n\n${prompt}`,
      n: 1,
      size: '1536x1024',
    })

    const b64 = response.data?.[0]?.b64_json
    if (b64) {
      const buf = Buffer.from(b64, 'base64')
      console.log(`[image-gen-openai] images.edit() SUCCESS — ${Math.round(buf.length / 1024)}KB`)
      return buf
    }
    console.warn('[image-gen-openai] images.edit() returned no image — falling back to images.generate()')
  } catch (err) {
    console.error('[image-gen-openai] images.edit() error:', err instanceof Error ? err.message : err)
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

    // GPT-4o writes the tight images.edit() prompt (sees the actual community photo)
    const thumbnailPrompt = await buildPromptWithGPT4o(
      openai, article, photoResult.community, mood, communityCanvas
    )
    if (!thumbnailPrompt) return null

    // images.edit(): preserves real community photo, adds text to left half only
    const generated = await generateWithImagesEdit(openai, communityCanvas, thumbnailPrompt)
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

// ─── HERO BANNER: GPT-4o PROMPT BUILDER ──────────────────────────────────────
// Canvas: 1920×480 (4:1 ratio — very wide, short)
// LEFT 60% (0–1152px): text zone. RIGHT 40% (1152–1920px): off-limits (Barry composited separately).

async function generateHeroBannerPrompt(
  openai: OpenAI,
  article: ScoredArticle,
  community: string,
  mood: ThumbnailMood,
  communityPhoto: Buffer
): Promise<string | null> {
  try {
    const style = MOOD_STYLES[mood]

    const instruction = `You are a YouTube banner text designer. The attached image is the EXACT background photo that will be used as-is for a real estate blog hero banner (1920×480px — very wide and short, 4:1 aspect ratio). Your job is to write a prompt for an image editing AI (images.edit) that adds text overlays ONLY — nothing else changes.

STRICT ZONE RULES:
- LEFT 60% ONLY (pixels 0–1152 wide): This is where all text and graphic accents go.
- RIGHT 40% (pixels 1152–1920): COMPLETELY OFF-LIMITS. No text, no graphics, no alterations of any kind. A person (Barry) will be composited here separately.
- TOP 80% ONLY (top 384px tall of the 480px height): All elements must fit within this band. Nothing below this line.
- DO NOT ALTER THE BACKGROUND — not the colors, not the scene, not the lighting. The photo stays exactly as-is.
- DO NOT ADD ANY PEOPLE, faces, silhouettes, or figures.

TEXT REQUIREMENTS (non-negotiable):
- Break the headline into 2 lines MAX (this is a short banner — keep it tight)
- Each line: ~60–70px tall (roughly 13–15% of 480px image height) — text must be SMALL relative to this short banner
- Font style: bold, condensed, Impact or Bebas Neue style — NO thin or script fonts
- Line 1 color: ${style.textColors.split(',')[0].trim()}
- Line 2 color: ${style.textColors.split(',')[1]?.trim() ?? 'pure WHITE'}
- Text stroke: thick BLACK outline, 6–8px, on every letter
- Drop shadow: hard black, 4–5px offset, no blur
- Anchor position: TOP-LEFT corner of the left 60% — text starts near the top-left
- Text must remain within the top 80% of the banner height (top 384px)

GRAPHIC ACCENT (required — exactly one):
- ${style.accent}
- Must be in the LEFT 60%, within the top 80% of the banner height
- ${style.atmosphere}

Article headline to display: "${article.title}"
Community: ${community}, Virginia

Now write the complete images.edit() prompt. Be specific and direct. One paragraph, no headers, no bullet points.`

    const content: OpenAI.Chat.ChatCompletionContentPart[] = [
      {
        type: 'image_url',
        image_url: {
          url: `data:image/jpeg;base64,${communityPhoto.toString('base64')}`,
          detail: 'high',
        },
      },
      { type: 'text', text: instruction },
    ]

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 600,
      messages: [{ role: 'user', content }],
    })

    const prompt = completion.choices[0]?.message?.content?.trim() ?? null
    if (prompt) console.log(`[image-gen-openai] GPT-4o hero banner prompt (first 200 chars): ${prompt.slice(0, 200)}...`)
    return prompt
  } catch (err) {
    console.error('[image-gen-openai] GPT-4o hero banner prompt error:', err instanceof Error ? err.message : err)
    return null
  }
}

// ─── HERO BANNER EXPORT ───────────────────────────────────────────────────────

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

    // Community photo is REQUIRED
    const photoResult = getRequiredCommunityPhoto(community)
    if (!photoResult) return null

    // Step 1: Resize community photo to 1920×480 banner canvas
    const bannerCanvas = await sharp(photoResult.buffer)
      .resize(1920, 480, { fit: 'cover', position: 'center' })
      .jpeg({ quality: 95 })
      .toBuffer()

    // Step 2: GPT-4o writes the tight images.edit() prompt (sees actual community photo)
    const bannerPrompt = await generateHeroBannerPrompt(
      openai, article, photoResult.community, mood, bannerCanvas
    )
    if (!bannerPrompt) return null

    // Step 3: images.edit() — gpt-image-1 supports 1536x1024 (closest wide format).
    // We generate at 1536×1024, then sharp-crop to 1920×480 after:
    //   - resize to 1920 wide (maintaining aspect ratio)
    //   - crop to 480 tall from the top
    const pngBannerCanvas = await sharp(bannerCanvas).png().toBuffer()

    const { toFile } = await import('openai')
    const imageFile = await toFile(pngBannerCanvas, 'hero-banner-background.png', { type: 'image/png' })

    let generatedRaw: Buffer | null = null
    try {
      console.log('[image-gen-openai] [hero-banner] Calling gpt-image-1 via images.edit() at 1536×1024...')
      const response = await openai.images.edit({
        model: 'gpt-image-1',
        image: imageFile,
        prompt: `IMPORTANT: Do NOT alter the background scene in any way. Do NOT change colors, lighting, or composition. Do NOT add any people or figures. Only add the following text and graphic elements to the LEFT 60% of the image within the top 80% of the frame:\n\n${bannerPrompt}`,
        n: 1,
        size: '1536x1024',
      })
      const b64 = response.data?.[0]?.b64_json
      if (b64) {
        generatedRaw = Buffer.from(b64, 'base64')
        console.log(`[image-gen-openai] [hero-banner] images.edit() SUCCESS — ${Math.round(generatedRaw.length / 1024)}KB`)
      }
    } catch (err) {
      console.error('[image-gen-openai] [hero-banner] images.edit() error:', err instanceof Error ? err.message : err)
    }

    if (!generatedRaw) return null

    // Step 4: Crop 1536×1024 output → 1920×480
    // Resize to 1920px wide (aspect ~1.5x), then extract top 480px
    const cropped = await sharp(generatedRaw)
      .resize(1920, undefined, { fit: 'outside' })  // resize to at least 1920 wide
      .extract({ left: 0, top: 0, width: 1920, height: 480 })
      .png()
      .toBuffer()

    console.log(`[image-gen-openai] [hero-banner] Cropped to 1920×480 — ${Math.round(cropped.length / 1024)}KB`)

    // Step 5: Composite Barry on the RIGHT side of the banner
    // Barry: 480×480px (square, matching banner height), left offset = 1920 - 480 = 1440px
    const barryTransparent = getBarryTransparent()
    let finalBuffer: Buffer

    if (barryTransparent) {
      const BARRY_W = 480
      const BARRY_H = 480
      const LEFT_OFFSET = 1920 - BARRY_W // 1440px

      const barryResized = await sharp(barryTransparent)
        .resize(BARRY_W, BARRY_H, { fit: 'cover', position: 'top' })
        .toBuffer()

      finalBuffer = await sharp(cropped)
        .composite([{ input: barryResized, top: 0, left: LEFT_OFFSET, blend: 'over' }])
        .png()
        .toBuffer()

      console.log(`[image-gen-openai] [hero-banner] Barry composited — final size ${Math.round(finalBuffer.length / 1024)}KB`)
    } else {
      console.warn('[image-gen-openai] [hero-banner] Barry-AI-transparent.png not found — skipping composite')
      finalBuffer = cropped
    }

    // Step 6: Upload to Sanity
    try {
      const client = getSanityWriteClient()
      const asset = await client.assets.upload('image', finalBuffer, {
        filename: `openai-hero-banner-${Date.now()}.png`,
        contentType: 'image/png',
      })
      console.log(`[image-gen-openai] [hero-banner] Uploaded to Sanity: ${asset._id}`)
      return { _type: 'reference', _ref: asset._id }
    } catch (err) {
      console.error('[image-gen-openai] [hero-banner] Sanity upload error:', err instanceof Error ? err.message : err)
      return null
    }
  } catch (err) {
    console.error('[image-gen-openai] [hero-banner] Uncaught error:', err instanceof Error ? err.message : err)
    return null
  }
}

// ─── COMBINED DUAL-IMAGE TYPE + EXPORT ───────────────────────────────────────

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
