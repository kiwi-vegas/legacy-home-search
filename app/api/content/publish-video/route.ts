import { NextResponse } from 'next/server'
import { getVAQueuePost } from '@/sanity/queries'
import { getSanityWriteClient } from '@/lib/sanity-write'
import { publishToYouTube, publishToTikTok } from '@/lib/blotato-client'
import { generateSocialCopy, buildTikTokCaption } from '@/lib/publish-service'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// Publishes video to YouTube + TikTok only — for posts already published to
// the website and Facebook that need their video pushed to video platforms.
export async function POST(request: Request) {
  const { searchParams } = new URL(request.url)
  if (searchParams.get('secret') !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { postId, videoUrl, videoThumbnailUrl } = await request.json() as {
    postId: string
    videoUrl: string
    videoThumbnailUrl?: string
  }

  if (!postId) return NextResponse.json({ error: 'postId is required' }, { status: 400 })
  if (!videoUrl) return NextResponse.json({ error: 'videoUrl is required' }, { status: 400 })

  const post = await getVAQueuePost(postId)
  if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 })

  // Save the video URL to the post so it's stored for future reference
  const client = getSanityWriteClient()
  const patch: Record<string, string> = { videoUrl }
  if (videoThumbnailUrl) patch.videoThumbnailUrl = videoThumbnailUrl
  await client.patch(postId).set(patch).commit()

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.legacyhometeamlpt.com').replace(/\/+$/, '')
  const copy = post.socialCopy ?? (await generateSocialCopy(post))
  const videoDescription = `${copy}\n\n${appUrl}/blog/${post.slug}`
  const tiktokCaption = buildTikTokCaption(copy, post.category, `${appUrl}/blog/${post.slug}`)

  const [ytOutcome, ttOutcome] = await Promise.allSettled([
    publishToYouTube(post.title, videoDescription, videoUrl, videoThumbnailUrl),
    publishToTikTok(tiktokCaption, videoUrl),
  ])

  const youtube = ytOutcome.status === 'fulfilled'
    ? { postSubmissionId: ytOutcome.value.postSubmissionId }
    : { error: ytOutcome.reason instanceof Error ? ytOutcome.reason.message : 'YouTube publish failed' }

  const tiktok = ttOutcome.status === 'fulfilled'
    ? { postSubmissionId: ttOutcome.value.postSubmissionId }
    : { error: ttOutcome.reason instanceof Error ? ttOutcome.reason.message : 'TikTok publish failed' }

  // Store submission IDs for status polling
  const idPatch: Record<string, string> = {}
  if ('postSubmissionId' in youtube && youtube.postSubmissionId) idPatch.youtubePostSubmissionId = youtube.postSubmissionId
  if ('postSubmissionId' in tiktok && tiktok.postSubmissionId) idPatch.tiktokPostSubmissionId = tiktok.postSubmissionId
  if (Object.keys(idPatch).length) await client.patch(postId).set(idPatch).commit()

  return NextResponse.json({ ok: true, youtube, tiktok })
}
