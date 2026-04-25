/**
 * Publish service — orchestrates website + Facebook publish in one action.
 *
 * Steps:
 *   1. Transition Sanity workflowStatus → 'publishing'
 *   2. Build social copy (Claude) or use provided copy
 *   3. Get Sanity image URL for Blotato
 *   4. Call Blotato → store postSubmissionId
 *   5. Transition Sanity workflowStatus → 'published'
 *
 * Polling (status resolution) is handled separately by the blotato-status API route.
 */

import Anthropic from '@anthropic-ai/sdk'
import imageUrlBuilder from '@sanity/image-url'
import { createClient } from '@sanity/client'
import { publishToFacebook } from './blotato-client'
import { markPublishing, markPublished, markPublishFailed } from './content-workflow'
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
    // Fallback to basic copy if Claude fails
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

// ─── Main publish ─────────────────────────────────────────────────────────────

export type PublishResult =
  | { ok: true; postSubmissionId: string }
  | { ok: false; error: string }

export async function publishPostToAll(
  post: SanityBlogPost,
  socialCopy?: string,
): Promise<PublishResult> {
  const postId = post._id

  try {
    await markPublishing(postId)

    // Resolve social copy
    const copy = socialCopy?.trim() || (await generateSocialCopy(post))

    // Get cover image URL
    const imageUrl = getSanityImageUrl(post.coverImage)
    if (!imageUrl) {
      await markPublishFailed(postId)
      return { ok: false, error: 'No cover image set — cannot publish to Facebook without an image.' }
    }

    // Append blog URL to copy
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://legacyhomesearch.com'
    const fullCopy = `${copy}\n\n${appUrl}/blog/${post.slug}`

    // Call Blotato
    const { postSubmissionId } = await publishToFacebook(fullCopy, imageUrl)

    // Mark published in Sanity (workflowStatus + submission ID)
    await markPublished(postId, postSubmissionId)

    // Update social copy on doc if it was auto-generated
    if (!socialCopy) {
      const writeClient = getSanityWriteClient()
      await writeClient.patch(postId).set({ socialCopy: copy }).commit()
    }

    return { ok: true, postSubmissionId }
  } catch (err) {
    console.error('[publish-service] Publish error:', err instanceof Error ? err.message : err)
    try { await markPublishFailed(postId) } catch { /* ignore secondary error */ }
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Unknown publish error',
    }
  }
}
