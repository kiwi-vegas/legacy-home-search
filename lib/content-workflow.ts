/**
 * Content workflow state transitions and helpers.
 *
 * All state lives in Sanity on the blogPost document (workflowStatus field).
 * This module provides typed helpers so API routes don't deal with raw GROQ.
 */

import { getSanityWriteClient } from './sanity-write'
import type { WorkflowStatus } from '../sanity/queries'

export type { WorkflowStatus }

export const ACTIVE_QUEUE_STATUSES: WorkflowStatus[] = [
  'media_pending',
  'media_ready',
  'publish_pending',
  'publishing',
  'publish_failed',
]

// ─── State transitions ────────────────────────────────────────────────────────

export async function transitionStatus(
  postId: string,
  newStatus: WorkflowStatus,
): Promise<void> {
  const client = getSanityWriteClient()
  await client.patch(postId).set({ workflowStatus: newStatus }).commit()
}

export async function markMediaReady(
  postId: string,
  coverImageRef: { _type: 'reference'; _ref: string },
  socialCopy: string,
): Promise<void> {
  const client = getSanityWriteClient()
  await client
    .patch(postId)
    .set({
      coverImage: { _type: 'image', asset: coverImageRef },
      socialCopy,
      workflowStatus: 'media_ready' as WorkflowStatus,
    })
    .commit()
}

export async function markPublishing(postId: string): Promise<void> {
  await transitionStatus(postId, 'publishing')
}

export async function markPublished(
  postId: string,
  blotatoPostSubmissionId: string,
): Promise<void> {
  const client = getSanityWriteClient()
  await client
    .patch(postId)
    .set({
      workflowStatus: 'published' as WorkflowStatus,
      blotatoPostSubmissionId,
      blotatoPublishStatus: 'pending',
    })
    .commit()
}

export async function markPublishFailed(postId: string): Promise<void> {
  await transitionStatus(postId, 'publish_failed')
}

export async function updateBlotatoStatus(
  postId: string,
  status: 'published' | 'failed',
  postUrl?: string,
): Promise<void> {
  const client = getSanityWriteClient()
  await client
    .patch(postId)
    .set({
      blotatoPublishStatus: status,
      ...(status === 'published' && {
        blotatoPublishedAt: new Date().toISOString(),
        facebookPostUrl: postUrl ?? null,
      }),
    })
    .commit()
}
