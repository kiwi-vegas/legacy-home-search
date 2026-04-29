import { NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { getHeyGenVideoStatus } from '@/lib/heygen-client'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// Polls HeyGen for video status. When completed, streams the video from
// HeyGen's CDN into Vercel Blob and returns the permanent public URL.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  if (searchParams.get('secret') !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const videoId = searchParams.get('videoId')
  if (!videoId) {
    return NextResponse.json({ error: 'videoId is required' }, { status: 400 })
  }

  try {
    const result = await getHeyGenVideoStatus(videoId)

    if (result.status !== 'completed') {
      return NextResponse.json(result)
    }

    // Stream the video from HeyGen into Vercel Blob for a permanent URL
    const videoRes = await fetch(result.videoUrl, { signal: AbortSignal.timeout(50000) })
    if (!videoRes.ok) {
      throw new Error(`Failed to fetch HeyGen video (${videoRes.status})`)
    }

    const blob = await put(`heygen-${videoId}.mp4`, videoRes.body!, {
      access: 'public',
      contentType: 'video/mp4',
    })

    return NextResponse.json({
      status: 'completed',
      videoUrl: blob.url,
      duration: result.duration,
    })
  } catch (err) {
    console.error('[heygen-status]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Status check failed' },
      { status: 500 },
    )
  }
}
