import Anthropic from '@anthropic-ai/sdk'
import type { RawArticle, ScoredArticle, ArticleCategory } from './types'
import { getSkippedUrls } from './store'

const SEARCH_QUERIES = [
  'Virginia Beach real estate market news 2025',
  'Hampton Roads housing market trends buyers sellers',
  'Virginia first time home buyer programs 2025',
  'Military relocation Hampton Roads Virginia Beach homes',
  'Chesapeake Virginia homes for sale market update',
  'Norfolk Virginia real estate market trends 2025',
  'Virginia Beach new construction homes development',
  'Hampton Roads mortgage rates housing market',
  'Suffolk Virginia homes community growth 2025',
  'Virginia Beach oceanfront luxury homes market',
  'Hampton Roads investment property rental market',
  'Newport News Hampton Virginia real estate trends',
  'Virginia Beach neighborhoods top rated schools',
  'Virginia Beach condo townhouse market 2025',
  'Hampton Roads relocation moving military families',
  'Virginia property tax homeowner exemptions 2025',
  'Virginia Beach waterfront homes boating community',
  'Hampton Roads economy jobs housing demand 2025',
]

// Pick 6 queries, rotating by day of week
function getQueriesForToday(): string[] {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  )
  const start = (dayOfYear * 6) % SEARCH_QUERIES.length
  const queries: string[] = []
  for (let i = 0; i < 6; i++) {
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
        content: `You are a real estate content strategist for Legacy Home Search, a real estate agency. Their clients are home buyers, sellers, and investors.

Evaluate these articles and return a JSON array. For each article, assign:
- relevanceScore: 1-10 (how useful/interesting is this for homebuyers, sellers, or investors?)
- category: one of "market-update" | "buying-tips" | "selling-tips" | "community-spotlight" | "investment" | "news"
- whyItMatters: exactly 2 sentences explaining why a homeowner or buyer should care

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
