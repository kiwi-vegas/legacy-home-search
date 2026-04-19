/**
 * One-shot test script: publish a specific article directly, bypassing the research/Redis pipeline.
 * Run with: npx tsx scripts/test-publish.ts
 */

import 'dotenv/config'
import { writePost } from '../lib/writer'
import { fetchAndUploadCoverImage } from '../lib/images'
import { publishBlogPost } from '../lib/sanity-write'
import type { ScoredArticle } from '../lib/types'

const article: ScoredArticle = {
  id: 'test_vb_redfin',
  title: 'Virginia Beach Housing Market: Home Prices Up 6.3% — March 2026',
  url: 'https://www.redfin.com/city/20418/VA/Virginia-Beach/housing-market',
  content: 'In March 2026, Virginia Beach home prices were up 6.3% compared to last year. The median sale price rose to around $340,000. Homes are selling quickly, with many going pending in under 30 days. The market remains competitive for buyers while sellers are seeing strong returns.',
  publishedDate: '2026-04-18',
  source: 'redfin.com',
  relevanceScore: 9,
  category: 'market-update',
  whyItMatters: 'Virginia Beach home prices jumped 6.3% year-over-year in March 2026, signaling a strong seller\'s market with fast-moving inventory. Buyers need to act decisively while homeowners are sitting on significant equity gains.',
}

async function main() {
  console.log(`\n[test] Publishing: "${article.title}"`)
  console.log(`[test] Category: ${article.category} | Score: ${article.relevanceScore}`)
  console.log(`[test] Generating blog post + thumbnail...\n`)

  const [draft, { coverImage, heroBannerImage }] = await Promise.all([
    writePost(article),
    fetchAndUploadCoverImage(article.url, article.category, article),
  ])

  console.log(`\n[test] Blog post written: "${draft.title}"`)
  console.log(`[test] Slug: /blog/${draft.slug}`)
  console.log(`[test] Cover image: ${coverImage ? 'generated ✓' : 'fallback used'}`)
  console.log(`[test] Hero banner: ${heroBannerImage ? 'generated ✓' : 'not generated'}`)

  const sanityId = await publishBlogPost(draft, coverImage, heroBannerImage)
  console.log(`\n[test] ✓ Published to Sanity: ${sanityId}`)
  console.log(`[test] Live at: https://legacy-home-search.vercel.app/blog/${draft.slug}`)
}

main().catch((err) => {
  console.error('[test] Failed:', err)
  process.exit(1)
})
