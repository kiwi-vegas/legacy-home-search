/**
 * Barry Jenkins Thumbnail Generator — OpenAI Pipeline
 *
 * Pipeline:
 *   1. Keyword match  → Barry's expression for this article
 *   2. GPT-4o vision  → writes the full image generation prompt
 *      (sees Barry's photo + community background + headline + expression)
 *   3. gpt-image-1    → generates the thumbnail (Barry + background + text overlays)
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

// ─── BARRY'S EXPRESSION ──────────────────────────────────────────────────────

type BarryExpression =
  | 'shocked'
  | 'two-thumbs-up'
  | 'pointing-up'
  | 'happy'
  | 'thumbs-up'
  | 'thumbs-down'
  | 'weighing'

const EXPRESSION_DESCRIPTIONS: Record<BarryExpression, string> = {
  'shocked':
    'shocked expression — wide eyes, mouth wide open in disbelief, both hands raised to his cheeks',
  'two-thumbs-up':
    'big enthusiastic grin with both thumbs raised high, eyebrows up in excitement',
  'pointing-up':
    'pointing one finger confidently upward toward the sky, with a bold assured smile',
  'happy':
    'warm, open, welcoming smile — approachable and friendly, slightly leaning forward',
  'thumbs-up':
    'single thumbs up with a confident nod and a professional smile',
  'thumbs-down':
    'single thumbs down, brow slightly furrowed, an honest "not great" expression',
  'weighing':
    'both hands out with palms facing up, weighing invisible options — a thoughtful "hmm, which one?" expression',
}

function detectExpression(title: string, category: string): BarryExpression {
  const t = title.toLowerCase()

  // Comparison / versus articles
  if (/ vs\.? | versus | or | compared? to | which is /.test(t)) return 'weighing'

  // Shocking / extreme stats
  if (/record|skyrocket|soar|surge|spike|shocking|unbelievable|incredible|historic/.test(t)) return 'shocked'

  // Strongly rising prices / values
  if (/rising|rise|up \d|jump|climb|grow|increas|appreciat|boom|hot market|heating/.test(t)) return 'two-thumbs-up'

  // Investment / returns / equity
  if (/invest|roi|return|equity|wealth|profit|cash flow|rental income/.test(t)) return 'pointing-up'

  // Negative / falling / challenges
  if (/fall|drop|declin|cooling|slow|afford|challeng|difficult|concern|worry|problem/.test(t)) return 'thumbs-down'

  // Selling tips / sell your home
  if (category === 'selling-tips' || /sell|list your|maximize value|top dollar/.test(t)) return 'thumbs-up'

  // Buying tips / guides
  if (category === 'buying-tips' || /buy|first[- ]time|how to|guide|tips for/.test(t)) return 'happy'

  // Community spotlight
  if (category === 'community-spotlight' || /neighborhood|community|living in|best place|why .* great/.test(t)) return 'happy'

  return 'happy'
}

// ─── STEP 2: GPT-4o writes the image prompt ──────────────────────────────────

async function buildPromptWithGPT4o(
  openai: OpenAI,
  article: ScoredArticle,
  community: string,
  expression: BarryExpression,
  barryPhoto: Buffer,
  bgPhoto: Buffer | null
): Promise<string | null> {
  try {
    const expressionDesc = EXPRESSION_DESCRIPTIONS[expression]

    const textInstruction = `You are a creative director for a Hampton Roads real estate brand. Your job is to write a single image EDITING prompt for gpt-image-1.

The input image is a photo of Barry Jenkins, a professional REALTOR® in a navy suit. We are EDITING this photo into a wide 16:9 blog thumbnail. Barry MUST remain the main subject — his face, glasses, hair, and suit should stay intact.

Article headline: "${article.title}"
Community: ${community}
New expression for Barry: ${expressionDesc}

Write an editing prompt that instructs gpt-image-1 to:
1. KEEP Barry Jenkins exactly as he appears — same face, glasses, hair, navy suit — but change his expression and pose to: ${expressionDesc}
2. Place Barry in the LEFT THIRD of a wide 16:9 landscape frame
3. Replace the background entirely with: ${bgPhoto ? `the community scene shown in the second reference image — enhance it with warm cinematic golden-hour color grading, keeping any recognizable landmarks visible` : `a cinematic ${community}, Virginia scene at golden hour — coastal or neighborhood`}
4. Render the word "${community}" as large bold white or gold lettering in the upper-RIGHT area of the frame
5. Below that, add a 3–5 word punchy hook from the headline in clean bold sans-serif
6. Add one simple graphic element that fits the article tone (upward arrow for good news, dollar sign for value, checkmark for tips)

The result must feel like a YouTube thumbnail — bold, emotional, immediately readable.

Write the editing prompt now. One paragraph. No labels, no headers, just the prompt.`

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
      max_tokens: 600,
      messages: [{ role: 'user', content }],
    })

    const prompt = completion.choices[0]?.message?.content?.trim() ?? null
    if (prompt) console.log(`[image-gen-openai] GPT-4o prompt preview: ${prompt.slice(0, 120)}...`)
    return prompt
  } catch (err) {
    console.error('[image-gen-openai] GPT-4o prompt error:', err instanceof Error ? err.message : err)
    return null
  }
}

// ─── STEP 3: gpt-image-1 edits Barry's photo into the thumbnail ──────────────
// images.edit() takes Barry's photo as the literal base — his face is guaranteed
// to be in the result because we're editing his photo, not generating from scratch.

async function generateWithGptImage1(
  openai: OpenAI,
  prompt: string,
  barryPhoto: Buffer,
  _bgPhoto: Buffer | null
): Promise<Buffer | null> {
  // Primary: images.edit() with Barry's photo as the base image
  try {
    console.log('[image-gen-openai] Calling gpt-image-1 images.edit() with Barry photo as base...')

    const imageFile = await toFile(barryPhoto, 'barry.jpg', { type: 'image/jpeg' })

    const response = await openai.images.edit({
      model: 'gpt-image-1',
      image: imageFile,
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
    console.warn('[image-gen-openai] images.edit() returned no image data — falling back')
  } catch (err) {
    console.error('[image-gen-openai] images.edit() error:', err instanceof Error ? err.message : err)
  }

  // Fallback: images.generate (text-only — Barry described in prompt but no photo reference)
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
    const expression = detectExpression(article.title, article.category)

    console.log(`[image-gen-openai] Article: "${article.title.slice(0, 60)}"`)
    console.log(`[image-gen-openai] Community: ${community} | Expression: ${expression}`)

    const barryPhoto = getBarryPhoto()
    if (!barryPhoto) {
      console.error('[image-gen-openai] Barry photo not found — cannot generate thumbnail')
      return null
    }

    const bgPhoto = getRandomCommunityPhoto(community)

    const prompt = await buildPromptWithGPT4o(openai, article, community, expression, barryPhoto, bgPhoto)
    if (!prompt) return null

    const imageBuffer = await generateWithGptImage1(openai, prompt, barryPhoto, bgPhoto)
    if (!imageBuffer) return null

    return await uploadToSanity(imageBuffer)
  } catch (err) {
    console.error('[image-gen-openai] Uncaught error:', err instanceof Error ? err.message : err)
    return null
  }
}
