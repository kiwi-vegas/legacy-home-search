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

const FALLBACK_IMAGE_POOLS: Record<ArticleCategory, string[]> = {
  'market-update': [
    'https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=1200&q=80',
    'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=1200&q=80',
    'https://images.unsplash.com/photo-1554995207-c18c203602cb?w=1200&q=80',
    'https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=1200&q=80',
    'https://images.unsplash.com/photo-1448630360428-65456885c650?w=1200&q=80',
  ],
  'buying-tips': [
    'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=1200&q=80',
    'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=1200&q=80',
    'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=1200&q=80',
    'https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?w=1200&q=80',
    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&q=80',
  ],
  'selling-tips': [
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=80',
    'https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=1200&q=80',
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80',
    'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=1200&q=80',
    'https://images.unsplash.com/photo-1588880331179-bc9b93a8cb5e?w=1200&q=80',
  ],
  'community-spotlight': [
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=80',
    'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&q=80',
    'https://images.unsplash.com/photo-1449844908441-8829872d2607?w=1200&q=80',
    'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=80',
    'https://images.unsplash.com/photo-1464082354059-27db6ce50048?w=1200&q=80',
  ],
  investment: [
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80',
    'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1200&q=80',
    'https://images.unsplash.com/photo-1460317442991-0ec209397118?w=1200&q=80',
    'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=1200&q=80',
    'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200&q=80',
  ],
  news: [
    'https://images.unsplash.com/photo-1560184897-ae75f418493e?w=1200&q=80',
    'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1200&q=80',
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&q=80',
    'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&q=80',
    'https://images.unsplash.com/photo-1516156008625-3a9d6067fab5?w=1200&q=80',
  ],
}

function pickFallback(category: ArticleCategory, articleUrl: string): string {
  const pool = FALLBACK_IMAGE_POOLS[category]
  let hash = 0
  for (let i = 0; i < articleUrl.length; i++) {
    hash = (hash * 31 + articleUrl.charCodeAt(i)) >>> 0
  }
  return pool[hash % pool.length]
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
    if (!contentType.startsWith('image/')) return null

    const buffer = Buffer.from(await res.arrayBuffer())
    const ext = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpg'

    const asset = await client.assets.upload('image', buffer, {
      filename: `blog-cover-${Date.now()}.${ext}`,
      contentType,
    })

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
): Promise<{
  coverImage: { _type: 'reference'; _ref: string } | null
  heroBannerImage: { _type: 'reference'; _ref: string } | null
}> {
  // 1. OpenAI gpt-image-1 (primary — generates both cover and hero banner)
  if (article && process.env.OPENAI_API_KEY) {
    console.log(`[images] Generating Barry thumbnail + hero banner via OpenAI for: "${article.title.slice(0, 60)}"`)
    const { generateAndUploadBothImages } = await import('./image-gen-openai')
    const { coverImage, heroBannerImage } = await generateAndUploadBothImages(article)
    if (coverImage !== null || heroBannerImage !== null) {
      console.log(`[images] OpenAI images generated — cover: ${coverImage?._ref ?? 'null'}, banner: ${heroBannerImage?._ref ?? 'null'}`)
      return { coverImage, heroBannerImage }
    }
    console.warn('[images] OpenAI image generation failed entirely — trying Gemini fallback')
  } else if (!process.env.OPENAI_API_KEY) {
    console.warn('[images] OPENAI_API_KEY not set — skipping OpenAI image generation')
  }

  // For all non-OpenAI paths, heroBannerImage stays null
  // 2. Google Gemini (fallback — cover only)
  if (article && process.env.GOOGLE_API_KEY) {
    console.log(`[images] Trying Gemini fallback for: "${article.title.slice(0, 60)}"`)
    const { generateAndUploadCoverImageGemini } = await import('./image-gen-gemini')
    const ref = await generateAndUploadCoverImageGemini(article)
    if (ref) {
      console.log(`[images] Gemini image generated and uploaded: ${ref._ref}`)
      return { coverImage: ref, heroBannerImage: null }
    }
    console.warn('[images] Gemini failed — falling back to OG image')
  }

  // 3. OG image from the article URL
  console.log('[images] Trying OG image scrape...')
  const ogUrl = await fetchOgImage(articleUrl)
  if (ogUrl) {
    const ref = await uploadImageToSanity(ogUrl)
    if (ref) return { coverImage: ref, heroBannerImage: null }
  }

  // 4. Unsplash API (if key is set)
  const unsplashUrl = await fetchUnsplashImage(category)
  if (unsplashUrl) {
    const ref = await uploadImageToSanity(unsplashUrl)
    if (ref) return { coverImage: ref, heroBannerImage: null }
  }

  // 5. Fallback pool — deterministic pick based on article URL
  const fallbackUrl = pickFallback(category, articleUrl)
  const ref = await uploadImageToSanity(fallbackUrl)
  if (ref) return { coverImage: ref, heroBannerImage: null }

  return { coverImage: null, heroBannerImage: null }
}
