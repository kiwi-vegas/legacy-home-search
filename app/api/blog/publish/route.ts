import { NextResponse } from 'next/server'
import { loadArticles, recordShownArticles } from '@/lib/store'
import { writePost } from '@/lib/writer'
import { fetchAndUploadCoverImage } from '@/lib/images'
import { publishBlogPost } from '@/lib/sanity-write'

export const maxDuration = 60

export async function POST(request: Request) {
  const adminSecret = process.env.ADMIN_SECRET
  if (!adminSecret) return NextResponse.json({ error: 'Not configured' }, { status: 500 })

  let body: { secret?: string; date?: string; articleIds?: string[] }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (body.secret !== adminSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { date, articleIds } = body

  if (!date || !articleIds || articleIds.length !== 3) {
    return NextResponse.json({ error: 'Provide date and exactly 3 articleIds' }, { status: 400 })
  }

  const stored = await loadArticles(date)
  if (!stored) {
    return NextResponse.json({ error: 'No articles found for this date' }, { status: 404 })
  }

  const selectedArticles = articleIds.map((id) => stored.articles.find((a) => a.id === id)).filter(Boolean)

  if (selectedArticles.length !== 3) {
    return NextResponse.json({ error: 'One or more article IDs not found' }, { status: 400 })
  }

  // Mark the articles the operator skipped so they aren't shown again after 2 passes
  const selectedUrls = new Set(selectedArticles.map((a) => a!.url))
  const skippedUrls = stored.articles.filter((a) => !selectedUrls.has(a.url)).map((a) => a.url)
  if (skippedUrls.length > 0) {
    await recordShownArticles(skippedUrls)
  }

  const results: Array<{ id: string; title: string; slug: string }> = []
  const errors: string[] = []

  for (const article of selectedArticles) {
    try {
      console.log(`[publish] Writing post for: ${article!.title}`)

      const [draft, coverImageRef] = await Promise.all([
        writePost(article!),
        fetchAndUploadCoverImage(article!.url, article!.category, article!),
      ])

      const sanityId = await publishBlogPost(draft, coverImageRef)
      results.push({ id: sanityId, title: draft.title, slug: draft.slug })
      console.log(`[publish] Published: ${draft.title} → /blog/${draft.slug}`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      console.error(`[publish] Failed for ${article!.title}:`, msg)
      errors.push(`"${article!.title}": ${msg}`)
    }
  }

  return NextResponse.json({
    success: results.length > 0,
    published: results,
    errors,
    message: `${results.length} of 3 posts published successfully`,
  })
}
