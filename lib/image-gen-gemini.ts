import Anthropic from '@anthropic-ai/sdk'
import { GoogleGenAI } from '@google/genai'
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

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 600,
      messages: [
        {
          role: 'user',
          content: `You are a world-class creative director for a premium Hampton Roads / Virginia Beach real estate brand. Your job is to create image generation prompts that produce stunning, magazine-quality thumbnail images — the kind that stop someone mid-scroll and make them need to read the article.

ARTICLE TO VISUALIZE:
Title: ${article.title}
Key angle: ${article.whyItMatters}
Category: ${article.category}

VISUAL DIRECTION FOR THIS CATEGORY:
${visualDirection}

YOUR TASK:
1. Extract the CORE CONCEPT of this article — what is the single most powerful idea or emotion it conveys?
2. Translate that concept into ONE specific, vivid scene. Not a generic real estate photo — a deliberately crafted visual that embodies the article's story.
3. The image should work as a standalone thumbnail: someone who hasn't read the article should be able to feel what it's about just from the image.

CRAFT RULES:
- Be hyper-specific: name the time of day, exact lighting conditions, precise architectural details, specific colors
- Hampton Roads / Virginia Beach context where it naturally fits (coastal light, Chesapeake Bay waterways, oceanfront boardwalk, colonial and craftsman architecture, tree-lined streets of Chesapeake or Suffolk, Norfolk waterfront)
- Photorealistic, shot on a high-end camera with a wide lens — not illustrated or painterly
- Cinematic composition: rule of thirds, leading lines, depth of field
- Lighting: golden hour, coastal sunrise/sunset, or dramatic Atlantic sky — never flat or overcast
- 16:9 landscape format optimized for web thumbnail display

ABSOLUTE PROHIBITIONS — do not include:
- Text, words, numbers, labels, watermarks, or graphics of any kind
- Clearly visible faces (keep people at distance, silhouette, or shown from behind)
- Moving trucks, boxes, "sold" signs, keys, handshakes, or agent-pointing-at-house clichés
- Logos, brand names, military insignia, or company signage
- Anything that looks like stock photography

Write your image prompt now. Be vivid and specific. 4-6 sentences. Return ONLY the prompt, no explanation.`,
        },
      ],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text.trim() : null
    return text
  } catch {
    return null
  }
}

// ─── Step 2: Gemini generates the image ──────────────────────────────────────

async function generateWithGemini(prompt: string): Promise<Buffer | null> {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY })

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp-image-generation',
      contents: prompt,
      config: {
        responseModalities: ['IMAGE'],
      },
    })

    const parts = response.candidates?.[0]?.content?.parts ?? []
    for (const part of parts) {
      if (part.inlineData?.data) {
        return Buffer.from(part.inlineData.data, 'base64')
      }
    }

    console.error('[image-gen-gemini] No image data in response')
    return null
  } catch (err) {
    console.error('[image-gen-gemini] Gemini error:', err instanceof Error ? err.message : err)
    return null
  }
}

// ─── Step 3: Upload buffer to Sanity CDN ─────────────────────────────────────

async function uploadToSanity(
  buffer: Buffer
): Promise<{ _type: 'reference'; _ref: string } | null> {
  try {
    const client = getSanityWriteClient()

    const asset = await client.assets.upload('image', buffer, {
      filename: `gemini-cover-${Date.now()}.png`,
      contentType: 'image/png',
    })

    return { _type: 'reference', _ref: asset._id }
  } catch {
    return null
  }
}
