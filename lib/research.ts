import Anthropic from '@anthropic-ai/sdk'
import type { RawArticle, ScoredArticle, ArticleCategory } from './types'
import { getSkippedUrls } from './store'

const SEARCH_QUERIES = [
  // Property values & investment — buyer/owner impact
  'Las Vegas home prices forecast 2025 2026',
  'Las Vegas real estate market update housing values',
  'Nevada property investment returns rental market 2025',
  'Las Vegas housing market buyers sellers trends',
  'Henderson Summerlin home values appreciation 2025',
  'Las Vegas real estate investment opportunity outlook',

  // Law & policy changes affecting homeowners
  'Nevada homeowner law changes 2025 property rights',
  'Nevada property tax changes homeowners 2025',
  'Nevada HOA law regulations 2025',
  'Las Vegas zoning law changes development 2025',
  'Nevada real estate legislation buyers sellers 2025',

  // Major development projects & economic growth signals
  'Las Vegas major development projects jobs economy 2025',
  'Las Vegas new construction billion dollar development',
  'Nevada economic growth tech company relocating Las Vegas',
  'Las Vegas stadium arena district development',
  'Summerlin Henderson new development master planned community',
  'Las Vegas data center tech campus expansion 2025',
  'Nevada corporate relocation headquarters Las Vegas 2025',

  // Celebrity & high-profile moves to Las Vegas
  'celebrity moving Las Vegas Nevada 2025',
  'billionaire executive relocating Las Vegas Nevada',
  'Las Vegas luxury real estate high profile purchase 2025',

  // Big corporate investments (Tesla-scale signals)
  'major company factory warehouse Las Vegas Nevada 2025',
  'Tesla Panasonic Apple Google Las Vegas Nevada facility',
  'Las Vegas economy jobs growth Fortune 500 2025',
]

// Pick 8 queries per day, rotating through the full list so all topics get covered
function getQueriesForToday(): string[] {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  )
  const start = (dayOfYear * 8) % SEARCH_QUERIES.length
  const queries: string[] = []
  for (let i = 0; i < 8; i++) {
    queries.push(SEARCH_QUERIES[(start + i) % SEARCH_QUERIES.length])
  }
  return queries
}

export async function fetchAndScoreArticles(): Promise<ScoredArticle[]> {
  const queries = getQueriesForToday()
  const tavilyApiKey = process.env.TAVILY_API_KEY
  if (!tavilyApiKey) throw new Error('TAVILY_API_KEY is not set')

  // Run all 6 Tavily searches
  const rawArticles: RawArticle[] = []
  const seenUrls = new Set<string>()

  for (const query of queries) {
    try {
      const res = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tavilyApiKey}`,
        },
        body: JSON.stringify({
          query,
          search_depth: 'basic',
          max_results: 7,
          include_answer: false,
        }),
      })
      if (!res.ok) continue
      const data = await res.json()
      for (const result of data.results ?? []) {
        if (!seenUrls.has(result.url)) {
          seenUrls.add(result.url)
          rawArticles.push({
            id: `article_${rawArticles.length}`,
            title: result.title,
            url: result.url,
            content: result.content ?? '',
            publishedDate: result.published_date,
            source: new URL(result.url).hostname.replace('www.', ''),
          })
        }
      }
    } catch {
      // Skip failed queries silently
    }
  }

  if (rawArticles.length === 0) return []

  // Filter out articles the operator has skipped twice without picking
  const skippedUrls = await getSkippedUrls()
  const filteredArticles = skippedUrls.size > 0
    ? rawArticles.filter((a) => !skippedUrls.has(a.url))
    : rawArticles

  if (filteredArticles.length === 0) return []

  // Claude scores and categorizes the articles
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const articleList = filteredArticles
    .slice(0, 30) // cap at 30 to stay within token budget
    .map(
      (a, i) =>
        `[${i}] TITLE: ${a.title}\nURL: ${a.url}\nSNIPPET: ${a.content.slice(0, 300)}\nDATE: ${a.publishedDate ?? 'unknown'}`
    )
    .join('\n\n')

  const response = await anthropic.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 4000,
    messages: [
      {
        role: 'user',
        content: `You are a real estate content strategist for Legacy Home Search, a Las Vegas real estate agency. Their clients are home buyers, sellers, and investors in the Las Vegas, Henderson, Summerlin, and greater Nevada market.

Evaluate these articles and return a JSON array. For each article, assign:
- relevanceScore: 1-10 (how useful/interesting is this for Las Vegas homebuyers, sellers, or investors?)
- category: one of "market-update" | "buying-tips" | "selling-tips" | "community-spotlight" | "investment" | "news"
- whyItMatters: exactly 2 sentences explaining why a Las Vegas homeowner or buyer should care

SCORING PRIORITY (give extra weight to):
1. Las Vegas / Nevada property values and investment returns — especially what affects buyers and current homeowners
2. Nevada law changes affecting homeowners (property tax, HOA rules, zoning, tenant/landlord laws)
3. Major development projects bringing jobs and economic growth to Las Vegas (stadiums, tech campuses, factories, corporate HQ relocations)
4. High-profile celebrity or executive moves to Las Vegas — signals lifestyle appeal and market confidence
5. Large corporate investments in Nevada (e.g., major employer opening a facility, data center, manufacturing plant)

Return ONLY a valid JSON array with objects in this format:
{"index": 0, "relevanceScore": 8, "category": "market-update", "whyItMatters": "..."}

Drop articles scoring below 5. Keep the top 10 by score.

Articles to evaluate:
${articleList}`,
      },
    ],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const jsonMatch = text.match(/\[[\s\S]*\]/)
  if (!jsonMatch) return []

  const scored: Array<{
    index: number
    relevanceScore: number
    category: ArticleCategory
    whyItMatters: string
  }> = JSON.parse(jsonMatch[0])

  return scored
    .filter((s) => s.relevanceScore >= 4)
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, 10)
    .map((s) => ({
      ...filteredArticles[s.index],
      relevanceScore: s.relevanceScore,
      category: s.category,
      whyItMatters: s.whyItMatters,
    }))
}
