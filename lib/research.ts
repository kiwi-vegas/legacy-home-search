import Anthropic from '@anthropic-ai/sdk'
import type { RawArticle, ScoredArticle, ArticleCategory, IdeaCandidate, IdeaAudience, IdeaUrgency } from './types'
import { getSkippedUrls } from './store'
import { isDisqualified, sourceTypeLabel, sourceCredibilityScore } from './source-rules'
import { computeTimeliness, computeNovelty, assembleScore, SCORE_THRESHOLD } from './scoring'
import { buildWeekId } from './idea-store'

// These 3 queries run EVERY day — broad daily coverage across market, community, and local news
const PINNED_QUERIES = [
  'Virginia Beach real estate market news 2026',
  'Hampton Roads housing market home prices update 2026',
  'Norfolk Chesapeake Virginia Beach community development local news 2026',
]

// These rotate — 5 slots per day cycle through the full pool
const ROTATING_QUERIES = [
  // Hampton Roads market data
  'Hampton Roads housing market trends buyers sellers',
  'Hampton Roads investment property rental market returns',
  'Chesapeake Norfolk Virginia real estate market 2026',
  'Virginia Beach median home price inventory days on market',

  // Law & policy changes affecting homeowners
  'Virginia homeowner law changes 2026 property rights',
  'Virginia property tax changes homeowners exemptions 2026',
  'Virginia HOA law regulations changes 2026',
  'Hampton Roads zoning development law 2026',
  'Virginia real estate legislation buyers sellers 2026',
  'Virginia landlord tenant law changes 2026',

  // Major development projects & economic growth
  'Hampton Roads major development projects jobs economy 2026',
  'Virginia Beach new construction development billion dollar project',
  'Hampton Roads military base expansion economy housing demand',
  'Norfolk Newport News port development economic growth 2026',
  'Virginia Beach Chesapeake new community development',
  'Hampton Roads corporate relocation jobs economy 2026',
  'Norfolk downtown arena convention center development project',
  'Virginia Beach Town Center resort area new development',

  // Military & relocation (key Hampton Roads driver)
  'Military relocation Hampton Roads Virginia Beach homes',
  'PCS military move Hampton Roads housing 2026',
  'Norfolk Naval Station housing military families Virginia Beach',
  'Hampton Roads VA loan veteran homebuyer benefits 2026',

  // Local events, arts, economy signals
  'Virginia Beach Norfolk local event festival arts tourism 2026',
  'Hampton Roads new business restaurant opening economic growth 2026',
  'Virginia Beach waterfront resort boardwalk project economy',

  // Schools & family buyers
  'Virginia Beach Chesapeake best school district families homebuyers',
  'Hampton Roads school ratings neighborhoods homebuyers families',

  // Insurance, risk, and true cost of ownership
  'Virginia homeowners insurance rates premium increase 2026',
  'Hampton Roads coastal wind storm insurance Virginia Beach homes',
  'Virginia property tax savings exemption homestead appeal 2026',
  'Hampton Roads cost of ownership homeowner expenses utilities 2026',
  'Virginia Beach short term rental Airbnb VRBO regulations law 2026',

  // Flood, sea level rise, and infrastructure risk
  'Norfolk Virginia Beach sea level rise flooding mitigation 2026',
  'Hampton Roads flood protection infrastructure resilience project',
  'Virginia Beach storm drainage FEMA flood zone changes 2026',

  // Buyers: affordability, financing, new construction
  'Virginia Beach new construction builder incentives rate buydown 2026',
  'Hampton Roads rent vs buy comparison affordability calculator',
  'Virginia first time homebuyer grant down payment assistance 2026',
  'Hampton Roads mortgage rates affordability median income 2026',

  // Investment & rental market
  'Hampton Roads rental property cash flow investment analysis 2026',
  'Virginia Beach vacation rental short term market revenue 2026',
  'Hampton Roads multifamily duplex investment market 2026',

  // Lifestyle & community desirability
  'Virginia Beach oceanfront waterfront homes neighborhood market 2026',
  'Suffolk Virginia homes community growth 2026',
  'Hampton Roads 55 plus active adult retirement community homes 2026',
  'Hampton Roads first time home buyer programs 2026',
  'Virginia Beach condo townhouse market trends 2026',
]

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

// ─── Fetch raw articles ───────────────────────────────────────────────────────

async function fetchRawArticles(): Promise<RawArticle[]> {
  const queries = getQueriesForToday()
  const tavilyApiKey = process.env.TAVILY_API_KEY
  if (!tavilyApiKey) throw new Error('TAVILY_API_KEY is not set')

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

  return rawArticles
}

// ─── Legacy: scored article output (used by blog-picker page) ────────────────

export async function fetchAndScoreArticles(): Promise<ScoredArticle[]> {
  const rawArticles = await fetchRawArticles()
  if (rawArticles.length === 0) return []

  const skippedUrls = await getSkippedUrls()
  const filtered = skippedUrls.size > 0
    ? rawArticles.filter((a) => !skippedUrls.has(a.url))
    : rawArticles

  if (filtered.length === 0) return []

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const articleList = filtered
    .slice(0, 30)
    .map((a, i) =>
      `[${i}] TITLE: ${a.title}\nURL: ${a.url}\nSNIPPET: ${a.content.slice(0, 300)}\nDATE: ${a.publishedDate ?? 'unknown'}`
    )
    .join('\n\n')

  const response = await anthropic.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 4000,
    messages: [{
      role: 'user',
      content: `You are a real estate content strategist for Legacy Home Search, serving Virginia Beach and Hampton Roads, Virginia.

Evaluate these articles and return a JSON array. For each article assign:
- relevanceScore: 1-10 (Hampton Roads / Virginia Beach homebuyers, sellers, investors)
- category: "market-update"|"buying-tips"|"selling-tips"|"community-spotlight"|"investment"|"news"
- whyItMatters: exactly 2 sentences why a Hampton Roads homeowner/buyer should care

MARKET RESTRICTION: Only Virginia, Virginia Beach, Hampton Roads, or Mid-Atlantic when directly relevant.
Score non-Virginia markets as 1. Drop below score 5.

Return ONLY a valid JSON array:
{"index": 0, "relevanceScore": 8, "category": "market-update", "whyItMatters": "..."}

Keep top 10 by score.

Articles:
${articleList}`,
    }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const jsonMatch = text.match(/\[[\s\S]*\]/)
  if (!jsonMatch) return []

  const scored: Array<{ index: number; relevanceScore: number; category: ArticleCategory; whyItMatters: string }> =
    JSON.parse(jsonMatch[0])

  return scored
    .filter((s) => s.relevanceScore >= 4)
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, 10)
    .map((s) => ({
      ...filtered[s.index],
      relevanceScore: s.relevanceScore,
      category: s.category,
      whyItMatters: s.whyItMatters,
    }))
}

// ─── New: idea candidates output (used by idea engine) ───────────────────────

interface RichScore {
  index: number
  drop: boolean           // true = disqualify entirely
  proposedTitle: string   // blog post angle headline
  angle: string           // 1–2 sentence editorial framing
  whyItMatters: string    // why Hampton Roads residents care
  category: ArticleCategory
  audiences: IdeaAudience[]
  contentType: string
  localRelevance: number  // 0–25
  formatFit: number       // 0–15
  audienceValue: number   // 0–15
  seoPotential: number    // 0–5
}

export async function fetchAndScoreIdeas(coveredTopics: Set<string>): Promise<IdeaCandidate[]> {
  const rawArticles = await fetchRawArticles()
  if (rawArticles.length === 0) return []

  const skippedUrls = await getSkippedUrls()

  // Pre-filter: remove skipped URLs and disqualified domains
  const filtered = rawArticles.filter((a) => {
    if (skippedUrls.has(a.url)) return false
    const domain = new URL(a.url).hostname.replace('www.', '')
    if (isDisqualified(domain)) return false
    return true
  })

  if (filtered.length === 0) return []

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const weekId = buildWeekId()

  const articleList = filtered
    .slice(0, 30)
    .map((a, i) =>
      `[${i}] TITLE: ${a.title}\nURL: ${a.url}\nSNIPPET: ${a.content.slice(0, 400)}\nSOURCE: ${a.source ?? ''}\nDATE: ${a.publishedDate ?? 'unknown'}`
    )
    .join('\n\n')

  const response = await anthropic.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 6000,
    messages: [{
      role: 'user',
      content: `You are a senior content strategist for Barry Jenkins' Legacy Home Search blog in Virginia Beach. Barry is a 20+ year Hampton Roads real estate expert whose content informs local buyers, sellers, homeowners, and investors — not selling, but genuinely helping them make better decisions.

For each article below, decide:
1. Should it become a blog post idea? (drop if: not Hampton Roads relevant, generic listicle, agent blog, content farm, national story with no local angle)
2. If yes: propose a blog angle that sounds like Barry — a trusted local expert sharing what he knows

High-value topics: local market data, VA/Hampton Roads law changes, military/PCS housing, flood zones, cost breakdowns, major local developments, zoning/tax/insurance changes, community growth signals.

Return a JSON array. For each article:
{
  "index": number,
  "drop": boolean,            // true = disqualify, don't include in queue
  "proposedTitle": string,    // Barry's blog post headline (not the article title)
  "angle": string,            // 1-2 sentences on how to frame it from Barry's POV
  "whyItMatters": string,     // why Hampton Roads buyers/sellers/homeowners care NOW
  "category": string,         // market-update|buying-tips|selling-tips|community-spotlight|investment|news|cost-breakdown|flood-and-risk
  "audiences": string[],      // any of: buyer seller homeowner investor local
  "contentType": string,      // e.g. "Market Update" | "Cost Breakdown" | "Law Change" | "Community Development" | "Flood Risk" | "Military/PCS" | "Process Guide" | "Investment Analysis"
  "localRelevance": number,   // 0-25: 20-25=specific named Hampton Roads city, 15-19=Hampton Roads general, 8-14=Virginia/Mid-Atlantic, 0-7=national/generic
  "formatFit": number,        // 0-15: how well this fits high-performing formats (cost breakdowns=15, flood/risk=14, comparison=13, process guide=12, market data=10, generic tips=3)
  "audienceValue": number,    // 0-15: 12-15=decision-critical right now, 8-11=useful for planning, 4-7=interesting not actionable, 0-3=low utility
  "seoPotential": number      // 0-5: clear search intent keyword=4-5, moderate=2-3, low=0-1
}

MARKET RESTRICTION: Drop (drop:true) anything about Las Vegas, Nevada, California, Texas, Florida, or any non-Virginia market. Drop generic "10 tips for homebuyers" listicles. Drop content farm articles.

Return ONLY valid JSON array, no markdown.

Articles:
${articleList}`,
    }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const jsonMatch = text.match(/\[[\s\S]*\]/)
  if (!jsonMatch) return []

  const richScores: RichScore[] = JSON.parse(jsonMatch[0])

  const ideas: IdeaCandidate[] = []

  for (const s of richScores) {
    if (s.drop) continue

    const article = filtered[s.index]
    if (!article) continue

    const domain = new URL(article.url).hostname.replace('www.', '')
    const { score: timeliness, urgency } = computeTimeliness(article.publishedDate)
    const sourceCredibility = sourceCredibilityScore(domain)
    const novelty = computeNovelty(s.proposedTitle, coveredTopics)

    const score = assembleScore(
      {
        localRelevance: s.localRelevance,
        formatFit: s.formatFit,
        audienceValue: s.audienceValue,
        seoPotential: s.seoPotential,
      },
      timeliness,
      sourceCredibility,
      novelty,
      [domain],
    )

    // Drop below threshold
    if (score.total < SCORE_THRESHOLD) continue

    const id = `research-${weekId}-${article.id}-${Math.random().toString(36).slice(2, 6)}`

    ideas.push({
      id,
      weekId,
      source: 'daily-research',
      title: s.proposedTitle,
      angle: s.angle,
      whyItMatters: s.whyItMatters,
      category: s.category,
      audiences: s.audiences as IdeaAudience[],
      contentType: s.contentType,
      urgency,
      score,
      sourceUrls: [article.url],
      sourceDomains: [domain],
      sourceLabels: [sourceTypeLabel(domain)],
      researchData: article.content.slice(0, 2000),
      status: 'pending',
      createdAt: new Date().toISOString(),
    })
  }

  // Sort by score descending
  return ideas.sort((a, b) => b.score.total - a.score.total)
}
