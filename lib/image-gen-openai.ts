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

    const textInstruction = `You are a professional YouTube thumbnail designer — the kind who makes thumbnails for MrBeast, Mark Rober, and top viral channels. You need to write a prompt for gpt-image-1 images.edit() that produces a HIGH-IMPACT, click-stopping thumbnail.

BASE IMAGE (Image 1, attached): Barry Jenkins, a REALTOR® — blonde-reddish hair, white round glasses, short beard, navy three-piece suit, blue tie, hands in pockets, smiling. He must remain 100% UNCHANGED — same face, expression, glasses, beard, hair, suit, pose. Do NOT alter the person even slightly.

Write a prompt that instructs gpt-image-1 to make ALL of the following changes:

─── TEXT (most important — make it MASSIVE) ───
Break "${article.title}" into 2–4 short punchy lines. Each line of text must be HUGE — at least 15–20% of the total image height per line. Use a heavy bold condensed font (Impact-style). Apply these stacked effects: bright YELLOW fill on some lines, pure WHITE fill on others (alternate for contrast), THICK BLACK stroke outline (6–8px), and a hard dark drop shadow offset diagonally. Key words (numbers, adjectives like "SHOCKING" or "RECORD") should be even larger than surrounding lines. Position the entire text block on the LEFT half of the image — filling it top to bottom.

─── BARRY'S PLACEMENT ───
Barry stays on the RIGHT side. Crop him from approximately chest/waist upward so his face and upper body fill the right half vertically — he should feel CLOSE and LARGE in the frame. Add a subtle rim light or edge glow around him so he pops off the background.

─── BACKGROUND ───
${bgPhoto
  ? `Replace the office background with the scene from Image 2 (describe it in vivid detail — the specific landscape, colors, time of day, sky, landmarks you can see in the photo). `
  : `Replace the office background with a dramatic ${community}, Virginia scene — waterfront, boardwalk, or landmark at golden hour. `
}Make it atmospheric: slightly darken the edges and the area behind the text so the text is always readable. Add subtle bokeh blur or light rays behind Barry for depth. The overall mood should feel: ${moodDesc}.

─── GRAPHIC ACCENTS (include at least one) ───
Choose whichever fits: a bold colored stripe or semi-transparent box behind part of the text; a large arrow graphic pointing toward the headline; a chunky badge or label (e.g. "2026" or "MUST READ"); or a bright neon edge highlight around Barry.

─── OVERALL FEEL ───
The result must look like a professional designed it in Photoshop specifically to go viral on YouTube — not a stock photo, not a corporate design. Every element should compete for attention. Maximum visual energy.

Write the complete images.edit() prompt now. 4–6 sentences, specific and detailed. Lead with the instruction to keep Barry unchanged.`

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
