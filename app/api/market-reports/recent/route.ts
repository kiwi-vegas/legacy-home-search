import { NextResponse } from 'next/server'
import { getSanityWriteClient } from '@/lib/sanity-write'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('secret')
  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const client = getSanityWriteClient()
  const reports = await client.fetch(
    `*[_type == "marketReport"] | order(_createdAt desc)[0..9]{
      _id, communityName, reportPeriod, "slug": slug.current,
      publishedAt, _createdAt, published
    }`
  )

  return NextResponse.json(reports)
}
