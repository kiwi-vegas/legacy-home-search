import Anthropic from '@anthropic-ai/sdk'
import type { RawArticle, ScoredArticle, ArticleCategory } from './types'
import { getSkippedUrls } from './store'

// These 3 queries run EVERY day — guarantees Virginia Beach content in every digest
const PINNED_QUERIES = [
  'Virginia Beach real estate market news 2026',
  'Virginia Beach home prices sales market update 2026',
  'Virginia Beach housing market trends buyers sellers 2026',
]

// These rotate — 5 slots per day cycle through the full pool
const ROTATING_QUERIES = [
  // Hampton Roads market
  'Hampton Roads housing market trends buyers sellers',
  'Hampton Roads investment property rental market returns',
  'Chesapeake Norfolk Virginia real estate market 2026',

  // Law & policy changes affecting homeowners
  'Virginia homeowner law changes 2026 property rights',
  'Virginia property tax changes homeowners exemptions 2026',
  'Virginia HOA law regulations changes 2026',
  'Hampton Roads zoning development law 2026',
  'Virginia real estate legislation buyers sellers 2026',

  // Major development projects & economic growth signals
  'Hampton Roads major development projects jobs economy 2026',
  'Virginia Beach new construction development billion dollar',
  'Hampton Roads military base expansion economy housing demand',
  'Norfolk Newport News port development economic growth 2026',
  'Virginia Beach Chesapeake new community development',
  'Hampton Roads corporate relocation jobs economy 2026',

  // Military & relocation (key Hampton Roads driver)
  'Military relocation Hampton Roads Virginia Beach homes',
  'PCS military move Hampton Roads housing 2026',
  'Norfolk Naval Station housing military families Virginia Beach',

  // Lifestyle & community
  'Virginia Beach oceanfront waterfront homes market 2026',
  'Suffolk Virginia homes community growth 2026',
  'Virginia Beach neighborhoods schools homes 2026',
  'Hampton Roads first time home buyer programs 2026',
  'Virginia Beach condo townhouse market trends 2026',
]

// 3 pinned Virginia Beach queries run daily + 5 rotating for variety
function getQueriesForToday(): string[] {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  )
  const start = (dayOfYear * 5) % ROTATING_QUERIES.length
  const rotating: string[] = []
  for (let i = 0; i < 5; i++) {
    rotating.push(ROTATING_QUERIES[(start + i) % ROTATING_QUERIES.length])
  }
  return [...PINNED_QUERIES, ...rotating]
}

export async function fetchAndScoreArticles(): Promise<ScoredArticle[]> {
  const queries = getQueriesForToday()
  const tavilyApiKey = process.env.TAVILY_API_KEY
  if (!tavilyApiKey) throw new Error('TAVILY_API_KEY is not set')

  // Run all 8 Tavily searches (3 pinned + 5 rotating)
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
        content: `You are a real estate content strategist for Legacy Home Search, a real estate agency serving Virginia Beach and Hampton Roads, Virginia. Their clients are home buyers, sellers, and investors in Virginia Beach, Chesapeake, Norfolk, Suffolk, Hampton, and Newport News.

Evaluate these articles and return a JSON array. For each article, assign:
- relevanceScore: 1-10 (how useful/interesting is this for Hampton Roads / Virginia Beach homebuyers, sellers, or investors?)
- category: one of "market-update" | "buying-tips" | "selling-tips" | "community-spotlight" | "investment" | "news"
- whyItMatters: exactly 2 sentences explaining why a Hampton Roads homeowner or buyer should care

MARKET RESTRICTION — THIS IS CRITICAL:
Only include articles that are specifically about Virginia, Virginia Beach, Hampton Roads, Chesapeake, Norfolk, Suffolk, Hampton, Newport News, or the broader Mid-Atlantic/East Coast region when directly relevant to Virginia homeowners.
Score any article about Las Vegas, Nevada, California, Texas, Florida, or any other non-Virginia market as 1 — these must be dropped.
Score any national article (interest rates, mortgage trends, Fed policy) at 6 or above ONLY if it has clear direct relevance to Virginia Beach buyers and sellers.

SCORING PRIORITY (give extra weight to):
1. Virginia Beach / Hampton Roads property values and investment returns — what affects buyers and current homeowners
2. Virginia law changes affecting homeowners (property tax, HOA rules, zoning, tenant/landlord laws)
3. Major development projects bringing jobs and economic growth to Hampton Roads (port expansion, military base investments, corporate relocations)
4. Military and defense-sector news affecting Hampton Roads housing demand (PCS moves, base expansions, new commands)
5. Large employers or corporations expanding in Hampton Roads / Virginia — signals economic growth and housing demand

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
