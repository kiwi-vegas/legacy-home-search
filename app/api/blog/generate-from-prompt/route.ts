import fs from 'fs'
import path from 'path'
import { NextResponse } from 'next/server'
import { generateFromApprovedPrompt } from '@/lib/image-gen-openai'
import type { ArticleCategory, ScoredArticle } from '@/lib/types'

export const maxDuration = 300

export async function POST(request: Request) {
  try {
    const {
      postId,
      title,
      category,
      excerpt,
      slug,
      prompt,
      expressionFile,
      backgroundFile,
      secret,
    } = await request.json()

    if (secret !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!postId || !title || !category || !prompt || !expressionFile || !backgroundFile) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const publicDir = path.join(process.cwd(), 'public')
    const expressionPath = path.join(publicDir, expressionFile)
    const backgroundPath = path.join(publicDir, backgroundFile)

    if (!expressionPath.startsWith(publicDir) || !backgroundPath.startsWith(publicDir)) {
      return NextResponse.json({ error: 'Invalid file path' }, { status: 400 })
    }
    if (!fs.existsSync(expressionPath)) {
      return NextResponse.json({ error: `Expression file not found: ${expressionFile}` }, { status: 400 })
    }
    if (!fs.existsSync(backgroundPath)) {
      return NextResponse.json({ error: `Background file not found: ${backgroundFile}` }, { status: 400 })
    }

    const expressionBuffer = fs.readFileSync(expressionPath)
    const backgroundBuffer = fs.readFileSync(backgroundPath)

    const article: ScoredArticle = {
      id: postId,
      title,
      url: `/blog/${slug ?? postId}`,
      content: excerpt ?? title,
      category: category as ArticleCategory,
      relevanceScore: 1,
      whyItMatters: excerpt ?? title,
    }

    const { coverImage, heroBannerImage } = await generateFromApprovedPrompt({
      prompt,
      expressionBuffer,
      backgroundBuffer,
      article,
    })

    if (!coverImage) {
      return NextResponse.json({ error: 'Image generation failed' }, { status: 500 })
    }

    const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? '2nr7n3lm'
    const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production'
    const toUrl = (ref: string, w: number) => {
      const filename = ref.replace(/^image-/, '').replace(/-([a-z]+)$/, '.$1')
      return `https://cdn.sanity.io/images/${projectId}/${dataset}/${filename}?w=${w}`
    }

    return NextResponse.json({
      assetRef: coverImage._ref,
      previewUrl: toUrl(coverImage._ref, 800),
      heroBannerAssetRef: heroBannerImage?._ref ?? null,
      heroBannerPreviewUrl: heroBannerImage ? toUrl(heroBannerImage._ref, 1200) : null,
    })
  } catch (err) {
    console.error('[generate-from-prompt]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    )
  }
}
