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

// ─── Team Members ─────────────────────────────────────────────────────────────

export type SanityTeamMember = {
  _id: string
  name: string
  slug: string
  title?: string
  phone?: string
  email?: string
  photoUrl?: string
  photoPath?: string
  subdomain?: string
  bio?: string[]
  specialties?: string[]
  years?: string | null
  transactions?: string | null
  sortOrder?: number
  active?: boolean
}

export async function getTeamMembers(): Promise<SanityTeamMember[]> {
  return client.fetch(
    `*[_type == "teamMember" && active != false] | order(sortOrder asc, name asc){
      _id, name, "slug": slug.current, title, phone, email,
      "photoUrl": photo.asset->url, photoPath,
      subdomain, bio, specialties, years, transactions, sortOrder, active
    }`,
    {},
    { next: { revalidate: 60 } }
  )
}

export async function getAllTeamMemberSlugs(): Promise<string[]> {
  const results = await client.fetch<Array<{ slug: string }>>(
    `*[_type == "teamMember"]{ "slug": slug.current }`,
    {},
    { next: { revalidate: 60 } }
  )
  return results.map((r) => r.slug)
}

export async function getTeamMember(slug: string): Promise<SanityTeamMember | null> {
  return client.fetch(
    `*[_type == "teamMember" && slug.current == $slug][0]{
      _id, name, "slug": slug.current, title, phone, email,
      "photoUrl": photo.asset->url, photoPath,
      subdomain, bio, specialties, years, transactions, sortOrder, active
    }`,
    { slug },
    { next: { revalidate: 60 } }
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

// ─── Market Reports ───────────────────────────────────────────────────────────

export type SanityMarketReport = {
  _id: string
  community: string
  communityName: string
  reportPeriod: string
  slug: string
  publishedAt?: string
  medianListPrice?: string
  medianPriceChange?: string
  daysOnMarket?: string
  activeInventory?: string
  inventoryChange?: string
  priceReductions?: string
  marketSummary?: string
  buyerSection?: string
  sellerSection?: string
  investorSection?: string
  barrysTake?: string
  coverImage?: any
  metaTitle?: string
  metaDescription?: string
}

export async function getMarketReports(limit = 24): Promise<SanityMarketReport[]> {
  return client.fetch(
    `*[_type == "marketReport" && published == true] | order(publishedAt desc)[0...$limit]{
      _id, community, communityName, reportPeriod, "slug": slug.current,
      publishedAt, medianListPrice, medianPriceChange, marketSummary, coverImage
    }`,
    { limit: limit - 1 },
    { next: { revalidate: 60 } }
  )
}

export async function getMarketReport(slug: string): Promise<SanityMarketReport | null> {
  return client.fetch(
    `*[_type == "marketReport" && slug.current == $slug && published == true][0]{
      _id, community, communityName, reportPeriod, "slug": slug.current, publishedAt,
      medianListPrice, medianPriceChange, daysOnMarket, activeInventory,
      inventoryChange, priceReductions, marketSummary, buyerSection,
      sellerSection, investorSection, barrysTake, coverImage,
      metaTitle, metaDescription
    }`,
    { slug },
    { next: { revalidate: 60 } }
  )
}

export async function getLatestMarketReport(community: string): Promise<SanityMarketReport | null> {
  return client.fetch(
    `*[_type == "marketReport" && community == $community && published == true] | order(publishedAt desc)[0]{
      _id, community, communityName, reportPeriod, "slug": slug.current,
      publishedAt, medianListPrice, medianPriceChange, marketSummary
    }`,
    { community },
    { next: { revalidate: 60 } }
  )
}
