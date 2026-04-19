/**
 * Barry Jenkins Thumbnail Generator — OpenAI Pipeline
 *
 * Pipeline:
 *   1. Keyword match  → energy/mood for this article
 *   2. GPT-4o vision  → writes the image.edit() prompt
 *      (sees Barry's photo + community background + headline + mood)
 *      GPT-4o describes the community background in text so it can be
 *      referenced without needing a second image input to images.edit()
 *   3. gpt-image-1 images.edit() → edits Barry's photo:
 *      keeps him IDENTICAL, replaces background, adds MrBeast-style text
 *   4. Sanity CDN     → uploaded and referenced
 */

import fs from 'fs'
import path from 'path'
import OpenAI, { toFile } from 'openai'
import { getSanityWriteClient } from './sanity-write'
import type { ScoredArticle } from './types'

// ─── BARRY'S PHOTO ───────────────────────────────────────────────────────────

const BARRY_PHOTO_PATH = path.join(process.cwd(), 'public', 'Barry-AI.jpg')

function getBarryPhoto(): Buffer | null {
  try {
    return fs.readFileSync(BARRY_PHOTO_PATH)
  } catch (err) {
    console.warn('[image-gen-openai] Could not load Barry photo:', err instanceof Error ? err.message : err)
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
// Mood drives overall energy of the thumbnail (text style, background atmosphere)
// but does NOT change Barry's appearance — his photo is used as-is.

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
    'celebratory, high-energy — bold yellow text, bright vibrant feel, exciting',
  'investment':
    'confident, professional, upward-momentum — bold white/gold text, premium feel',
  'negative':
    'serious, honest, cautionary — darker tones, clear factual text styling',
  'selling':
    'action-oriented, motivating — bold call-to-action energy, clean modern text',
  'buying':
    'welcoming, approachable, optimistic — friendly warm text and atmosphere',
  'community':
    'warm, local pride, inviting — neighborhood feel, approachable text',
  'neutral':
    'clean, professional, informative — clear text with strong contrast',
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

// ─── STEP 2: GPT-4o writes the images.edit() prompt ─────────────────────────
// GPT-4o sees both photos. It writes an edit prompt that:
//   - Keeps Barry IDENTICAL (face, glasses, beard, hair, suit, pose — unchanged)
//   - Replaces the background (describes community bg from Image 2)
//   - Adds MrBeast-style bold text overlays on the left

async function buildPromptWithGPT4o(
  openai: OpenAI,
  article: ScoredArticle,
  community: string,
  mood: ThumbnailMood,
  barryPhoto: Buffer,
  bgPhoto: Buffer | null
): Promise<string | null> {
  try {
    const moodDesc = MOOD_DESCRIPTIONS[mood]

    const textInstruction = `You are a YouTube thumbnail designer writing a prompt for gpt-image-1 images.edit().

The base image (Image 1, attached) is a photo of Barry Jenkins, a REALTOR® — a man with blonde-reddish hair, white round glasses, a short beard, and a navy three-piece suit with a blue tie. He is standing with hands in pockets, smiling.

Your prompt must instruct gpt-image-1 to do THREE things:

1. KEEP THE PERSON IN IMAGE 1 COMPLETELY UNCHANGED. His face, eyes, expression, smile, glasses, beard, hair color, suit, tie, pocket square, pose, and body position must be 100% identical to the source photo. Do NOT alter the person in any way — not his expression, not his pose, not a single facial feature. He must look exactly like himself.

2. REPLACE the background (the office with city windows) with: ${bgPhoto
      ? `the scene visible in Image 2 (attached — the community background photo). Describe that specific scene in vivid detail in the prompt: the landscape, sky, time of day, lighting, colors, any recognizable landmarks or features you see.`
      : `a photorealistic ${community}, Virginia scene — waterfront boardwalk, coastal neighborhood, or local landmark at golden hour, with warm light and an authentic Hampton Roads feel.`
    } The background atmosphere should feel: ${moodDesc}.

3. ADD bold MrBeast-style text overlay on the LEFT half of the frame (the person stays on the RIGHT). The text is the article headline broken into 2–3 short punchy lines. Use bright yellow and white lettering with a thick dark drop-shadow outline. Headline: "${article.title}". Make the text large, readable, and high-contrast.

Write the complete images.edit() prompt now. One paragraph, no headers, no labels. Lead with the instruction to keep the person unchanged.`

    const content: OpenAI.Chat.ChatCompletionContentPart[] = [
      {
        type: 'image_url',
        image_url: {
          url: `data:image/jpeg;base64,${barryPhoto.toString('base64')}`,
          detail: 'high',
        },
      },
    ]

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
    if (prompt) console.log(`[image-gen-openai] GPT-4o prompt preview: ${prompt.slice(0, 150)}...`)
    return prompt
  } catch (err) {
    console.error('[image-gen-openai] GPT-4o prompt error:', err instanceof Error ? err.message : err)
    return null
  }
}

// ─── STEP 3: gpt-image-1 edits Barry's photo ─────────────────────────────────
// images.edit() keeps Barry's photo as the BASE — his face is always real.
// The prompt only asks to change the background and add text overlays.

async function generateWithGptImage1(
  openai: OpenAI,
  prompt: string,
  barryPhoto: Buffer
): Promise<Buffer | null> {
  // Primary: images.edit() with Barry's actual photo as the base
  try {
    console.log('[image-gen-openai] Calling gpt-image-1 via images.edit()...')

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
    console.warn('[image-gen-openai] images.edit() returned no image — falling back')
  } catch (err) {
    console.error('[image-gen-openai] images.edit() error:', err instanceof Error ? err.message : err)
  }

  // Fallback: images.generate text-only
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

// ─── STEP 4: Upload to Sanity ─────────────────────────────────────────────────

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

    const barryPhoto = getBarryPhoto()
    if (!barryPhoto) {
      console.error('[image-gen-openai] Barry photo not found — cannot generate thumbnail')
      return null
    }

    const bgPhoto = getRandomCommunityPhoto(community)

    const prompt = await buildPromptWithGPT4o(openai, article, community, mood, barryPhoto, bgPhoto)
    if (!prompt) return null

    const imageBuffer = await generateWithGptImage1(openai, prompt, barryPhoto)
    if (!imageBuffer) return null

    return await uploadToSanity(imageBuffer)
  } catch (err) {
    console.error('[image-gen-openai] Uncaught error:', err instanceof Error ? err.message : err)
    return null
  }
}
