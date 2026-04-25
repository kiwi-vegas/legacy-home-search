import { createClient } from '@sanity/client'
import type { BlogPostDraft } from './types'

export function getSanityWriteClient() {
  const token = process.env.SANITY_WRITE_TOKEN
  if (!token) throw new Error('SANITY_WRITE_TOKEN is not set')

  return createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? '2nr7n3lm',
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production',
    token,
    apiVersion: '2024-01-01',
    useCdn: false,
  })
}

export async function publishBlogPost(draft: BlogPostDraft): Promise<string> {
  const client = getSanityWriteClient()

  const existingSlug = await client.fetch(
    `*[_type == "blogPost" && slug.current == $slug][0]._id`,
    { slug: draft.slug }
  )

  const finalSlug = existingSlug ? `${draft.slug}-${Date.now()}` : draft.slug

  const result = await client.create({
    _type: 'blogPost',
    title: draft.title,
    slug: { _type: 'slug', current: finalSlug },
    publishedAt: new Date().toISOString(),
    category: draft.category,
    excerpt: draft.excerpt,
    body: draft.body,
    metaTitle: draft.metaTitle,
    metaDescription: draft.metaDescription,
    authorName: 'Barry Jenkins',
    aiGenerated: false,
    workflowStatus: 'media_pending',
  })

  return result._id
}
