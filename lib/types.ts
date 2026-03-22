// Shared types for the blog automation pipeline

export type ArticleCategory =
  | 'market-update'
  | 'buying-tips'
  | 'selling-tips'
  | 'community-spotlight'
  | 'investment'
  | 'news'

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
