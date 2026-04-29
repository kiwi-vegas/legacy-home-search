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
        content: `Write a 2-3 sentence Facebook post caption for a real estate blog article written by Barry Jenkins.

About Barry: He's been a real estate agent in the Hampton Roads area for over 20 years, lives in Virginia Beach, has sold thousands of homes, and his own family is rooted here. He writes these articles to give buyers and homeowners a straight-talking, informed perspective on the local market — what changes mean for their wallets, their decisions, and their lives. He's not selling anything in these posts; he's sharing what he knows so his community can make smarter decisions.

Tone: Conversational, warm, knowledgeable. First person as Barry. Feels like advice from a trusted neighbor who happens to know the market cold — not a pitch. Specific beats generic. Give them a genuine reason to click.

End with a natural call to action to read the full article — not "click the link below" but something that flows from the content.

No hashtags. Minimal emojis (only if it genuinely fits).

Article:
Title: ${post.title}
Category: ${categoryLabels[post.category ?? ''] ?? post.category}
Excerpt: ${post.excerpt ?? ''}

Return ONLY the post caption text, nothing else.`,
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

export type PlatformResult = { postSubmissionId: string } | null

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
      const [ytOutcome, ttOutcome] = await Promise.allSettled([
        publishToYouTube(post.title, videoDescription, post.videoUrl),
        publishToTikTok(copy, post.videoUrl),
      ])

      if (ytOutcome.status === 'fulfilled') {
        ytResult = { postSubmissionId: ytOutcome.value.postSubmissionId }
      } else {
        console.error('[publish-service] YouTube publish error:', ytOutcome.reason)
      }

      if (ttOutcome.status === 'fulfilled') {
        ttResult = { postSubmissionId: ttOutcome.value.postSubmissionId }
      } else {
        console.error('[publish-service] TikTok publish error:', ttOutcome.reason)
      }
    }

    await markPublished(
      postId,
      fbResult.postSubmissionId,
      ytResult?.postSubmissionId,
      ttResult?.postSubmissionId,
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
