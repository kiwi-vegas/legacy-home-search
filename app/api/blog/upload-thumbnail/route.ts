import { NextResponse } from 'next/server'
import { getSanityWriteClient } from '@/lib/sanity-write'

export const maxDuration = 60

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url)
  if (searchParams.get('secret') !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const postId = formData.get('postId')
  const file = formData.get('image') as File | null

  if (!postId || typeof postId !== 'string') {
    return NextResponse.json({ error: 'Missing postId' }, { status: 400 })
  }
  if (!file) {
    return NextResponse.json({ error: 'Missing image file' }, { status: 400 })
  }

  const client = getSanityWriteClient()
  const buffer = Buffer.from(await file.arrayBuffer())

  const asset = await client.assets.upload('image', buffer, {
    filename: file.name || 'thumbnail.jpg',
    contentType: file.type || 'image/jpeg',
  })

  await client
    .patch(postId)
    .set({
      coverImage: { _type: 'image', asset: { _type: 'reference', _ref: asset._id } },
      status: 'published',
    })
    .commit()

  return NextResponse.json({ ok: true, assetId: asset._id })
}
