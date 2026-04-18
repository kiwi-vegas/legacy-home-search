import { NextResponse } from 'next/server'
import { client } from '@/sanity/client'

export const revalidate = 3600 // re-fetch from Sanity at most once per hour

export async function GET() {
  try {
    const posts = await client.fetch(
      `*[_type == "blogPost"] | order(publishedAt desc)[0...5]{
        title,
        "slug": slug.current,
        category
      }`,
      {},
      { next: { revalidate: 3600 } }
    )
    return NextResponse.json({ posts })
  } catch {
    return NextResponse.json({ posts: [] })
  }
}
