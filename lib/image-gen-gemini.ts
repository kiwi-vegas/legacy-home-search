import Anthropic from '@anthropic-ai/sdk'
import { GoogleGenAI, Modality } from '@google/genai'
import { getSanityWriteClient } from './sanity-write'
import type { ScoredArticle } from './types'

/**
 * Uses Claude to write a Gemini image prompt tailored to the article,
 * then generates the image via Google Gemini and uploads it to Sanity.
 */
export async function generateAndUploadCoverImageGemini(
  article: ScoredArticle
): Promise<{ _type: 'reference'; _ref: string } | null> {
  try {
    const imagePrompt = await buildImagePrompt(article)
    if (!imagePrompt) return null

    const imageBuffer = await generateWithGemini(imagePrompt)
    if (!imageBuffer) return null

    return await uploadToSanity(imageBuffer)
  } catch {
    return null
  }
}

// ─── Step 1: Claude writes the Gemini image prompt ───────────────────────────

async function buildImagePrompt(article: ScoredArticle): Promise<string | null> {
  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const categoryContext: Record<string, string> = {
      'market-update':
        'Visualize market momentum in Hampton Roads — rising values, neighborhood vitality, the feeling of a coastal community thriving. Think aerial shots of Virginia Beach neighborhoods near the oceanfront, beautifully lit home exteriors in Chesapeake or Suffolk at golden hour, or cinematic street-level scenes of desirable waterfront or tree-lined communities.',
      'buying-tips':
        'Capture the emotional journey of finding a home in Hampton Roads — discovery, possibility, the moment of arrival. A family stepping through a sunlit doorway of a colonial or craftsman home, an open floor plan with coastal light, a beautiful backyard or deck that makes someone imagine their life near the water in Virginia Beach or Chesapeake.',
      'selling-tips':
        'Convey success, preparation, and premium results. A beautifully staged living room in a Virginia Beach home with perfect coastal light, a home exterior with mature landscaping that looks its absolute best, the visual feeling of a Hampton Roads property that commands top dollar.',
      'community-spotlight':
        'Bring Hampton Roads to life — the energy of a specific neighborhood, its character, what makes it feel like home. Virginia Beach oceanfront boardwalk, Chesapeake tree-lined streets, Norfolk waterfront, Suffolk open spaces, the lifestyle that defines coastal Virginia residential living.',
      investment:
        'Communicate financial opportunity through architecture and scale. Multi-unit properties in growing Hampton Roads corridors, aerial views of Virginia Beach or Chesapeake neighborhoods, the visual language of value and return in a market anchored by the military and port economy.',
      news:
        'Capture the sense of something significant happening in Hampton Roads — urgency, change, forward momentum. Dynamic angles, dramatic coastal Virginia light, a scene that feels current and important, conveying the energy of a community growing and evolving.',
    }

    const visualDirection = categoryContext[article.category] ?? categoryContext['news']

    console.log('[image-gen] Building image prompt with Claude...')
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 800,
      messages: [
        {
          role: 'user',
          content: `You are a world-class creative director for a premium Hampton Roads / Virginia Beach real estate brand. Your job is to write an image generation prompt that produces a STUNNING, magazine-quality hero image — the kind that stops someone mid-scroll and makes them need to read the article.

ARTICLE TO VISUALIZE:
Title: ${article.title}
Key angle: ${article.whyItMatters}
Category: ${article.category}

VISUAL DIRECTION FOR THIS CATEGORY:
${visualDirection}

YOUR PROCESS:
1. Identify the single most powerful EMOTION or IDEA in this article (growth, uncertainty, opportunity, community, loss, momentum, etc.)
2. Find the most compelling VISUAL METAPHOR for that emotion — something specific to Hampton Roads / Virginia Beach
3. Describe ONE precise, cinematic scene that embodies it. Make it feel lived-in and real, not staged.

WHAT MAKES A GREAT PROMPT:
- Hyper-specific details: name the exact time of day, describe the quality of light, the architectural style, the colors in the sky
- A strong foreground subject with depth behind it — not a flat snapshot
- Something slightly unexpected that elevates it above stock photography
- Hampton Roads DNA: Chesapeake Bay waterways, Virginia Beach oceanfront, Norfolk skyline at dusk, colonial homes with deep porches, naval vessels in the distance, tidal creeks through marshland, tree-lined Chesapeake streets

TECHNICAL REQUIREMENTS:
- Photorealistic — shot on a high-end full-frame camera, 24mm wide lens
- Cinematic composition: rule of thirds, strong leading lines, bokeh depth of field
- Lighting: golden hour warmth, dramatic coastal sunrise/sunset, or Atlantic storm light — never flat, grey, or overcast
- 16:9 widescreen format, optimized for blog hero display

HARD RULES — never include:
- Text, words, numbers, signs, watermarks, or graphics of any kind
- Clearly visible faces — people only at distance, in silhouette, or from behind
- "For Sale" signs, sold signs, keys, moving trucks, handshakes, or pointing
- Logos, brand names, flags, military insignia, or company signage
- Anything that looks like a generic real estate stock photo

Write the final image prompt now. 5-7 vivid sentences. Return ONLY the prompt — no explanation, no preamble.`,
        },
      ],
    })
    console.log('[image-gen] Prompt built. Sending to Google Imagen 4...')

    const text = response.content[0].type === 'text' ? response.content[0].text.trim() : null
    return text
  } catch {
    return null
  }
}

// ─── Step 2: Google AI generates the image ───────────────────────────────────
// Primary: Imagen 4.0 (purpose-built image gen, 16:9 native)
// Fallback: Gemini 2.5 Flash Image

async function generateWithGemini(prompt: string): Promise<Buffer | null> {
  const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY })

  // Try Imagen 4.0 first — best quality, native 16:9 aspect ratio
  try {
    console.log('[image-gen] Calling Imagen 4.0...')
    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt,
      config: { numberOfImages: 1, aspectRatio: '16:9' },
    })
    const imageBytes = response.generatedImages?.[0]?.image?.imageBytes
    if (imageBytes) {
      const buf = Buffer.isBuffer(imageBytes) ? imageBytes : Buffer.from(imageBytes as string, 'base64')
      console.log(`[image-gen] Imagen 4.0 success — ${Math.round(buf.length / 1024)}KB image received`)
      return buf
    }
  } catch (err) {
    console.error('[image-gen] Imagen 4.0 error:', err instanceof Error ? err.message : err)
  }

  // Fallback: Gemini 2.5 Flash Image
  try {
    console.log('[image-gen] Trying Gemini 2.5 Flash Image fallback...')
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: prompt,
      config: { responseModalities: [Modality.IMAGE] },
    })
    const parts = response.candidates?.[0]?.content?.parts ?? []
    for (const part of parts) {
      if (part.inlineData?.data) {
        const buf = Buffer.from(part.inlineData.data, 'base64')
        console.log(`[image-gen] Gemini 2.5 Flash success — ${Math.round(buf.length / 1024)}KB image received`)
        return buf
      }
    }
  } catch (err) {
    console.error('[image-gen] Gemini 2.5 Flash error:', err instanceof Error ? err.message : err)
  }

  console.error('[image-gen] All Google AI image models failed — falling back to OG/stock image')
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

    return { _type: 'reference', _ref: asset._id }
  } catch {
    return null
  }
}
