import { NextResponse } from 'next/server'
import { client } from '@/sanity/client'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('secret')

  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const [posts, categoryCounts, monthlyActivity] = await Promise.all([
    // All posts with key fields
    client.fetch(`
      *[_type == "blogPost"] | order(publishedAt desc) {
        _id,
        title,
        slug,
        category,
        publishedAt,
        aiGenerated,
        excerpt,
        "hasCoverImage": defined(coverImage.asset)
      }
    `),

    // Count by category
    client.fetch(`
      {
        "market-update": count(*[_type == "blogPost" && category == "market-update"]),
        "buying-tips": count(*[_type == "blogPost" && category == "buying-tips"]),
        "selling-tips": count(*[_type == "blogPost" && category == "selling-tips"]),
        "community-spotlight": count(*[_type == "blogPost" && category == "community-spotlight"]),
        "investment": count(*[_type == "blogPost" && category == "investment"]),
        "news": count(*[_type == "blogPost" && category == "news"]),
        "total": count(*[_type == "blogPost"])
      }
    `),

    // Posts published in the last 90 days grouped by week
    client.fetch(`
      *[_type == "blogPost" && publishedAt >= now() + "-90d"] | order(publishedAt desc) {
        publishedAt,
        title
      }
    `),
  ])

  return NextResponse.json({
    posts,
    categoryCounts,
    recentPosts: monthlyActivity,
    generatedAt: new Date().toISOString(),
  })
}
