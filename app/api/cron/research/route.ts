import { NextResponse } from 'next/server'
import { fetchAndScoreArticles } from '@/lib/research'
import { storeArticles } from '@/lib/store'
import { sendDigestEmail } from '@/lib/email'

export const maxDuration = 60

export async function GET(request: Request) {
  // Verify this is a legitimate cron request from Vercel
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return runResearch()
}

// Also allow POST for manual testing
export async function POST(request: Request) {
  const adminSecret = process.env.ADMIN_SECRET
  if (!adminSecret) return NextResponse.json({ error: 'Not configured' }, { status: 500 })

  const body = await request.json().catch(() => ({}))
  if (body.secret !== adminSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return runResearch()
}

async function runResearch() {
  const date = new Date().toISOString().split('T')[0] // YYYY-MM-DD

  try {
    console.log(`[research] Starting daily research for ${date}`)

    const articles = await fetchAndScoreArticles()
    console.log(`[research] Found ${articles.length} scored articles`)

    if (articles.length === 0) {
      return NextResponse.json({ success: false, message: 'No articles found', date })
    }

    await storeArticles(date, { date, articles, fetchedAt: new Date().toISOString() })
    console.log(`[research] Stored ${articles.length} articles in Redis`)

    await sendDigestEmail(articles, date)
    console.log(`[research] Email digest sent`)

    return NextResponse.json({ success: true, date, articleCount: articles.length })
  } catch (error) {
    console.error('[research] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
