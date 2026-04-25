import { NextResponse } from 'next/server'
import { getSanityWriteClient } from '@/lib/sanity-write'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  if (searchParams.get('secret') !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const client = getSanityWriteClient()
  const posts = await client.fetch(
    `*[_type == "blogPost"] | order(publishedAt desc){
      _id, title, "slug": slug.current, publishedAt, category, status, coverImage
    }`
  )

  return NextResponse.json(posts)
}
