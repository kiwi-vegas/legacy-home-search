import { NextResponse } from 'next/server'
import { getCommunityBackgrounds, getClientImages } from '@/lib/thumbnail-asset-resolver'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  if (searchParams.get('secret') !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const community = searchParams.get('community') ?? undefined

  const backgrounds = getCommunityBackgrounds(community)
  const clientImages = getClientImages()

  return NextResponse.json({
    backgrounds: backgrounds.map(({ url, label }) => ({ url, label })),
    clientImages: clientImages.map(({ url, label }) => ({ url, label })),
  })
}
