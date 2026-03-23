import { NextResponse } from 'next/server'
import { loadArticles, recordShownArticles } from '@/lib/store'
import { writePost } from '@/lib/writer'
import { fetchAndUploadCoverImage } from '@/lib/images'
import { publishBlogPost } from '@/lib/sanity-write'

export const maxDuration = 300

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

  const settled = await Promise.allSettled(
    selectedArticles.map(async (article) => {
      console.log(`[publish] Writing post for: ${article!.title}`)
      const [draft, coverImageRef] = await Promise.all([
        writePost(article!),
        fetchAndUploadCoverImage(article!.url, article!.category, article!),
      ])
      const sanityId = await publishBlogPost(draft, coverImageRef)
      console.log(`[publish] Published: ${draft.title} → /blog/${draft.slug}`)
      return { id: sanityId, title: draft.title, slug: draft.slug }
    })
  )

  const results = settled
    .filter((r): r is PromiseFulfilledResult<{ id: string; title: string; slug: string }> => r.status === 'fulfilled')
    .map((r) => r.value)

  const errors = settled
    .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
    .map((r) => String(r.reason))

  return NextResponse.json({
    success: results.length > 0,
    published: results,
    errors,
    message: `${results.length} of 3 posts published successfully`,
  })
}
