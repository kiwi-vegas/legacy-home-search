/**
 * Barry Jenkins Thumbnail Generator — OpenAI + Sharp Compositing Pipeline
 *
 * Pipeline:
 *   1. Keyword match  → mood/energy for this article
 *   2. GPT-4o vision  → writes a background+text-only prompt
 *      (sees community background photo + headline + mood — no Barry needed here)
 *   3. gpt-image-1 images.generate() → full-frame background + massive text
 *   4. sharp.composite() → layers Barry's transparent PNG on the right side
 *      Barry's face is 100% pixel-exact from the original photo — zero AI manipulation
 *   5. Sanity CDN → uploaded and referenced
 *
 * Fallback (if Barry-AI-transparent.png not found):
 *   → images.edit() with Barry's original photo + background-replacement prompt
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
  try {
    return fs.readFileSync(BARRY_PHOTO_PATH)
  } catch (err) {
    console.warn('[image-gen-openai] Could not load Barry photo:', err instanceof Error ? err.message : err)
    return null
  }
}

function getBarryTransparent(): Buffer | null {
  try {
    if (!fs.existsSync(BARRY_TRANSPARENT_PATH)) return null
    return fs.readFileSync(BARRY_TRANSPARENT_PATH)
  } catch {
    return null
  }
}

// ─── COMMUNITY PHOTOS ────────────────────────────────────────────────────────

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp'])

const COMMUNITIES = ['Virginia Beach', 'Chesapeake', 'Norfolk', 'Suffolk', 'Hampton', 'Newport News']

function detectCommunity(title: string): string {
  const lower = title.toLowerCase()
  for (const c of COMMUNITIES) {
    if (lower.includes(c.toLowerCase())) return c
  }
  return 'Virginia Beach'
}

function getRandomCommunityPhoto(community: string): Buffer | null {
  try {
    const slug = community.toLowerCase().replace(/\s+/g, '-')
    const dir = path.join(process.cwd(), 'public', 'community-photos', slug)
    if (!fs.existsSync(dir)) return null
    const files = fs.readdirSync(dir).filter(f => IMAGE_EXTENSIONS.has(path.extname(f).toLowerCase()))
    if (!files.length) return null
    const chosen = files[Math.floor(Math.random() * files.length)]
    const buf = fs.readFileSync(path.join(dir, chosen))
    console.log(`[image-gen-openai] Using community photo: community-photos/${slug}/${chosen}`)
    return buf
  } catch (err) {
    console.warn(`[image-gen-openai] Could not load community photo for "${community}":`, err instanceof Error ? err.message : err)
    return null
  }
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
  'shocked':
    'high-drama, jaw-dropping energy — urgent red/yellow text, intense atmosphere',
  'exciting-positive':
    'celebratory, high-energy — bold yellow text, bright vibrant scene',
  'investment':
    'confident, professional — white/gold text, premium cinematic warmth',
  'negative':
    'serious, cautionary — white/blue text, slightly cooler tones',
  'selling':
    'action-oriented, motivating — bold call-to-action energy, clean modern text',
  'buying':
    'welcoming, optimistic — friendly warm text and atmosphere',
  'community':
    'warm, local pride — inviting neighborhood feel, approachable text',
  'neutral':
    'clean, professional — clear bold text, strong contrast',
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

// ─── STEP 2a: GPT-4o writes a BACKGROUND + TEXT ONLY prompt ──────────────────
// Used when Barry-AI-transparent.png exists — no person in the generated image,
// Barry is composited in separately via sharp.

async function buildBackgroundPromptWithGPT4o(
  openai: OpenAI,
  article: ScoredArticle,
  community: string,
  mood: ThumbnailMood,
  bgPhoto: Buffer | null
): Promise<string | null> {
  try {
    const moodDesc = MOOD_DESCRIPTIONS[mood]

    const textInstruction = `You are a professional YouTube thumbnail designer. Write a prompt for gpt-image-1 to generate a 1536x1024 image that is the BACKGROUND + TEXT LAYER of a viral YouTube thumbnail. A real person (Barry Jenkins, a REALTOR®) will be composited on the RIGHT side separately — do NOT include any person in this generated image.

Article: "${article.title}"
Community: ${community}
Energy/mood: ${moodDesc}
${bgPhoto ? 'Image 1 (attached): the community background photo — describe its specific scene, landscape, colors, sky, and atmosphere in the prompt.' : ''}

The generated image must have:

1. ATMOSPHERIC FULL-FRAME BACKGROUND — ${bgPhoto ? 'based on Image 1 (describe it vividly: landmarks, colors, sky, time of day, any distinctive features you see)' : `a dramatic photorealistic ${community}, Virginia scene — waterfront, boardwalk, coastline, or neighborhood at golden hour`}. Cinematic color grading. ${moodDesc}. The right side of the frame should have slightly softer lighting or a subtle depth-of-field effect so a composited person will stand out naturally.

2. MASSIVE BOLD TEXT on the LEFT HALF ONLY — the article headline broken into 2–4 short punchy word-chunks. Each chunk should be as LARGE as possible — at least 18–22% of image height per major line. Use a heavy, condensed display font (Impact, Bebas Neue style). Apply all of these effects: bright YELLOW fill on major lines, pure WHITE fill on secondary lines, THICK BLACK outline (7–9px stroke), and a hard offset drop shadow. Numbers, dollar amounts, or emotional adjectives (like "RECORD", "SHOCKING", "$300K") should be even larger than surrounding text — break them out on their own line if needed.

3. ONE GRAPHIC ACCENT — choose whichever fits the mood: a bold colored stripe or translucent box behind part of the text (improves readability), a chunky arrow pointing right (toward where the person will be), or a badge/label element ("2026", "BREAKING", "MUST READ").

NO PERSON in the image. Only background + text + accent.

Write the complete gpt-image-1 prompt now. 4–6 sentences. Be very specific about text size and effects.`

    const content: OpenAI.Chat.ChatCompletionContentPart[] = []

    if (bgPhoto) {
      content.push({
        type: 'image_url',
        image_url: {
          url: `data:image/jpeg;base64,${bgPhoto.toString('base64')}`,
          detail: 'high',
        },
      })
    }

    content.push({ type: 'text', text: textInstruction })

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 700,
      messages: [{ role: 'user', content }],
    })

    const prompt = completion.choices[0]?.message?.content?.trim() ?? null
    if (prompt) console.log(`[image-gen-openai] GPT-4o background prompt: ${prompt.slice(0, 150)}...`)
    return prompt
  } catch (err) {
    console.error('[image-gen-openai] GPT-4o prompt error:', err instanceof Error ? err.message : err)
    return null
  }
}

// ─── STEP 3a: Generate background + text layer ───────────────────────────────

async function generateBackground(
  openai: OpenAI,
  prompt: string
): Promise<Buffer | null> {
  try {
    console.log('[image-gen-openai] Generating background + text layer...')
    const response = await openai.images.generate({
      model: 'gpt-image-1',
      prompt,
      n: 1,
      size: '1536x1024',
    })
    const b64 = response.data?.[0]?.b64_json
    if (b64) {
      const buf = Buffer.from(b64, 'base64')
      console.log(`[image-gen-openai] Background generated — ${Math.round(buf.length / 1024)}KB`)
      return buf
    }
  } catch (err) {
    console.error('[image-gen-openai] Background generation error:', err instanceof Error ? err.message : err)
  }
  return null
}

// ─── STEP 4a: Composite Barry on the right side ───────────────────────────────
// Barry's transparent PNG is resized to fill the right side of the 1536x1024 frame.
// cover + position top = zooms in to chest/face, crops lower body (removes chair remnant).
// His face is 100% original pixels — zero AI manipulation.

async function compositeBarry(
  backgroundBuffer: Buffer,
  barryTransparentBuffer: Buffer
): Promise<Buffer> {
  const sharp = (await import('sharp')).default

  // Barry occupies the right ~46% of the 1536px wide frame
  const BARRY_W = 710
  const BARRY_H = 1024
  const LEFT_OFFSET = 1536 - BARRY_W  // 826px

  // cover + top: fills 710x1024 by zooming in, anchoring head at top, cropping feet
  const barryResized = await sharp(barryTransparentBuffer)
    .resize(BARRY_W, BARRY_H, {
      fit: 'cover',
      position: 'top',
    })
    .toBuffer()

  const result = await sharp(backgroundBuffer)
    .composite([{
      input: barryResized,
      top: 0,
      left: LEFT_OFFSET,
      blend: 'over',
    }])
    .png()
    .toBuffer()

  console.log(`[image-gen-openai] Composited Barry on right side — ${Math.round(result.length / 1024)}KB`)
  return result
}

// ─── STEP 2b: GPT-4o writes an images.edit() prompt (fallback) ───────────────
// Used when Barry-AI-transparent.png is not available.
// Tells gpt-image-1 to keep Barry unchanged and only replace the background + add text.

async function buildEditPromptWithGPT4o(
  openai: OpenAI,
  article: ScoredArticle,
  community: string,
  mood: ThumbnailMood,
  barryPhoto: Buffer,
  bgPhoto: Buffer | null
): Promise<string | null> {
  try {
    const moodDesc = MOOD_DESCRIPTIONS[mood]

    const textInstruction = `You are a professional YouTube thumbnail designer writing a prompt for gpt-image-1 images.edit().

BASE IMAGE (Image ${bgPhoto ? '1' : '1'}, attached): Barry Jenkins, a REALTOR® — blonde-reddish hair, white round glasses, short beard, navy three-piece suit, blue tie, hands in pockets, smiling. He must remain 100% UNCHANGED.

Write a prompt that instructs gpt-image-1 to:

1. KEEP THE PERSON COMPLETELY UNCHANGED — same face, expression, glasses, beard, hair, suit, pose. Do NOT alter him in any way.

2. REPLACE the office background with: ${bgPhoto ? `the scene from the attached community photo (Image 2 — describe it vividly: landscape, colors, sky, time of day, landmarks)` : `a dramatic ${community}, Virginia scene at golden hour`}. Atmospheric: cinematic, slightly darkened edges. ${moodDesc}.

3. ADD MASSIVE text LEFT side: "${article.title}" in 2–4 short punchy chunks. Each line 18–22% of image height. Heavy condensed font. Yellow + white fills, thick black stroke (7–9px), hard shadow. Numbers/key words even larger.

4. Add one graphic accent (badge, stripe, or arrow).

Write now. 4–6 sentences. Lead with "Keep the person in this photo completely unchanged."`

    const content: OpenAI.Chat.ChatCompletionContentPart[] = [
      {
        type: 'image_url',
        image_url: { url: `data:image/jpeg;base64,${barryPhoto.toString('base64')}`, detail: 'high' },
      },
    ]
    if (bgPhoto) {
      content.push({
        type: 'image_url',
        image_url: { url: `data:image/jpeg;base64,${bgPhoto.toString('base64')}`, detail: 'high' },
      })
    }
    content.push({ type: 'text', text: textInstruction })

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 700,
      messages: [{ role: 'user', content }],
    })

    const prompt = completion.choices[0]?.message?.content?.trim() ?? null
    if (prompt) console.log(`[image-gen-openai] GPT-4o edit prompt: ${prompt.slice(0, 150)}...`)
    return prompt
  } catch (err) {
    console.error('[image-gen-openai] GPT-4o prompt error:', err instanceof Error ? err.message : err)
    return null
  }
}

// ─── STEP 3b: images.edit() fallback ─────────────────────────────────────────

async function generateWithEdit(
  openai: OpenAI,
  prompt: string,
  barryPhoto: Buffer
): Promise<Buffer | null> {
  try {
    console.log('[image-gen-openai] Calling gpt-image-1 via images.edit() (fallback)...')
    const response = await openai.images.edit({
      model: 'gpt-image-1',
      image: await toFile(barryPhoto, 'barry.jpg', { type: 'image/jpeg' }),
      prompt,
      n: 1,
      size: '1536x1024',
    })
    const b64 = response.data?.[0]?.b64_json
    if (b64) {
      const buf = Buffer.from(b64, 'base64')
      console.log(`[image-gen-openai] images.edit() SUCCESS — ${Math.round(buf.length / 1024)}KB`)
      return buf
    }
  } catch (err) {
    console.error('[image-gen-openai] images.edit() error:', err instanceof Error ? err.message : err)
  }

  // Last resort: text-only generate
  try {
    console.log('[image-gen-openai] Last resort: images.generate text-only...')
    const response = await openai.images.generate({
      model: 'gpt-image-1',
      prompt,
      n: 1,
      size: '1536x1024',
    })
    const b64 = response.data?.[0]?.b64_json
    if (b64) return Buffer.from(b64, 'base64')
  } catch (err) {
    console.error('[image-gen-openai] images.generate error:', err instanceof Error ? err.message : err)
  }

  return null
}

// ─── STEP 5: Upload to Sanity ─────────────────────────────────────────────────

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

    const bgPhoto = getRandomCommunityPhoto(community)
    const barryTransparent = getBarryTransparent()

    let imageBuffer: Buffer | null = null

    if (barryTransparent) {
      // ── PRIMARY: composite approach (Barry pixel-exact, zero AI face manipulation) ──
      console.log('[image-gen-openai] Using compositing approach (Barry-AI-transparent.png found)')
      const bgPrompt = await buildBackgroundPromptWithGPT4o(openai, article, community, mood, bgPhoto)
      if (!bgPrompt) return null

      const background = await generateBackground(openai, bgPrompt)
      if (!background) return null

      imageBuffer = await compositeBarry(background, barryTransparent)
    } else {
      // ── FALLBACK: images.edit() (Barry may be slightly altered by AI) ──
      console.log('[image-gen-openai] Barry-AI-transparent.png not found — falling back to images.edit()')
      const barryPhoto = getBarryPhoto()
      if (!barryPhoto) {
        console.error('[image-gen-openai] Barry photo not found — cannot generate thumbnail')
        return null
      }

      const editPrompt = await buildEditPromptWithGPT4o(openai, article, community, mood, barryPhoto, bgPhoto)
      if (!editPrompt) return null

      imageBuffer = await generateWithEdit(openai, editPrompt, barryPhoto)
    }

    if (!imageBuffer) return null
    return await uploadToSanity(imageBuffer)
  } catch (err) {
    console.error('[image-gen-openai] Uncaught error:', err instanceof Error ? err.message : err)
    return null
  }
}
