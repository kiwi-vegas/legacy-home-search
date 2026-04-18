import { NextResponse } from 'next/server'
import { getSanityWriteClient } from '@/lib/sanity-write'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const secret = formData.get('secret') as string | null
    const file = formData.get('file') as File | null

    if (secret !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const contentType = file.type || 'image/jpeg'
    const filename = file.name || `upload-${Date.now()}.jpg`

    const client = getSanityWriteClient()
    const asset = await client.assets.upload('image', buffer, { filename, contentType })

    // Convert asset _id to CDN preview URL
    // asset._id format: 'image-{sha1}-{width}x{height}-{format}'
    const cdnFilename = asset._id.replace(/^image-/, '').replace(/-([a-z]+)$/, '.$1')
    const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? '2nr7n3lm'
    const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production'
    const previewUrl = `https://cdn.sanity.io/images/${projectId}/${dataset}/${cdnFilename}?w=800`

    return NextResponse.json({ assetRef: asset._id, previewUrl })
  } catch (err) {
    console.error('[upload-thumbnail]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Upload failed' },
      { status: 500 }
    )
  }
}
