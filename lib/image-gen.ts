import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import { getSanityWriteClient } from './sanity-write'
import type { ScoredArticle } from './types'

/**
 * Uses Claude to write a DALL-E 3 prompt tailored to the article,
 * then generates the image and uploads it to Sanity.
 */
export async function generateAndUploadCoverImage(
  article: ScoredArticle
): Promise<{ _type: 'reference'; _ref: string } | null> {
  try {
    const imagePrompt = await buildImagePrompt(article)
    if (!imagePrompt) return null

    const imageUrl = await generateWithDalle(imagePrompt)
    if (!imageUrl) return null

    return await uploadToSanity(imageUrl)
  } catch {
    return null
  }
}

// ─── Step 1: Claude writes the DALL-E prompt ─────────────────────────────────

async function buildImagePrompt(article: ScoredArticle): Promise<string | null> {
  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const categoryContext: Record<string, string> = {
      'market-update': 'Visualize market movement and economic energy — rising values, neighborhood momentum, the feeling of a market in motion. Think dramatic aerial shots of thriving neighborhoods, beautifully lit home exteriors that signal strong demand, or cinematic street-level scenes of desirable communities.',
      'buying-tips': 'Capture the emotional journey of finding and owning a home — discovery, possibility, the moment of arrival. A couple stepping through a sunlit doorway for the first time, an open floor plan flooded with natural light, a stunning backyard that makes someone imagine their life there.',
      'selling-tips': 'Convey success, preparation, and premium results. A beautifully staged living room with perfect lighting, a home exterior that looks its absolute best, the visual feeling of a property that commands attention and top dollar.',
      'community-spotlight': 'Bring the neighborhood to life — the energy of a specific place, its character, what makes it feel like home. Waterfront views, tree-lined streets, local parks at golden hour, the lifestyle that defines this community.',
      'investment': 'Communicate financial opportunity and smart decision-making through architecture and scale. Multi-unit buildings with strong curb appeal, aerial views of growing neighborhoods, the visual language of value and return.',
      'news': 'Capture the sense of something happening now — urgency, relevance, change in motion. Dynamic angles, dramatic lighting, a scene that feels current and important.',
    }

    const visualDirection = categoryContext[article.category] ?? categoryContext['news']

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 600,
      messages: [
        {
          role: 'user',
          content: `You are a world-class creative director for a premium real estate brand. Your job is to create DALL-E 3 image prompts that generate stunning, magazine-quality thumbnail images — the kind that stop someone mid-scroll and make them need to read the article.

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
- Virginia Beach / Hampton Roads context where it naturally fits (coastal light, Chesapeake Bay, waterfront neighborhoods, military community)
- Photorealistic, shot on a high-end camera with a wide lens — not illustrated or painterly
- Cinematic composition: rule of thirds, leading lines, depth of field
- Lighting: golden hour, blue hour, or dramatic natural window light — never flat or overcast
- 16:9 landscape format optimized for web thumbnail display

ABSOLUTE PROHIBITIONS — do not include:
- Text, words, numbers, labels, watermarks, or graphics of any kind
- Clearly visible faces (keep people at distance, silhouette, or shown from behind)
- Moving trucks, boxes, "sold" signs, keys, handshakes, or agent-pointing-at-house clichés
- Logos, brand names, or company signage
- Anything that looks like stock photography

Write your DALL-E 3 prompt now. Be vivid and specific. 4-6 sentences. Return ONLY the prompt, no explanation.`,
        },
      ],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text.trim() : null
    return text
  } catch {
    return null
  }
}

// ─── Step 2: DALL-E 3 generates the image ────────────────────────────────────

async function generateWithDalle(prompt: string): Promise<string | null> {
  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt,
      n: 1,
      size: '1792x1024',
      quality: 'hd',
      response_format: 'url',
    })

    return response.data?.[0]?.url ?? null
  } catch (err) {
    console.error('[image-gen] DALL-E 3 error:', err instanceof Error ? err.message : err)
    return null
  }
}

// ─── Step 3: Download and upload to Sanity CDN ───────────────────────────────

async function uploadToSanity(
  imageUrl: string
): Promise<{ _type: 'reference'; _ref: string } | null> {
  try {
    const client = getSanityWriteClient()

    // DALL-E URLs expire after ~1hr — download immediately
    const res = await fetch(imageUrl, { signal: AbortSignal.timeout(15000) })
    if (!res.ok) return null

    const buffer = Buffer.from(await res.arrayBuffer())

    const asset = await client.assets.upload('image', buffer, {
      filename: `ai-cover-${Date.now()}.png`,
      contentType: 'image/png',
    })

    return { _type: 'reference', _ref: asset._id }
  } catch {
    return null
  }
}
