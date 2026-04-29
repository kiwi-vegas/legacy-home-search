/**
 * Publish service — orchestrates website + social publish in one action.
 *
 * Always publishes to Facebook (requires cover image).
 * Publishes to YouTube + TikTok only when post.videoUrl is set.
 */

import Anthropic from '@anthropic-ai/sdk'
import imageUrlBuilder from '@sanity/image-url'
import { createClient } from '@sanity/client'
import { publishToFacebook, publishToYouTube, publishToTikTok } from './blotato-client'
import { markPublishing, markPublished, markPublishFailed, patchSocialSubmission } from './content-workflow'
import { getSanityWriteClient } from './sanity-write'
import type { SanityBlogPost } from '../sanity/queries'

// ─── TikTok hashtags ──────────────────────────────────────────────────────────

const BASE_HASHTAGS = [
  '#hamptonroads', '#virginiabeach', '#realestate', '#realtor',
  '#norfolk', '#chesapeake', '#suffolk', '#portsmouth',
  '#barryjenkinsrealtor', '#legacyhometeam',
]

const CATEGORY_HASHTAGS: Record<string, string[]> = {
  'market-update':       ['#realestatemarket', '#housingmarket', '#marketupdate', '#homeprices'],
  'buying-tips':         ['#homebuyer', '#firsttimehomebuyer', '#buyingahome', '#homebuyingtips'],
  'selling-tips':        ['#homeseller', '#sellingyourhome', '#listingagent', '#homesellingtips'],
  'community-spotlight': ['#hamptonroadsliving', '#virginiabeachliving', '#movingtovirginia'],
  'investment':          ['#realestateinvesting', '#investmentproperty', '#rentalincome'],
  'news':                ['#realestatenews', '#housingmarket', '#mortgagerates'],
}

function buildTikTokCaption(copy: string, category: string | undefined, articleUrl: string): string {
  const categoryTags = CATEGORY_HASHTAGS[category ?? ''] ?? []
  const allTags = [...BASE_HASHTAGS, ...categoryTags]
  return `${copy}\n\n${articleUrl}\n\n${allTags.join(' ')}`
}

// ─── Social copy generation ───────────────────────────────────────────────────

export async function generateSocialCopy(post: Pick<SanityBlogPost, 'title' | 'excerpt' | 'category'>): Promise<string> {
  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const categoryLabels: Record<string, string> = {
      'market-update': 'market update',
      'buying-tips': 'home buying tips',
      'selling-tips': 'home selling tips',
      'community-spotlight': 'community spotlight',
      'investment': 'real estate investment',
      'news': 'real estate news',
    }

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: `Write a 2-3 sentence Facebook post caption for a real estate blog article written by Barry Jenkins, a local agent in Hampton Roads, Virginia Beach.

The caption is a teaser — it should make someone stop scrolling and want to read the article. Lead with the most compelling angle of the story, not with Barry's credentials.

HOOK VARIETY — rotate between these approaches based on what fits the article best. Never use the same opener twice:
- A surprising or counterintuitive fact from the topic ("Most people assume X — but the data says something different.")
- A question that hits a real concern buyers or sellers have ("Thinking about selling this spring? There's one number you need to see first.")
- A consequence or stakes opener ("What's happening to mortgage rates right now could change your timeline.")
- A local-specific hook that makes Hampton Roads residents feel seen ("If you own a home in Virginia Beach, this one's worth reading.")
- A myth-busting opener ("There's a lot of noise about the housing market right now. Here's what's actually true.")
- A direct-value opener ("Here's what closing costs actually look like for buyers in Hampton Roads — broken down clearly.")
- A client-story angle ("A buyer asked me this week if now is a good time. My honest answer is in this article.")

Rules:
- Write in first person as Barry, but don't open with "I've been in real estate for X years" or any version of his tenure
- Barry can reference his experience or local knowledge mid-caption or at the end — just not as the hook
- Conversational, warm, direct. Feels like a trusted neighbor sharing something useful, not a pitch
- End with a natural call to action that flows from the content
- No hashtags. Minimal emojis (only if it genuinely fits the tone)
- 2-3 sentences max

Article:
Title: ${post.title}
Category: ${categoryLabels[post.category ?? ''] ?? post.category}
Excerpt: ${post.excerpt ?? ''}

Return ONLY the caption text, nothing else.`,
      }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text.trim() : ''
    return text
  } catch {
    return `I've been watching this market for over 20 years, and ${post.title.toLowerCase()} is something every Hampton Roads homeowner and buyer should understand right now. Read the full breakdown on the blog.`
  }
}

// ─── Image URL resolver ───────────────────────────────────────────────────────

function getSanityImageUrl(coverImage: any): string | null {
  if (!coverImage?.asset?._ref) return null

  const readClient = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? '2nr7n3lm',
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production',
    apiVersion: '2024-01-01',
    useCdn: true,
  })

  const builder = imageUrlBuilder(readClient)
  return builder.image(coverImage).width(1200).url()
}

// ─── Publish result types ─────────────────────────────────────────────────────

export type PlatformResult = { postSubmissionId: string } | { error: string } | null

export type PublishResult =
  | {
      ok: true
      facebook: PlatformResult
      youtube: PlatformResult
      tiktok: PlatformResult
    }
  | { ok: false; error: string }

// ─── Social-only (for already-published posts) ────────────────────────────────

export async function publishSocialOnly(
  post: SanityBlogPost,
  socialCopy?: string,
): Promise<PublishResult> {
  const postId = post._id
  try {
    const copy = socialCopy?.trim() || (await generateSocialCopy(post))
    const imageUrl = getSanityImageUrl(post.coverImage)
    if (!imageUrl) {
      return { ok: false, error: 'No cover image — cannot post to Facebook without an image.' }
    }

    const appUrl = (process.env.NEXT_PUBLIC_APP_URL && process.env.NEXT_PUBLIC_APP_URL.trim())
      ? process.env.NEXT_PUBLIC_APP_URL.trim().replace(/\/+$/, '')
      : 'https://www.legacyhometeamlpt.com'
    const fullCopy = `${copy}\n\n${appUrl}/blog/${post.slug}`

    const { postSubmissionId } = await publishToFacebook(fullCopy, imageUrl)
    await patchSocialSubmission(postId, postSubmissionId, copy)

    return { ok: true, facebook: { postSubmissionId }, youtube: null, tiktok: null }
  } catch (err) {
    console.error('[publish-service] Social-only publish error:', err instanceof Error ? err.message : err)
    return { ok: false, error: err instanceof Error ? err.message : 'Unknown publish error' }
  }
}

// ─── Full publish (website + all social platforms) ────────────────────────────

export async function publishPostToAll(
  post: SanityBlogPost,
  socialCopy?: string,
): Promise<PublishResult> {
  const postId = post._id

  try {
    await markPublishing(postId)

    const copy = socialCopy?.trim() || (await generateSocialCopy(post))

    const imageUrl = getSanityImageUrl(post.coverImage)
    if (!imageUrl) {
      await markPublishFailed(postId)
      return { ok: false, error: 'No cover image set — cannot publish to Facebook without an image.' }
    }

    const appUrl = (process.env.NEXT_PUBLIC_APP_URL && process.env.NEXT_PUBLIC_APP_URL.trim())
      ? process.env.NEXT_PUBLIC_APP_URL.trim().replace(/\/+$/, '')
      : 'https://www.legacyhometeamlpt.com'
    const fullCopy = `${copy}\n\n${appUrl}/blog/${post.slug}`

    // Always publish to Facebook
    const fbResult = await publishToFacebook(fullCopy, imageUrl)

    // Publish to YouTube + TikTok only if a video has been uploaded
    let ytResult: PlatformResult = null
    let ttResult: PlatformResult = null

    if (post.videoUrl) {
      const videoDescription = `${copy}\n\n${appUrl}/blog/${post.slug}`

      // Run YouTube and TikTok concurrently; one failure doesn't block the other
      const tiktokCaption = buildTikTokCaption(copy, post.category, `${appUrl}/blog/${post.slug}`)

      const [ytOutcome, ttOutcome] = await Promise.allSettled([
        publishToYouTube(post.title, videoDescription, post.videoUrl, post.videoThumbnailUrl),
        publishToTikTok(tiktokCaption, post.videoUrl),
      ])

      if (ytOutcome.status === 'fulfilled') {
        ytResult = { postSubmissionId: ytOutcome.value.postSubmissionId }
      } else {
        const msg = ytOutcome.reason instanceof Error ? ytOutcome.reason.message : 'YouTube publish failed'
        console.error('[publish-service] YouTube publish error:', msg)
        ytResult = { error: msg }
      }

      if (ttOutcome.status === 'fulfilled') {
        ttResult = { postSubmissionId: ttOutcome.value.postSubmissionId }
      } else {
        const msg = ttOutcome.reason instanceof Error ? ttOutcome.reason.message : 'TikTok publish failed'
        console.error('[publish-service] TikTok publish error:', msg)
        ttResult = { error: msg }
      }
    }

    await markPublished(
      postId,
      fbResult.postSubmissionId,
      'postSubmissionId' in (ytResult ?? {}) ? (ytResult as { postSubmissionId: string }).postSubmissionId : undefined,
      'postSubmissionId' in (ttResult ?? {}) ? (ttResult as { postSubmissionId: string }).postSubmissionId : undefined,
    )

    if (!socialCopy) {
      const writeClient = getSanityWriteClient()
      await writeClient.patch(postId).set({ socialCopy: copy }).commit()
    }

    return {
      ok: true,
      facebook: { postSubmissionId: fbResult.postSubmissionId },
      youtube: ytResult,
      tiktok: ttResult,
    }
  } catch (err) {
    console.error('[publish-service] Publish error:', err instanceof Error ? err.message : err)
    try { await markPublishFailed(postId) } catch { /* ignore secondary error */ }
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Unknown publish error',
    }
  }
}
