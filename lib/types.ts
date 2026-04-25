// Shared types for the blog automation pipeline

export type ArticleCategory =
  | 'market-update'
  | 'buying-tips'
  | 'selling-tips'
  | 'community-spotlight'
  | 'investment'
  | 'news'
  | 'cost-breakdown'
  | 'flood-and-risk'

export interface RawArticle {
  id: string
  title: string
  url: string
  content: string // snippet from Tavily
  publishedDate?: string
  source?: string
}

export interface ScoredArticle extends RawArticle {
  relevanceScore: number
  category: ArticleCategory
  whyItMatters: string // 2-sentence summary
}

export interface StoredArticles {
  date: string
  articles: ScoredArticle[]
  fetchedAt: string
}

export interface PortableTextSpan {
  _type: 'span'
  _key: string
  text: string
  marks: string[]
}

export interface PortableTextBlock {
  _type: 'block'
  _key: string
  style: 'normal' | 'h2' | 'h3' | 'blockquote'
  markDefs: any[]
  children: PortableTextSpan[]
}

export interface BlogPostDraft {
  title: string
  slug: string
  excerpt: string
  category: ArticleCategory
  metaTitle: string
  metaDescription: string
  body: PortableTextBlock[]
  sourceUrl: string
  sourceTitle: string
}

// ─── Unified Idea Engine ──────────────────────────────────────────────────────

export type IdeaSource = 'daily-research' | 'renick-pattern' | 'internal'
export type IdeaAudience = 'buyer' | 'seller' | 'homeowner' | 'investor' | 'local'
export type IdeaUrgency = 'breaking' | 'timely' | 'evergreen'
export type IdeaStatus = 'pending' | 'approved' | 'skipped' | 'deferred'

export interface IdeaScore {
  total: number
  localRelevance: number    // 0–25
  timeliness: number        // 0–20
  formatFit: number         // 0–15
  audienceValue: number     // 0–15
  sourceCredibility: number // 0–10
  novelty: number           // 0–10
  seoPotential: number      // 0–5
}

export interface IdeaCandidate {
  id: string
  weekId: string
  source: IdeaSource

  // Editorial content
  title: string           // proposed blog post headline
  angle: string           // 1–2 sentence editorial framing / approach
  whyItMatters: string    // why Hampton Roads residents care right now
  category: ArticleCategory
  audiences: IdeaAudience[]
  contentType: string     // "Cost Breakdown" | "Market Update" | "Process Guide" etc.
  urgency: IdeaUrgency

  // Score breakdown
  score: IdeaScore

  // Source metadata (for credibility display on review page)
  sourceUrls: string[]
  sourceDomains: string[]
  sourceLabels: string[]  // "Local News" | "Government" | "Market Data" etc.

  // Renick metadata (populated when source === 'renick-pattern')
  renickTitle?: string
  renickLift?: string
  renickPattern?: string  // e.g. "Cost Breakdown" | "Flood Zone"

  // Writer context (populated at generation time, consumed at approval time)
  researchData?: string   // article snippet or Tavily research for the writer
  targetKeyword?: string  // primary SEO keyword
  cityTarget?: string     // primary city focus

  // Review state
  status: IdeaStatus
  reviewedAt?: string

  createdAt: string
}
