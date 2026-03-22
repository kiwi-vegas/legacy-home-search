import * as cheerio from 'cheerio'
import { getSanityWriteClient } from './sanity-write'
import type { ArticleCategory } from './types'

const UNSPLASH_CATEGORY_QUERIES: Record<ArticleCategory, string> = {
  'market-update': 'modern home real estate neighborhood',
  'buying-tips': 'modern luxury home interior',
  'selling-tips': 'beautiful house exterior sunset',
  'community-spotlight': 'neighborhood community park',
  investment: 'investment property apartments building',
  news: 'city skyline real estate',
}

// Hardcoded fallback images — real estate photos uploaded once per category.
// Used when OG image fetch fails AND Unsplash API key is not set.
// These are direct Unsplash photo URLs (no API key required to download).
const FALLBACK_IMAGE_URLS: Record<ArticleCategory, string> = {
  'market-update':      'https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=1200&q=80',
  'buying-tips':        'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=1200&q=80',
  'selling-tips':       'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=80',
  'community-spotlight':'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=80',
  investment:           'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80',
  news:                 'https://images.unsplash.com/photo-1560184897-ae75f418493e?w=1200&q=80',
}

async function fetchOgImage(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Legacy Home Search Blog Bot/1.0)' },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return null
    const html = await res.text()
    const $ = cheerio.load(html)
    return (
      $('meta[property="og:image"]').attr('content') ??
      $('meta[name="twitter:image"]').attr('content') ??
      null
    )
  } catch {
    return null
  }
}

async function fetchUnsplashImage(category: ArticleCategory): Promise<string | null> {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY
  if (!accessKey) return null

  const query = UNSPLASH_CATEGORY_QUERIES[category]
  try {
    const res = await fetch(
      `https://api.unsplash.com/photos/random?query=${encodeURIComponent(query)}&orientation=landscape`,
      { headers: { Authorization: `Client-ID ${accessKey}` } }
    )
    if (!res.ok) return null
    const data = await res.json()
    return data?.urls?.regular ?? null
  } catch {
    return null
  }
}

async function uploadImageToSanity(
  imageUrl: string
): Promise<{ _type: 'reference'; _ref: string } | null> {
  try {
    const client = getSanityWriteClient()
    const res = await fetch(imageUrl, { signal: AbortSignal.timeout(10000) })
    if (!res.ok) return null

    const contentType = res.headers.get('content-type') ?? 'image/jpeg'

    // Reject non-image content types (e.g. HTML redirect pages)
    if (!contentType.startsWith('image/')) return null

    const buffer = Buffer.from(await res.arrayBuffer())
    const ext = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpg'

    const asset = await client.assets.upload('image', buffer, {
      filename: `blog-cover-${Date.now()}.${ext}`,
      contentType,
    })

    // Sanity encodes dimensions in the asset _id: image-{hash}-{W}x{H}-{ext}
    // Reject tracking pixels and tiny images (< 200px on either dimension)
    const dimMatch = asset._id.match(/-(\d+)x(\d+)-/)
    if (dimMatch) {
      const w = parseInt(dimMatch[1], 10)
      const h = parseInt(dimMatch[2], 10)
      if (w < 200 || h < 200) return null
    }

    return { _type: 'reference', _ref: asset._id }
  } catch {
    return null
  }
}

export async function fetchAndUploadCoverImage(
  articleUrl: string,
  category: ArticleCategory,
  article?: import('./types').ScoredArticle
): Promise<{ _type: 'reference'; _ref: string } | null> {
  // 1. AI-generated image — custom DALL-E 3 image based on the article (preferred)
  if (article && process.env.OPENAI_API_KEY) {
    const { generateAndUploadCoverImage } = await import('./image-gen')
    const ref = await generateAndUploadCoverImage(article)
    if (ref) return ref
  }

  // 2. OG image from the article URL
  const ogUrl = await fetchOgImage(articleUrl)
  if (ogUrl) {
    const ref = await uploadImageToSanity(ogUrl)
    if (ref) return ref
  }

  // 3. Unsplash API (if key is set)
  const unsplashUrl = await fetchUnsplashImage(category)
  if (unsplashUrl) {
    const ref = await uploadImageToSanity(unsplashUrl)
    if (ref) return ref
  }

  // 4. Hardcoded fallback photo per category (always works)
  const fallbackUrl = FALLBACK_IMAGE_URLS[category]
  const ref = await uploadImageToSanity(fallbackUrl)
  if (ref) return ref

  return null
}
