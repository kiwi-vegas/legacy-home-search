import { NextResponse } from 'next/server'
import { getSanityWriteClient } from '@/lib/sanity-write'
import { markMediaReady } from '@/lib/content-workflow'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url)
  if (searchParams.get('secret') !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const contentType = request.headers.get('content-type') ?? ''

  let postId: string
  let socialCopy: string
  let videoScript: string | undefined
  let videoUrl: string | undefined
  let imageBuffer: Buffer | null = null
  let imageFilename: string = 'thumbnail.jpg'
  let imageUrl: string | null = null

  if (contentType.includes('multipart/form-data')) {
    const form = await request.formData()
    postId = form.get('postId') as string
    socialCopy = (form.get('socialCopy') as string) ?? ''
    videoScript = (form.get('videoScript') as string) || undefined
    videoUrl = (form.get('videoUrl') as string) || undefined
    imageUrl = (form.get('imageUrl') as string) ?? null

    const file = form.get('image') as File | null
    if (file) {
      imageBuffer = Buffer.from(await file.arrayBuffer())
      imageFilename = file.name || 'thumbnail.jpg'
    }
  } else {
    const body = await request.json()
    postId = body.postId
    socialCopy = body.socialCopy ?? ''
    videoScript = body.videoScript || undefined
    videoUrl = body.videoUrl || undefined
    imageUrl = body.imageUrl ?? null
  }

  if (!postId) {
    return NextResponse.json({ error: 'postId is required' }, { status: 400 })
  }

  if (!imageBuffer && !imageUrl) {
    return NextResponse.json({ error: 'image or imageUrl is required' }, { status: 400 })
  }

  try {
    const client = getSanityWriteClient()

    let assetRef: { _type: 'reference'; _ref: string }

    if (imageBuffer) {
      const asset = await client.assets.upload('image', imageBuffer, {
        filename: imageFilename,
        contentType: 'image/jpeg',
      })
      assetRef = { _type: 'reference', _ref: asset._id }
    } else {
      // Download from URL (e.g. DALL-E temp URL) and upload to Sanity CDN
      const res = await fetch(imageUrl!, { signal: AbortSignal.timeout(30000) })
      if (!res.ok) throw new Error(`Failed to fetch image from URL: ${res.status}`)
      const buf = Buffer.from(await res.arrayBuffer())
      const asset = await client.assets.upload('image', buf, {
        filename: `thumbnail-${postId}-${Date.now()}.png`,
        contentType: 'image/png',
      })
      assetRef = { _type: 'reference', _ref: asset._id }
    }

    await markMediaReady(postId, assetRef, socialCopy, videoScript, videoUrl)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[mark-ready] Error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to mark ready' },
      { status: 500 },
    )
  }
}
