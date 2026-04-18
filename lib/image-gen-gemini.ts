/**
 * AI Blog Hero Image Generator
 *
 * Applies thumbnail psychology from the claude-thumbnails skill:
 *   1. Visual Stun Gun  — stops the scroll
 *   2. Title Value Hunt — reader scans the headline for relevance
 *   3. Visual Validation — thumbnail reinforces the article's promise
 *
 * Pipeline:
 *   Claude → crafts a psychology-driven image prompt
 *   Gemini 3 Pro Image Preview → generates the hero image (16:9)
 *   Fallback: Imagen 4.0 → Gemini 2.5 Flash Image
 *   Sanity CDN → uploaded and referenced
 */

import fs from 'fs'
import path from 'path'
import Anthropic from '@anthropic-ai/sdk'
import { GoogleGenAI, Modality } from '@google/genai'
import { getSanityWriteClient } from './sanity-write'
import type { ScoredArticle } from './types'

// ─── CLIENT CONFIGURATION ────────────────────────────────────────────────────

const CLIENT_CONFIG = {
  market: 'Virginia Beach',
  visualAnchors: `
    • Virginia Beach nice middle class homes (well kept, nice landscaping with clean looking lighting from dusk or dawn, very appealing and feels like a really nice place to live in but not overly expensive or excessive.
    • The Virginia Beach Oceanfront and Boardwalk as dramatic backdrops, and sometimes use the famous King Neptune statue
    • Chesapeake is known for its raw, untouched nature—cypress trees, still water reflections, and wooden boardwalks through the Great Dismal Swamp. It gives off a peaceful, almost hidden-gem vibe that feels worlds away from the city.
    • Norfolk - tree-lined streets, classic architecture, walkability, and a mix of coffee shops and local boutiques. It gives Norfolk a timeless, livable feel.
    • Hampton Roads is defined by water everywhere—wide bays, rivers, and iconic bridge-tunnels connecting cities. These sweeping aerials instantly communicate scale, connectivity, and coastal living beyond just "the beach."
  `,
  communities: [
    'Virginia Beach', 'Chesapeake', 'Norfolk', 'Suffolk', 'Hampton', 'Newport News',
  ],
  defaultCommunity: 'Virginia Beach',
}

// ─── CATEGORY VISUAL DIRECTION ────────────────────────────────────────────────

const categoryContext: Record<string, { scene: string; graphicElements: string }> = {
  'market-update': {
    scene: `Show market momentum — a stunning aerial of ${CLIENT_CONFIG.market} neighborhoods at golden hour, beautifully lit homes that signal demand, or a cinematic streetscape that makes you feel the market is alive.`,
    graphicElements: `Upward-trending arrow graphics rising from the foreground into the sky, glowing green or gold arrows showing growth trajectory. Floating dollar sign ($) symbols scattered around the arrows with subtle sparkle effects. Charts or bar graphs implied through stylized arrows at different heights. The graphic elements should feel bold and confident — this market is moving up.`,
  },
  'buying-tips': {
    scene: `The emotional moment of possibility — a beautiful ${CLIENT_CONFIG.market} home in perfect light, a welcoming front porch, or a great room with large windows looking out at lush Virginia greenery.`,
    graphicElements: `Soft golden checkmark symbols or subtle glowing stars suggesting "smart choice" energy. A gentle upward arrow near the home suggesting value appreciation. Keep graphic elements minimal and aspirational — one or two subtle overlays that feel like a green light to buy.`,
  },
  'selling-tips': {
    scene: `A staged ${CLIENT_CONFIG.market} home that looks absolutely irresistible — a beautifully lit great room with local views, a curb-appealing front elevation at sunset, the feeling of a premium property at peak value.`,
    graphicElements: `Bold upward price arrow graphic with a dollar sign, suggesting strong sale price. A subtle "%" symbol implying above-asking results. Graphic elements should feel like a strong market signal — this home will sell well.`,
  },
  'community-spotlight': {
    scene: `The best version of ${CLIENT_CONFIG.market} life — golden hour parks, tree-lined streets, a waterfront community scene, dramatic coastal scenery as a backdrop, the feeling of a place worth belonging to.`,
    graphicElements: `Keep graphic elements to a minimum — this is about atmosphere. One or two subtle star or location-pin icons to reinforce the "place" theme. The community name text is the main graphic element.`,
  },
  investment: {
    scene: `Scale and growth — well-maintained multi-unit properties against a ${CLIENT_CONFIG.market} blue sky, an aerial showing a rapidly expanding neighborhood, the visual language of opportunity and return.`,
    graphicElements: `Multiple upward arrows at varying heights suggesting a rising market — green and gold tones. Dollar signs and percentage symbols floating in the air with a sparkle effect. A bar chart implied by arrow heights. Make it feel like visible, tangible returns — this is where the money is.`,
  },
  news: {
    scene: `Urgency and relevance — something is happening right now in ${CLIENT_CONFIG.market}. A dramatic coastal sky over a thriving neighborhood, the energy of a story that matters.`,
    graphicElements: `A bold exclamation or news-alert graphic element to create urgency. Subtle arrow showing the direction of change. Keep it simple — the story is the element.`,
  },
}

// ─── COMMUNITY PHOTO POOLS ───────────────────────────────────────────────────
// Drop any JPG/JPEG/PNG files into public/community-photos/[city-slug]/
// The pipeline picks one at random — no fixed naming convention required.

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp'])

function getRandomCommunityPhoto(community: string): Buffer | null {
  try {
    const slug = community.toLowerCase().replace(/\s+/g, '-')
    const dir = path.join(process.cwd(), 'public', 'community-photos', slug)
    if (!fs.existsSync(dir)) return null
    const files = fs.readdirSync(dir).filter(f => IMAGE_EXTENSIONS.has(path.extname(f).toLowerCase()))
    if (!files.length) return null
    const chosen = files[Math.floor(Math.random() * files.length)]
    const buf = fs.readFileSync(path.join(dir, chosen))
    console.log(`[image-gen] Using curated photo: community-photos/${slug}/${chosen}`)
    return buf
  } catch (err) {
    console.warn(`[image-gen] Could not load community photo for "${community}":`, err instanceof Error ? err.message : err)
    return null
  }
}

// ─── COMMUNITY DETECTION ─────────────────────────────────────────────────────

function detectCommunity(title: string): string {
  const lower = title.toLowerCase()
  for (const community of CLIENT_CONFIG.communities) {
    if (lower.includes(community.toLowerCase())) return community
  }
  return CLIENT_CONFIG.defaultCommunity
}

export async function generateAndUploadCoverImageGemini(
  article: ScoredArticle
): Promise<{ _type: 'reference'; _ref: string } | null> {
  try {
    const community = detectCommunity(article.title)
    const backgroundPhoto = getRandomCommunityPhoto(community)

    const imagePrompt = await buildImagePrompt(article, !!backgroundPhoto)
    if (!imagePrompt) return null

    console.log(`[image-gen] Prompt built. Calling Gemini 3 Pro Image Preview...`)
    console.log(`[image-gen] Prompt preview: ${imagePrompt.slice(0, 120)}...`)

    const imageBuffer = await generateWithGemini(imagePrompt, backgroundPhoto)
    if (!imageBuffer) return null

    return await uploadToSanity(imageBuffer)
  } catch (err) {
    console.error('[image-gen] Uncaught error:', err instanceof Error ? err.message : err)
    return null
  }
}

// ─── Step 1: Claude writes the 3-layer image prompt ─────────────────────────

async function buildImagePrompt(article: ScoredArticle, hasBackgroundPhoto: boolean): Promise<string | null> {
  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const community = detectCommunity(article.title)
    const ctx = categoryContext[article.category] ?? categoryContext['news']

    console.log(`[image-gen] Building prompt for community: "${community}", category: "${article.category}", photo: ${hasBackgroundPhoto}`)

    const layer1 = hasBackgroundPhoto
      ? `LAYER 1 — BACKGROUND PHOTO ENHANCEMENT (a real photo of ${community} has been provided):
A curated photograph of ${community} is the background — do NOT replace or reimagine the scene. Instead describe how to enhance it with warm cinematic color grading: deepen the sky, shift the light toward golden hour warmth, add subtle vibrancy to make the scene feel alive and aspirational. The photo's landmark, architecture, or scenery should remain clearly identifiable. Keep the lower 60% of the frame as-is; the upper area (sky, open space) is where the text will sit.`
      : `LAYER 1 — CINEMATIC BACKGROUND SCENE:
${ctx.scene}
Use these visual anchors naturally:
${CLIENT_CONFIG.visualAnchors}`

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 900,
      messages: [
        {
          role: 'user',
          content: `You are a creative director producing cinematic real estate photography for blog posts. The output is a PHOTOGRAPH FIRST — beautiful, landmark-rich, and immersive. Any text or graphics are small secondary accents, like a magazine's location caption. The landmark and scene must be clearly visible and take up at least 80% of the visual attention.

ARTICLE:
Title: "${article.title}"
Category: ${article.category}
Community: ${community}

─────────────────────────────────────
IMAGE STRUCTURE:

${layer1}

TEXT (small corner label — NOT a headline):
In the upper-left corner only, include two lines of small text sitting close together:
- Line 1: "${community}" in a tasteful script or serif font. This text should be the same visual weight as a newspaper dateline or magazine location tag — readable but NOT attention-grabbing. It should look like someone wrote a small caption on a photograph, not a billboard. Height of this text: roughly 5% of the total image height.
- Line 2: A 3–4 word phrase from the article title in a clean sans-serif, slightly smaller than line 1.
Both lines together should occupy a small upper-left block — no wider than 30% of the image width, no taller than 12% of the image height. The rest of the image — the other 70% of width and 88% of height — contains NO text at all.

ACCENT GRAPHICS (tiny and optional):
${ctx.graphicElements}
These must be small, subtle accents only — each no larger than 8% of image height. Place them in corners or edges so they never cover the landmark or main scene. If they would overlap or clutter the scene, omit them entirely.

─────────────────────────────────────
CRITICAL RULES — these override everything else:
1. The landmark, architecture, or coastal scene is the HERO. A viewer's eye should go to the scene first, not the text.
2. Text must look like a small label on a photograph — never a poster, banner, or YouTube thumbnail headline.
3. If the text looks large, cut it in half again.
4. Beautiful photography > everything else.

FORMAT: Wide 16:9, cinematic golden-hour lighting, rich saturated colors, photorealistic.
NO faces close-up, no for-sale signs, no logos, no generic stock imagery.

Write the Gemini image generation prompt now — 5–8 sentences describing the scene and the small text placement. Return ONLY the prompt, no labels or preamble.`,
        },
      ],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text.trim() : null
    return text
  } catch (err) {
    console.error('[image-gen] Prompt build error:', err instanceof Error ? err.message : err)
    return null
  }
}

// ─── Step 2: Gemini generates the image ──────────────────────────────────────
// Primary: gemini-3-pro-image-preview (from claude-thumbnails skill — best quality + 16:9)
// Fallback 1: Imagen 4.0 (text-only — no image input)
// Fallback 2: Gemini 2.5 Flash Image

async function generateWithGemini(prompt: string, backgroundPhoto: Buffer | null): Promise<Buffer | null> {
  const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY })

  // Build multimodal parts: photo (if available) + text prompt
  const userParts: any[] = backgroundPhoto
    ? [
        { inlineData: { data: backgroundPhoto.toString('base64'), mimeType: 'image/jpeg' } },
        { text: `Use this photo as the photographic background. ${prompt}` },
      ]
    : [{ text: prompt }]

  // Primary: gemini-3-pro-image-preview — same model as claude-thumbnails skill
  try {
    console.log(`[image-gen] Calling gemini-3-pro-image-preview${backgroundPhoto ? ' (with background photo)' : ''}...`)
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: [{ role: 'user', parts: userParts }],
      config: {
        responseModalities: [Modality.TEXT, Modality.IMAGE],
        imageConfig: { aspectRatio: '16:9' },
      },
    })
    const parts = response.candidates?.[0]?.content?.parts ?? []
    for (const part of parts) {
      if (part.inlineData?.data) {
        const buf = Buffer.from(part.inlineData.data, 'base64')
        console.log(`[image-gen] gemini-3-pro-image-preview SUCCESS — ${Math.round(buf.length / 1024)}KB image`)
        return buf
      }
    }
    console.warn('[image-gen] gemini-3-pro-image-preview returned no image data')
  } catch (err) {
    console.error('[image-gen] gemini-3-pro-image-preview error:', err instanceof Error ? err.message : err)
  }

  // Fallback 1: Imagen 4.0 (text-only — image input not supported)
  try {
    console.log('[image-gen] Falling back to Imagen 4.0...')
    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt,
      config: { numberOfImages: 1, aspectRatio: '16:9' },
    })
    const imageBytes = response.generatedImages?.[0]?.image?.imageBytes
    if (imageBytes) {
      const buf = Buffer.isBuffer(imageBytes) ? imageBytes : Buffer.from(imageBytes as string, 'base64')
      console.log(`[image-gen] Imagen 4.0 SUCCESS — ${Math.round(buf.length / 1024)}KB image`)
      return buf
    }
  } catch (err) {
    console.error('[image-gen] Imagen 4.0 error:', err instanceof Error ? err.message : err)
  }

  // Fallback 2: Gemini 2.5 Flash Image
  try {
    console.log('[image-gen] Falling back to Gemini 2.5 Flash Image...')
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: [{ role: 'user', parts: userParts }],
      config: { responseModalities: [Modality.IMAGE] },
    })
    const parts = response.candidates?.[0]?.content?.parts ?? []
    for (const part of parts) {
      if (part.inlineData?.data) {
        const buf = Buffer.from(part.inlineData.data, 'base64')
        console.log(`[image-gen] Gemini 2.5 Flash SUCCESS — ${Math.round(buf.length / 1024)}KB image`)
        return buf
      }
    }
  } catch (err) {
    console.error('[image-gen] Gemini 2.5 Flash error:', err instanceof Error ? err.message : err)
  }

  console.error('[image-gen] All Google AI models failed — falling back to OG/stock image')
  return null
}

// ─── Step 3: Upload buffer to Sanity CDN ─────────────────────────────────────

async function uploadToSanity(
  buffer: Buffer
): Promise<{ _type: 'reference'; _ref: string } | null> {
  try {
    const client = getSanityWriteClient()
    const asset = await client.assets.upload('image', buffer, {
      filename: `google-ai-cover-${Date.now()}.png`,
      contentType: 'image/png',
    })
    console.log(`[image-gen] Uploaded to Sanity: ${asset._id}`)
    return { _type: 'reference', _ref: asset._id }
  } catch (err) {
    console.error('[image-gen] Sanity upload error:', err instanceof Error ? err.message : err)
    return null
  }
}
