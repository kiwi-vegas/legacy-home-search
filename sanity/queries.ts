import { client } from './client'

// ─── Types ──────────────────────────────────────────────────────────────────

export type SanityHomepage = {
  heroHeadline?: string
  heroSubheadline?: string
  ctaStripHeadline?: string
  ctaStripBody?: string
  trustStats?: Array<{ value: string; label: string; isStatic?: boolean }>
}

export type SanityCommunityPage = {
  name?: string
  heroHeadline?: string
  heroSubheadline?: string
  overviewTitle?: string
  overviewBody?: any[]
  metaTitle?: string
  metaDescription?: string
  quickStats?: Array<{ key: string; value: string }>
  heroImage?: any
  heroImageUrl?: string
  sectionImages?: Array<{ role: string; image: any; imageUrl?: string }>
}

export type SanityReview = {
  _id: string
  platform: 'google' | 'zillow'
  reviewerName: string
  reviewText: string
}

export type SanitySiteSettings = {
  agentName?: string
  phone?: string
  email?: string
  licenseNumber?: string
  address?: string
  brokerage?: string
  tagline?: string
}

// ─── Queries ─────────────────────────────────────────────────────────────────

export async function getHomepage(): Promise<SanityHomepage | null> {
  return client.fetch(
    `*[_type == "homepage" && _id == "homepage"][0]{
      heroHeadline, heroSubheadline, ctaStripHeadline, ctaStripBody,
      trustStats[]{ value, label, isStatic }
    }`,
    {},
    { next: { revalidate: 60 } }
  )
}

export async function getFeaturedReviews(): Promise<SanityReview[]> {
  return client.fetch(
    `*[_type == "review" && featured == true] | order(sortOrder asc){
      _id, platform, reviewerName, reviewText
    }`,
    {},
    { next: { revalidate: 60 } }
  )
}

export async function getCommunityPage(slug: string): Promise<SanityCommunityPage | null> {
  return client.fetch(
    `*[_type == "communityPage" && slug.current == $slug][0]{
      name, heroHeadline, heroSubheadline,
      overviewTitle, overviewBody,
      metaTitle, metaDescription,
      quickStats[]{ key, value },
      heroImage,
      "heroImageUrl": heroImage.asset->url,
      sectionImages[]{ role, image, "imageUrl": image.asset->url }
    }`,
    { slug },
    { next: { revalidate: 60 } }
  )
}

export async function getSiteSettings(): Promise<SanitySiteSettings | null> {
  return client.fetch(
    `*[_type == "siteSettings" && _id == "siteSettings"][0]{
      agentName, phone, email, licenseNumber, address, brokerage, tagline
    }`,
    {},
    { next: { revalidate: 300 } }
  )
}

// ─── Blog ─────────────────────────────────────────────────────────────────────

export type SanityBlogPost = {
  _id: string
  title: string
  slug: string
  publishedAt: string
  category: string
  excerpt?: string
  coverImage?: any
  body?: any[]
  metaTitle?: string
  metaDescription?: string
  aiGenerated?: boolean
  sourceUrl?: string
}

export async function getBlogPosts(limit = 20): Promise<SanityBlogPost[]> {
  return client.fetch(
    `*[_type == "blogPost"] | order(publishedAt desc)[0...$limit]{
      _id, title, "slug": slug.current, publishedAt,
      category, excerpt, coverImage, aiGenerated
    }`,
    { limit: limit - 1 },
    { next: { revalidate: 60 } }
  )
}

export async function getBlogPost(slug: string): Promise<SanityBlogPost | null> {
  return client.fetch(
    `*[_type == "blogPost" && slug.current == $slug][0]{
      _id, title, "slug": slug.current, publishedAt,
      category, excerpt, coverImage, body, metaTitle, metaDescription, aiGenerated
    }`,
    { slug },
    { next: { revalidate: 60 } }
  )
}
