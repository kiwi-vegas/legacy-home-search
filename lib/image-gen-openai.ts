/**
 * Barry Jenkins Thumbnail Generator — 2-Step Compositing Pipeline
 *
 * Pipeline:
 *   1. Detect community + mood + template from article metadata (deterministic)
 *   2. Build a scene-only prompt — NO person, NO figure, right third reserved as empty atmosphere,
 *      with the community's landmarks described in text
 *   3. gpt-image-1 generates the scene (background + text + graphics on left/center only)
 *      via images.generate() — no reference image
 *   4. Sharp composites Barry's exact transparent PNG onto the right side with a soft left-edge fade
 *   5. Upload to Sanity CDN
 *
 * Why this works:
 *   Previous versions asked gpt-image-1 to recreate Barry from a reference photo. His likeness
 *   drifted every generation (wrong face, wrong glasses, wrong beard). By generating the scene
 *   without him and compositing his real PNG in Sharp, Barry is always pixel-exact.
 */

import fs from 'fs'
import path from 'path'
import OpenAI from 'openai'
import { getSanityWriteClient } from './sanity-write'
import type { ScoredArticle } from './types'

// ─── SHARED TYPES ────────────────────────────────────────────────────────────

export type SanityImageRef = { _type: 'reference'; _ref: string }

export type DualImageRefs = {
  coverImage: SanityImageRef | null
  heroBannerImage: SanityImageRef | null
}

type AssetType = 'card' | 'hero'

// ─── BARRY'S PHOTO(S) ────────────────────────────────────────────────────────

const BARRY_DIR = path.join(process.cwd(), 'public')
const DEFAULT_BARRY_FILE = 'Barry-AI-transparent.png'

// Map each mood to a Barry expression filename. Only one asset exists today, so
// everything points at the default. Drop new PNGs in /public and update this map.
const MOOD_BARRY_FILE: Record<ThumbnailMood, string> = {
  'shocked':           DEFAULT_BARRY_FILE,
  'exciting-positive': DEFAULT_BARRY_FILE,
  'investment':        DEFAULT_BARRY_FILE,
  'negative':          DEFAULT_BARRY_FILE,
  'selling':           DEFAULT_BARRY_FILE,
  'buying':            DEFAULT_BARRY_FILE,
  'community':         DEFAULT_BARRY_FILE,
  'neutral':           DEFAULT_BARRY_FILE,
}

function selectBarryPhoto(mood: ThumbnailMood): string {
  const filename = MOOD_BARRY_FILE[mood] ?? DEFAULT_BARRY_FILE
  return path.join(BARRY_DIR, filename)
}

// Map mood keys to expression filenames stored under public/expressions/.
// Used by the prompt-review API route and the generate-from-prompt flow.
export const MOOD_EXPRESSION_FILE: Record<string, string> = {
  'shocked':             'shocked.jpg.png',
  'exciting-positive':   'happy-mild.png',
  'investment':          'interested.png',
  'negative':            'really.png',
  'selling':             'happy-mild.png',
  'buying':              'thinking about it.png',
  'community':           'happy-mild.png',
  'neutral':             'interesting.png',
  'surprised':           'surprised.png',
  'wow':                 'wow-interesting.png',
  'default':             'interesting.png',
}

function getBarryBuffer(mood: ThumbnailMood): Buffer | null {
  const primary = selectBarryPhoto(mood)
  const fallback = path.join(BARRY_DIR, DEFAULT_BARRY_FILE)
  for (const p of [primary, fallback]) {
    try {
      if (fs.existsSync(p)) return fs.readFileSync(p)
    } catch { /* try next */ }
  }
  return null
}

// ─── COMMUNITY PHOTOS ────────────────────────────────────────────────────────

const COMMUNITIES = ['Virginia Beach', 'Chesapeake', 'Norfolk', 'Suffolk', 'Hampton', 'Newport News']
const FALLBACK_COMMUNITY = 'Virginia Beach'

export function detectCommunity(title: string): string {
  const lower = title.toLowerCase()
  const stripped = lower.replace(/hampton roads/g, '')
  for (const c of COMMUNITIES) {
    if (stripped.includes(c.toLowerCase())) return c
  }
  if (lower.includes('hampton roads')) return 'Hampton Roads'
  return FALLBACK_COMMUNITY
}

// ─── MOOD + TEMPLATE DETECTION ───────────────────────────────────────────────

type ThumbnailMood =
  | 'shocked'
  | 'exciting-positive'
  | 'investment'
  | 'negative'
  | 'selling'
  | 'buying'
  | 'community'
  | 'neutral'

type TemplateType =
  | 'market-swing'
  | 'investment-return'
  | 'buying-guide'
  | 'selling-guide'
  | 'community-spotlight'
  | 'comparison'
  | 'generic'

const MOOD_COLORS: Record<ThumbnailMood, { primary: string; secondary: string; accent: string }> = {
  'shocked':           { primary: '#FF1A1A', secondary: '#FFE600', accent: 'bold red banner strip behind the headline' },
  'exciting-positive': { primary: '#FFE600', secondary: '#FFFFFF', accent: 'bold upward green/gold arrow in the lower-left' },
  'investment':        { primary: '#FFFFFF', secondary: '#FFD700', accent: 'gold dollar-sign badge and a wallet graphic with cash' },
  'negative':          { primary: '#FFFFFF', secondary: '#38BDF8', accent: 'bold downward blue arrow graphic' },
  'selling':           { primary: '#22C55E', secondary: '#FFFFFF', accent: 'green horizontal stripe and a SOLD-style banner' },
  'buying':            { primary: '#FFFFFF', secondary: '#38BDF8', accent: 'blue house icon with a key graphic' },
  'community':         { primary: '#FF8C00', secondary: '#FFFFFF', accent: 'bold location pin graphic above the headline' },
  'neutral':           { primary: '#FFE600', secondary: '#FFFFFF', accent: 'horizontal yellow stripe behind the text block' },
}

const MOOD_BARRY_POSE: Record<ThumbnailMood, string> = {
  'shocked':           'wide-eyed, mouth open in a shocked gasp',
  'exciting-positive': 'huge enthusiastic smile, energetic',
  'investment':        'confident smirk, knowing and professional',
  'negative':          'concerned, furrowed brow, serious expression',
  'selling':           'confident grin, salesman energy',
  'buying':            'warm welcoming smile, inviting',
  'community':         'genuine friendly smile, approachable neighbor',
  'neutral':           'natural confident smile',
}

const TEMPLATE_SCENE: Record<TemplateType, string> = {
  'market-swing':        'a dramatic stock-chart style scene with a bold rising or falling line overlay across the mid-ground',
  'investment-return':   'a wealth/money scene: a wallet bursting with cash, stacked bills, and a rising green chart in the lower-left',
  'buying-guide':        'a classic home exterior with a SOLD sign, a key, and a front-door motif',
  'selling-guide':       'a home with a for-sale sign, a calendar/clock motif, and a green upward price arrow',
  'community-spotlight': 'a wide establishing shot of the neighborhood with local landmarks and warm golden-hour light',
  'comparison':          'a split-screen visual with two contrasting sides and a bold VS-style divider',
  'generic':             'a cinematic real-estate scene with strong leading lines and dramatic lighting',
}

export function detectMood(title: string, category: string): ThumbnailMood {
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

function detectTemplateType(title: string, category: string): TemplateType {
  const t = title.toLowerCase()
  if (/ vs\.? | versus | compared? to /.test(t)) return 'comparison'
  if (category === 'market-update' || /market|price|rate|trend|forecast/.test(t)) return 'market-swing'
  if (category === 'investment' || /invest|roi|equity|rental income|cash flow/.test(t)) return 'investment-return'
  if (category === 'buying-tips' || /buy|first[- ]time home|guide/.test(t)) return 'buying-guide'
  if (category === 'selling-tips' || /sell|list your|top dollar/.test(t)) return 'selling-guide'
  if (category === 'community-spotlight' || /neighborhood|community|living in|spotlight/.test(t)) return 'community-spotlight'
  return 'generic'
}

const STOPWORDS = new Set([
  'a','an','the','and','or','but','to','of','in','on','for','with','from','by','at','as','is',
  'it','this','that','these','those','your','you','are','be','been','was','were','will','can',
  'could','should','would','do','does','did','not','no','so','if','into','over','under','how',
  'what','when','where','why','who','which','vs','versus','about','more','most','than'
])

function extractPowerWords(title: string): string[] {
  const words = title
    .replace(/[^\w\s%$-]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .filter(w => !STOPWORDS.has(w.toLowerCase()))
  return words.slice(0, 4).map(w => w.toUpperCase())
}

// ─── STEP 1 PROMPT BUILDER (deterministic, no GPT-4o) ────────────────────────

const COMMUNITY_SCENE: Record<string, string> = {
  'Virginia Beach': 'Virginia Beach boardwalk at dramatic sunset — the famous King Neptune bronze statue in mid-ground, vibrant magenta and crimson sky, ocean horizon, palm trees, cinematic color grading',
  'Chesapeake': 'Chesapeake waterfront at golden hour — Great Bridge Lock area, marshlands, dramatic sky with orange and gold tones, Virginia cypress trees',
  'Norfolk': 'Norfolk downtown waterfront at sunset — USS Wisconsin battleship museum, Waterside District, harbor with boats, dramatic sky',
  'Suffolk': 'Suffolk Virginia countryside at golden hour — historic Main Street, Constant\'s Wharf, peanut fields, warm amber sky',
  'Hampton': 'Hampton Virginia waterfront at sunset — Virginia Air and Space Science Center, Mill Creek waterway, dramatic golden sky',
  'Newport News': 'Newport News waterfront at sunset — Mariners\' Museum, James River shore, dramatic cinematic sky',
  'Hampton Roads': 'Hampton Roads harbor at dramatic sunset — military ships on the water in the distance, harbor skyline, deep crimson and orange sky, cinematic',
}

function buildScenePrompt(
  article: ScoredArticle,
  community: string,
  mood: ThumbnailMood,
  template: TemplateType,
  assetType: AssetType,
): string {
  const colors = MOOD_COLORS[mood]
  const scene = TEMPLATE_SCENE[template]
  const power = extractPowerWords(article.title)
  const defaultScene = `${community} Virginia at dramatic sunset — local landmarks visible, vibrant saturated sky, cinematic color grading`
  const communityScene = COMMUNITY_SCENE[community] ?? defaultScene

  // Break the title into 2 punchy lines for the overlay text.
  const words = article.title.split(' ')
  const mid = Math.ceil(words.length / 2)
  const line1 = words.slice(0, mid).join(' ').toUpperCase()
  const line2 = words.slice(mid).join(' ').toUpperCase()

  const canvas = assetType === 'card'
    ? 'CANVAS: 1536×1024px landscape (a YouTube-style card thumbnail).'
    : 'CANVAS: 1600×500px wide shallow banner (a website hero banner).'

  const textSizing = assetType === 'card'
    ? 'Line 1 110–130px tall, Line 2 95–115px tall.'
    : 'Line 1 70–90px tall, Line 2 60–75px tall, more compact so it fits the shallow banner.'

  const accentPlacement = assetType === 'card'
    ? 'Place the graphic accent in the LOWER LEFT quadrant of the frame.'
    : 'Place the graphic accent inline with the text on the left side — the banner is too shallow for a stacked lower layout.'

  return `⚠️ CRITICAL INSTRUCTION — READ THIS FIRST:
This image must contain ZERO humans. No people. No person. No figure. No face. No body. No silhouette. No hands. No crowd. Not even a tiny person in the background distance. If any human appears anywhere in this image, the generation has failed.
The ENTIRE RIGHT THIRD of the image (from 67% width to the right edge) must be completely empty — only sky, water, atmospheric haze, or bokeh. Nothing else. No text. No graphics. No people. This space is reserved.

Create a high-impact YouTube-style thumbnail in the MrBeast visual style — cinematic, dramatic, high-energy, saturated.

${canvas}

BACKGROUND SCENE: ${communityScene}. Push the drama: saturated sunset/golden-hour sky, rich contrast, vibrant color grading.

SCENE STYLE: ${scene}.

⛔ CRITICAL NO-PERSON RULE:
- DO NOT include any person, human, figure, silhouette, face, body, hand, or mannequin anywhere in this image.
- The ENTIRE RIGHT THIRD of the image (from roughly 66% of the width to the right edge) must remain EMPTY atmospheric background only — sky, ocean, landscape, bokeh, depth. No text, no graphics, no people. Think "negative space reserved for a subject that will be added later".
- All text and all graphic elements must live on the LEFT TWO-THIRDS of the frame (from the left edge to roughly 66% of the width).

HEADLINE TEXT (left side, top portion):
- Line 1: "${line1}" — color ${colors.primary}
- Line 2: "${line2}" — color ${colors.secondary}
- Bold condensed sans-serif (Impact / Bebas Neue / Anton style), heavy black stroke outline (8px), hard black drop shadow (no blur).
- ${textSizing}
- Maximum 2 lines. Do not invent additional headlines.

POWER-WORD EMPHASIS:
- Visually emphasize these words if they appear in the title: ${power.join(', ') || '(none)'}. Make them the largest/boldest elements.

GRAPHIC ACCENT (left two-thirds only):
- ${colors.accent}.
- ${accentPlacement}
- Bold, readable, saturated, consistent with the mood color palette (${colors.primary} / ${colors.secondary}).

COMMUNITY LABEL:
- Small badge reading "${community.toUpperCase()}, VA" in white or yellow, placed under the headline on the left.

COMPOSITION RULES:
- Left two-thirds: text + graphics + scene drama.
- Right third: clean empty atmospheric background — no subject of any kind.
- Overall energy: MrBeast YouTube thumbnail — bold, loud, saturated, readable at tiny sizes.

Remember: NO PERSON ANYWHERE IN THE IMAGE. The right third stays empty atmospheric background.

FINAL REMINDER: Zero humans anywhere in this image. Right third = empty atmospheric space only.`
}

// ─── STEP 2: gpt-image-1 generates the scene (no Barry) ──────────────────────

async function generateSceneOnly(
  openai: OpenAI,
  prompt: string,
): Promise<Buffer | null> {
  console.log('[image-gen-openai] Calling gpt-image-1 images.generate()...')
  try {
    const response = await openai.images.generate({
      model: 'gpt-image-1',
      prompt,
      n: 1,
      size: '1536x1024',
    })
    const b64 = response.data?.[0]?.b64_json
    if (!b64) {
      console.error('[image-gen-openai] No image data returned')
      return null
    }
    const buf = Buffer.from(b64, 'base64')
    console.log(`[image-gen-openai] Scene generated — ${Math.round(buf.length / 1024)}KB`)
    return buf
  } catch (err) {
    console.error('[image-gen-openai] images.generate() failed:',
      err instanceof Error ? err.message : err,
      err instanceof Error && 'status' in err ? (err as any).status : '',
    )
    return null
  }
}

// ─── STEP 3: Sharp composites Barry's exact PNG on the right ─────────────────

async function compositeBarry(
  sceneBuffer: Buffer,
  assetType: AssetType,
  barryBuffer?: Buffer,
): Promise<Buffer> {
  const sharp = (await import('sharp')).default

  const canvasW = assetType === 'card' ? 1536 : 1600
  const canvasH = assetType === 'card' ? 1024 : 500
  const barryTargetH = assetType === 'card' ? 900 : 420

  const resolvedBarry = barryBuffer ?? (() => {
    const p = path.join(BARRY_DIR, DEFAULT_BARRY_FILE)
    return fs.readFileSync(p)
  })()

  // Normalize the scene to the final canvas dimensions first so Barry lines up predictably.
  const scene = await sharp(sceneBuffer)
    .resize(canvasW, canvasH, { fit: 'cover', position: 'center' })
    .png()
    .toBuffer()

  // Resize Barry by height, preserving aspect ratio. Read actual width back for positioning.
  const barryResized = await sharp(resolvedBarry)
    .resize({ height: barryTargetH, withoutEnlargement: false })
    .png()
    .toBuffer()
  const { width: barryW = 0, height: barryH = barryTargetH } = await sharp(barryResized).metadata()

  // Subtle left-edge fade so Barry blends into the scene instead of looking pasted on.
  const fadePx = Math.round(barryW * 0.12)
  const fadeMask = Buffer.from(
    `<svg width="${barryW}" height="${barryH}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="#000000" stop-opacity="0"/>
          <stop offset="${(fadePx / barryW).toFixed(3)}" stop-color="#FFFFFF" stop-opacity="1"/>
          <stop offset="1" stop-color="#FFFFFF" stop-opacity="1"/>
        </linearGradient>
      </defs>
      <rect width="${barryW}" height="${barryH}" fill="url(#g)"/>
    </svg>`
  )

  const barryFaded = await sharp(barryResized)
    .composite([{ input: fadeMask, blend: 'dest-in' }])
    .png()
    .toBuffer()

  // Right-anchored, bottom-aligned for the card; vertically centered for the shallow hero.
  const left = Math.max(0, canvasW - barryW)
  const top = assetType === 'card'
    ? Math.max(0, canvasH - barryH)
    : Math.max(0, Math.round((canvasH - barryH) / 2))

  const result = await sharp(scene)
    .composite([{ input: barryFaded, top, left, blend: 'over' }])
    .png()
    .toBuffer()

  console.log(`[image-gen-openai] [${assetType}] Barry composited at ${left},${top} (${barryW}×${barryH}) — final ${Math.round(result.length / 1024)}KB`)
  return result
}

// ─── UPLOAD TO SANITY ────────────────────────────────────────────────────────

async function uploadToSanity(
  buffer: Buffer,
  filename = `openai-cover-${Date.now()}.png`,
): Promise<SanityImageRef | null> {
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

// ─── SHARED GENERATION CORE ──────────────────────────────────────────────────

async function generateThumbnail(
  article: ScoredArticle,
  assetType: AssetType,
): Promise<SanityImageRef | null> {
  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    const community = detectCommunity(article.title)
    const mood = detectMood(article.title, article.category)
    const template = detectTemplateType(article.title, article.category)

    console.log(`[image-gen-openai] [${assetType}] Article: "${article.title.slice(0, 60)}"`)
    console.log(`[image-gen-openai] [${assetType}] Community: ${community} | Mood: ${mood} | Template: ${template}`)

    const prompt = buildScenePrompt(article, community, mood, template, assetType)

    const sceneRaw = await generateSceneOnly(openai, prompt)
    if (!sceneRaw) return null

    const barryBuffer = getBarryBuffer(mood)
    let finalBuffer: Buffer

    if (barryBuffer) {
      finalBuffer = await compositeBarry(sceneRaw, assetType, barryBuffer)
    } else {
      console.warn(`[image-gen-openai] [${assetType}] No Barry PNG found in /public — uploading scene without him`)
      const sharp = (await import('sharp')).default
      const w = assetType === 'card' ? 1536 : 1600
      const h = assetType === 'card' ? 1024 : 500
      finalBuffer = await sharp(sceneRaw).resize(w, h, { fit: 'cover', position: 'center' }).png().toBuffer()
    }

    const filename = assetType === 'card'
      ? `openai-cover-${Date.now()}.png`
      : `openai-hero-banner-${Date.now()}.png`

    return await uploadToSanity(finalBuffer, filename)
  } catch (err) {
    console.error(`[image-gen-openai] [${assetType}] Uncaught error:`, err instanceof Error ? err.message : err)
    return null
  }
}

// ─── PUBLIC EXPORTS (signatures unchanged) ───────────────────────────────────

export async function generateAndUploadCoverImageOpenAI(
  article: ScoredArticle,
): Promise<SanityImageRef | null> {
  return generateThumbnail(article, 'card')
}

export async function generateAndUploadHeroBannerOpenAI(
  article: ScoredArticle,
): Promise<SanityImageRef | null> {
  return generateThumbnail(article, 'hero')
}

export async function generateAndUploadBothImages(article: ScoredArticle): Promise<DualImageRefs> {
  const [coverImage, heroBannerImage] = await Promise.all([
    generateAndUploadCoverImageOpenAI(article),
    generateAndUploadHeroBannerOpenAI(article),
  ])
  return { coverImage, heroBannerImage }
}

// ─── APPROVED PROMPT FLOW ────────────────────────────────────────────────────
//
// Drives the new "prompt review" step: the user approves a GPT-4o-authored prompt,
// and we hand it directly to gpt-image-1 without re-deriving mood/community/scene.
// The expression PNG the user picked is composited on top of the generated scene.

export async function generateFromApprovedPrompt(params: {
  prompt: string
  expressionBuffer: Buffer
  backgroundBuffer: Buffer
  article: ScoredArticle
}): Promise<DualImageRefs> {
  const { prompt, article } = params
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  console.log(`[image-gen-openai] generateFromApprovedPrompt — "${article.title.slice(0, 60)}"`)

  const sceneRaw = await generateSceneOnly(openai, prompt)
  if (!sceneRaw) return { coverImage: null, heroBannerImage: null }

  // Always use the real transparent Barry PNG — expression photos are face references only
  const barryBuffer = getBarryBuffer('neutral')

  const cardBuffer = await compositeBarry(sceneRaw, 'card', barryBuffer ?? undefined)
  const coverImage = await uploadToSanity(
    cardBuffer,
    `openai-cover-${Date.now()}.png`,
  )

  // Hero banner: crop-resize from the same generated scene for speed and visual consistency.
  const sharp = (await import('sharp')).default
  const heroScene = await sharp(sceneRaw)
    .resize(1600, 500, { fit: 'cover', position: 'center' })
    .png()
    .toBuffer()
  const heroBuffer = await compositeBarry(heroScene, 'hero', barryBuffer ?? undefined)
  const heroBannerImage = await uploadToSanity(
    heroBuffer,
    `openai-hero-banner-${Date.now()}.png`,
  )

  return { coverImage, heroBannerImage }
}
