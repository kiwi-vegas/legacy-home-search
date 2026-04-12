/**
 * Market Report Cover Image Generator
 *
 * Style: YouTube thumbnail meets financial media (Bloomberg / CNBC energy).
 * NOT cinematic real estate photography (that's the blog post Gemini pipeline).
 *
 * Pipeline:
 *   Claude → crafts a financial-illustration image prompt
 *   DALL-E 3 (1792×1024, HD) → generates the thumbnail
 *   Sanity CDN → uploaded and referenced
 */

import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import { getSanityWriteClient } from './sanity-write'

// ─── COMMUNITY VISUAL DIRECTION ───────────────────────────────────────────────

const communityVisuals: Record<string, string> = {
  'Virginia Beach': 'Virginia Beach coastline silhouette or the Virginia Beach skyline at dusk — simplified, graphic, high-contrast. Subtle wave or boardwalk motif in the background.',
  'Chesapeake': 'Chesapeake cypress tree silhouette over still water — simplified, graphic. Dark teal water reflection, clean horizon line.',
  'Norfolk': 'Norfolk downtown skyline silhouette or iconic naval ship outline — bold, simplified graphic shapes against a dramatic sky.',
  'Suffolk': 'Suffolk open countryside or farm field silhouette — wide horizon, simple and clean graphic shapes.',
  'Hampton': 'Hampton waterfront or Hampton Roads bridge silhouette — graphic, bold shapes against a night or dusk sky.',
  'Newport News': 'Newport News shipyard crane silhouettes or waterfront skyline — industrial and bold graphic shapes.',
}

// ─── MAIN EXPORT ──────────────────────────────────────────────────────────────

export async function generateAndUploadMarketReportCover(
  communityName: string,
  period: string,
  headlineStat: string,
): Promise<{ _type: 'reference'; _ref: string } | null> {
  try {
    const prompt = await buildImagePrompt(communityName, period, headlineStat)
    if (!prompt) return null

    console.log(`[market-report-image] Prompt built. Calling DALL-E 3...`)
    console.log(`[market-report-image] Prompt preview: ${prompt.slice(0, 120)}...`)

    const imageUrl = await generateWithDalle(prompt)
    if (!imageUrl) return null

    return await uploadToSanity(imageUrl, communityName, period)
  } catch (err) {
    console.error('[market-report-image] Uncaught error:', err instanceof Error ? err.message : err)
    return null
  }
}

// ─── Step 1: Claude crafts the image prompt ──────────────────────────────────

async function buildImagePrompt(
  communityName: string,
  period: string,
  headlineStat: string,
): Promise<string | null> {
  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const visualContext = communityVisuals[communityName] ?? communityVisuals['Virginia Beach']

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 700,
      messages: [
        {
          role: 'user',
          content: `You are a creative director making YouTube-style financial thumbnail images for a real estate market report. The style is bold, illustrative, data-driven — think Bloomberg Terminal meets MrBeast thumbnail energy. NOT cinematic real estate photography.

REPORT:
Community: ${communityName}
Period: ${period}
Headline Stat: ${headlineStat}

STYLE DIRECTION — Financial Illustration:
- Dark navy or deep charcoal background (#0a0f1e or similar) — this is a data story, not a lifestyle photo
- Bold graphic elements dominating the foreground: a large upward or downward trend arrow, a bar chart shape, or a price-tag bubble — rendered in electric blue, white, and gold/yellow
- The headline stat ("${headlineStat}") rendered as a large, bold graphic number overlaid on the scene — like a chyron or data card, not a subtitle
- Community name ("${communityName}") as a bold label in the upper area — clean sans-serif, white with a subtle blue glow
- Background: ${visualContext}
- The overall feel: confident financial authority — data brought to life, not a home listing photo
- Illustrative and semi-realistic — like a stylized infographic where the data IS the visual

COMPOSITION:
- Wide 16:9 frame (landscape)
- Left 60%: the dramatic graphical data element (big trend arrow, chart bars, price bubble) in the foreground
- Right 40%: the simplified community backdrop
- Bold color contrast — electric blue (#2563eb or brighter) against dark background, gold/yellow for highlight numbers
- Clean, uncluttered — 2 or 3 strong visual elements, not a busy collage

PROHIBITIONS:
- No faces, no people in the foreground
- No for-sale signs, keys, moving trucks, or agent clichés
- No logos or brand names
- No photorealistic home exteriors (this is financial content, not a listing)
- No generic stock photo feeling

Write the DALL-E 3 prompt now. 5-7 richly specific sentences describing the full composition. Return ONLY the prompt — no labels, no preamble.`,
        },
      ],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text.trim() : null
    return text
  } catch (err) {
    console.error('[market-report-image] Prompt build error:', err instanceof Error ? err.message : err)
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

    const url = response.data?.[0]?.url ?? null
    if (url) {
      console.log('[market-report-image] DALL-E 3 SUCCESS')
    }
    return url
  } catch (err) {
    console.error('[market-report-image] DALL-E 3 error:', err instanceof Error ? err.message : err)
    return null
  }
}

// ─── Step 3: Download and upload to Sanity CDN ───────────────────────────────

async function uploadToSanity(
  imageUrl: string,
  communityName: string,
  period: string,
): Promise<{ _type: 'reference'; _ref: string } | null> {
  try {
    const client = getSanityWriteClient()

    // DALL-E URLs expire after ~1hr — download immediately
    const res = await fetch(imageUrl, { signal: AbortSignal.timeout(20000) })
    if (!res.ok) throw new Error(`Failed to fetch image: ${res.status}`)

    const buffer = Buffer.from(await res.arrayBuffer())
    const slug = `${communityName.toLowerCase().replace(/\s+/g, '-')}-${period.toLowerCase().replace(/\s+/g, '-')}`

    const asset = await client.assets.upload('image', buffer, {
      filename: `market-report-${slug}-${Date.now()}.png`,
      contentType: 'image/png',
    })

    console.log(`[market-report-image] Uploaded to Sanity: ${asset._id}`)
    return { _type: 'reference', _ref: asset._id }
  } catch (err) {
    console.error('[market-report-image] Sanity upload error:', err instanceof Error ? err.message : err)
    return null
  }
}
