import { NextResponse } from 'next/server'
import { fetchAndUploadCoverImage } from '@/lib/images'
import type { ArticleCategory, ScoredArticle } from '@/lib/types'

export const maxDuration = 300

export async function POST(request: Request) {
  try {
    const { postId, title, category, excerpt, slug, secret, feedback } = await request.json()

    if (secret !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!postId || !title || !category) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Build the angle — include revision feedback if provided so Claude incorporates it
    const baseAngle = excerpt ?? title
    const angle = feedback
      ? `${baseAngle}\n\nREVISION FEEDBACK: ${feedback}. Please adjust the image concept to address this specific feedback.`
      : baseAngle

    // Build a minimal ScoredArticle from the blog post data
    const article: ScoredArticle = {
      id: postId,
      title,
      url: `/blog/${slug ?? postId}`,
      content: angle,
      category: category as ArticleCategory,
      relevanceScore: 1,
      whyItMatters: angle,
    }

    const ref = await fetchAndUploadCoverImage(
      article.url,
      category as ArticleCategory,
      article
    )

    if (!ref) {
      return NextResponse.json({ error: 'Image generation failed' }, { status: 500 })
    }

    // Convert asset ref to CDN preview URL
    // ref._ref format: 'image-{sha1}-{width}x{height}-{format}'
    const filename = ref._ref.replace(/^image-/, '').replace(/-([a-z]+)$/, '.$1')
    const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? '2nr7n3lm'
    const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production'
    const previewUrl = `https://cdn.sanity.io/images/${projectId}/${dataset}/${filename}?w=800`

    return NextResponse.json({ assetRef: ref._ref, previewUrl })
  } catch (err) {
    console.error('[generate-thumbnail]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
