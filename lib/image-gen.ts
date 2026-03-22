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

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      messages: [
        {
          role: 'user',
          content: `You are an art director creating a cover image for a real estate blog post. Think Architectural Digest editorial photography meets Netflix documentary thumbnail — cinematic, specific, emotionally resonant.

Article title: ${article.title}
Article angle: ${article.whyItMatters}
Category: ${article.category}

Your job: describe a SPECIFIC visual scene that captures the emotional story of this article. Not a literal illustration of the words — an atmospheric, evocative image that makes someone want to read more.

HARD RULES — never include any of these:
- Moving trucks, vans, U-Haul, storage units, cardboard boxes, or anything associated with moving companies
- Generic stock-photo scenes (handshakes, keys on counters, "sold" signs, agents pointing at houses)
- Branded vehicles, logos, or signage of any company
- Text, watermarks, or overlaid graphics
- Faces clearly visible (keep people at a distance or shown from behind)
- The words "blog post", "thumbnail", "real estate agent", or "DALL-E"

Instead, go for:
- Lifestyle moments: a family on a beautiful patio at golden hour, a couple walking through a luxury neighborhood, someone relaxing by a pool
- Dramatic scenery: a stunning skyline at dusk, mountain views from an upscale community, lake reflections
- Architectural beauty: a stunning modern home exterior at magic hour, a luxury kitchen with natural light, resort-style backyard
- Mood and aspiration: what does it FEEL like to live here?

Write a single DALL-E 3 image prompt (3-5 sentences). Style: photorealistic, cinematic lighting, rich warm tones, 16:9 landscape orientation.

Return ONLY the prompt text, nothing else.`,
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
      quality: 'standard',
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
