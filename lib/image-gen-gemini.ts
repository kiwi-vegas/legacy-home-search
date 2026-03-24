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

import Anthropic from '@anthropic-ai/sdk'
import { GoogleGenAI, Modality } from '@google/genai'
import { getSanityWriteClient } from './sanity-write'
import type { ScoredArticle } from './types'

export async function generateAndUploadCoverImageGemini(
  article: ScoredArticle
): Promise<{ _type: 'reference'; _ref: string } | null> {
  try {
    const imagePrompt = await buildImagePrompt(article)
    if (!imagePrompt) return null

    console.log(`[image-gen] Prompt built. Calling Gemini 3 Pro Image Preview...`)
    console.log(`[image-gen] Prompt preview: ${imagePrompt.slice(0, 120)}...`)

    const imageBuffer = await generateWithGemini(imagePrompt)
    if (!imageBuffer) return null

    return await uploadToSanity(imageBuffer)
  } catch (err) {
    console.error('[image-gen] Uncaught error:', err instanceof Error ? err.message : err)
    return null
  }
}

// ─── Step 1: Claude writes the psychology-driven image prompt ─────────────────

async function buildImagePrompt(article: ScoredArticle): Promise<string | null> {
  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    // Category-level visual direction — what story does each category tell?
    const categoryContext: Record<string, string> = {
      'market-update':
        'DESIRE: Confidence and clarity in a confusing market. PAIN: Uncertainty about whether to buy, sell, or hold. TRANSFORMATION: They\'ll understand exactly what\'s happening and what to do next. Visual: Show market momentum — a striking aerial of thriving Hampton Roads neighborhoods, beautifully lit homes that signal demand, or a cinematic street scene that makes you feel the market is alive.',
      'buying-tips':
        'DESIRE: The feeling of finally finding the right home. PAIN: The fear of making the wrong decision or missing out. TRANSFORMATION: They\'ll feel equipped and confident. Visual: The emotional moment of possibility — sunlight through a doorway, a perfect porch overlooking a quiet Virginia Beach street, a family-sized backyard that makes someone imagine their life there.',
      'selling-tips':
        'DESIRE: Maximum price, minimal stress, a clean close. PAIN: Worry about leaving money on the table or a slow sale. TRANSFORMATION: Their home sells fast and above asking. Visual: A staged home that looks absolutely irresistible — a beautifully lit living room, a front exterior that commands attention, the feeling of a premium property.',
      'community-spotlight':
        'DESIRE: Finding a neighborhood that truly feels like home. PAIN: Not knowing which area is right for your family. TRANSFORMATION: A vivid sense of place and community. Visual: The best version of Hampton Roads life — Chesapeake Bay at sunset, tree-lined streets with colonial homes, a waterfront park, the feeling of a place worth belonging to.',
      investment:
        'DESIRE: Smart returns and long-term wealth. PAIN: Fear of making the wrong real estate investment. TRANSFORMATION: Clarity on where the real opportunity is. Visual: Scale and growth — multi-unit properties with strong curb appeal, an aerial showing a neighborhood expanding, the visual language of opportunity and return.',
      news:
        'DESIRE: Being ahead of the curve and making informed decisions. PAIN: Feeling blindsided by changes that affect their home\'s value. TRANSFORMATION: They\'ll know about this before everyone else. Visual: Urgency and relevance — something is happening right now in Hampton Roads. Dynamic angles, dramatic coastal light, the energy of a story that matters.',
    }

    const desireLoop = categoryContext[article.category] ?? categoryContext['news']

    console.log('[image-gen] Building prompt with Claude thumbnail psychology...')

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 900,
      messages: [
        {
          role: 'user',
          content: `You are a world-class creative director applying YouTube thumbnail psychology to blog hero images for a Hampton Roads / Virginia Beach real estate brand. Your images stop scrollers and make them feel something before they read a word.

ARTICLE:
Title: "${article.title}"
Angle: ${article.whyItMatters}
Category: ${article.category}

DESIRE LOOP FOR THIS CATEGORY:
${desireLoop}

─────────────────────────────────────
THE 3-STEP READER PSYCHOLOGY (your image must pass all 3):

1. VISUAL STUN GUN — The image must POP and stop the scroll immediately. Ask: "Would someone slow their thumb for this?"
2. TITLE VALUE HUNT — After stopping, the reader scans the headline. The image must make that headline feel MORE urgent and relevant.
3. VISUAL VALIDATION — The reader returns to the image to confirm the article is worth reading. The image must support the article's promise.
─────────────────────────────────────

VISUAL STUN GUN TOOLKIT (choose the strongest 2-3 for this article):
• Color contrast — vivid, saturated colors that pop against competing content
• Compelling scene — a visual that immediately represents the desire or transformation
• Big implied number or scale — show magnitude without text (a massive port crane, rows of homes, a dramatic skyline)
• Aesthetic imagery — cinematic, beautiful, the kind of photo you'd hang on a wall
• A→B transformation — show contrast: before/after, problem/solution, old/new
• Emotional atmosphere — golden hour warmth = opportunity; dark sky = urgency; blue dawn = fresh start

HAMPTON ROADS VISUAL ANCHORS (use what naturally fits):
• Virginia Beach oceanfront at golden hour — warmth, lifestyle, aspiration
• Chesapeake Bay with tidal marshes — depth, permanence, natural wealth
• Norfolk waterfront skyline at dusk — economic momentum, urban energy
• Colonial or craftsman homes on tree-lined streets — community, stability, roots
• Port of Virginia cranes — economic scale, growth, jobs
• Naval vessels in the distance — military community, discipline, Hampton Roads identity
• Aerial neighborhoods — scale, growth, investment opportunity

YOUR TASK:
Write the final image generation prompt for Gemini. It must describe ONE specific, vivid, cinematic scene. Not a generic photo — a deliberately crafted image that:
- Passes the stun gun test (you'd stop scrolling for it)
- Reinforces the article's emotional promise
- Feels authentic to Hampton Roads

FORMAT REQUIREMENTS:
- Photorealistic, shot on a high-end full-frame camera with a 24mm wide lens
- Cinematic composition with rule of thirds and strong leading lines
- Golden hour, dramatic coastal light, or dynamic Atlantic sky — never flat, grey, or overcast
- 16:9 widescreen, optimized for web hero display
- Depth of field: sharp foreground subject, layered background

HARD PROHIBITIONS (if included the image fails entirely):
- NO text, words, numbers, signs, overlays, watermarks of any kind
- NO clearly visible faces — people only at distance, silhouette, or from behind
- NO for-sale signs, sold signs, keys, moving trucks, handshakes
- NO logos, brand names, flags, military insignia, or company signage
- NOTHING that looks like a generic real estate stock photo

Write the prompt now. 5-8 rich sentences. Return ONLY the prompt — nothing else.`,
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
// Fallback 1: Imagen 4.0
// Fallback 2: Gemini 2.5 Flash Image

async function generateWithGemini(prompt: string): Promise<Buffer | null> {
  const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY })

  // Primary: gemini-3-pro-image-preview — same model as claude-thumbnails skill
  try {
    console.log('[image-gen] Calling gemini-3-pro-image-preview...')
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: prompt,
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

  // Fallback 1: Imagen 4.0
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
      contents: prompt,
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
