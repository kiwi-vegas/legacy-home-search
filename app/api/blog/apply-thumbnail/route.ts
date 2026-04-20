import { NextResponse } from 'next/server'
import { getSanityWriteClient } from '@/lib/sanity-write'

export async function POST(request: Request) {
  try {
    const { postId, assetRef, heroBannerAssetRef, secret } = await request.json()

    if (secret !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!postId || !assetRef) {
      return NextResponse.json({ error: 'Missing postId or assetRef' }, { status: 400 })
    }

    const client = getSanityWriteClient()

    const patch = client.patch(postId).set({
      coverImage: {
        _type: 'image',
        asset: { _type: 'reference', _ref: assetRef },
      },
      ...(heroBannerAssetRef ? {
        heroBannerImage: {
          _type: 'image',
          asset: { _type: 'reference', _ref: heroBannerAssetRef },
        },
      } : {}),
    })

    await patch.commit()

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[apply-thumbnail]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
