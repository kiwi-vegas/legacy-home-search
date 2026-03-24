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
        'Visualize market momentum and economic energy — rising values, neighborhood growth, the feeling of a city on the move. Think dramatic aerial shots of Las Vegas neighborhoods, beautifully lit luxury home exteriors that signal strong demand, or cinematic street-level scenes of desirable communities near the Strip or master-planned communities like Summerlin and Henderson.',
      'buying-tips':
        'Capture the emotional journey of finding a home in Las Vegas — discovery, possibility, the moment of arrival. A family stepping through a sunlit doorway of a modern desert home, an open floor plan with mountain or Strip views, a stunning pool and backyard that makes someone imagine their life there in the Nevada sun.',
      'selling-tips':
        'Convey success, preparation, and premium results. A beautifully staged living room in a Las Vegas luxury home with perfect desert lighting, a home exterior with xeriscaping and mountain backdrop that looks its absolute best, the visual feeling of a property that commands top dollar.',
      'community-spotlight':
        'Bring the Las Vegas neighborhood to life — the energy of a specific place, its character, what makes it feel like home beyond the Strip. Red Rock Canyon backdrop, Summerlin parks, Henderson waterways, master-planned community amenities, the lifestyle that defines Las Vegas residential living.',
      investment:
        'Communicate financial opportunity through scale and architecture. Multi-unit properties in growing Las Vegas corridors, aerial views of expanding master-planned communities, the visual language of value and return in Nevada\'s high-growth market. New development cranes on the skyline signal momentum.',
      news:
        'Capture the sense of something significant happening in Las Vegas now — urgency, change, forward momentum. Dynamic angles, dramatic Nevada desert light, a scene that feels current and important, conveying the energy of a city constantly evolving.',
    }

    const visualDirection = categoryContext[article.category] ?? categoryContext['news']

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 600,
      messages: [
        {
          role: 'user',
          content: `You are a world-class creative director for a premium Las Vegas real estate brand. Your job is to create image generation prompts that produce stunning, magazine-quality thumbnail images — the kind that stop someone mid-scroll and make them need to read the article.

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
- Las Vegas / Nevada context where it naturally fits (desert light, Red Rock Canyon backdrop, Strip skyline silhouette, Summerlin or Henderson neighborhoods, mountain views, blue sky with dramatic clouds)
- Photorealistic, shot on a high-end camera with a wide lens — not illustrated or painterly
- Cinematic composition: rule of thirds, leading lines, depth of field
- Lighting: golden hour, desert dusk, or dramatic clear Nevada sky — never flat or overcast
- 16:9 landscape format optimized for web thumbnail display

ABSOLUTE PROHIBITIONS — do not include:
- Text, words, numbers, labels, watermarks, or graphics of any kind
- Clearly visible faces (keep people at distance, silhouette, or shown from behind)
- Moving trucks, boxes, "sold" signs, keys, handshakes, or agent-pointing-at-house clichés
- Logos, brand names, casino names, or company signage
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
