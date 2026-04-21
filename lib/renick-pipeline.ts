/**
 * lib/renick-pipeline.ts
 *
 * Core logic for the Renick → Jenkins self-improving content pipeline.
 *
 * Responsibilities:
 *  1. Fetch and parse the Renick blog effectiveness dashboard
 *  2. Extract winning content patterns (via Claude Opus)
 *  3. Translate patterns to Hampton Roads equivalents
 *  4. Research each translated idea (Tavily)
 *  5. Generate full blog post drafts (via Claude Sonnet, following BLOG_PIPELINE.md + LEARNINGS.md)
 */

import Anthropic from '@anthropic-ai/sdk'
import type { BlogPostDraft, ArticleCategory, PortableTextBlock, PortableTextSpan } from './types'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface RenickPost {
  title: string
  url: string | null
  pvBefore: number
  pvAfter: number
  liftPct: number
  status: 'Winner' | 'Flat' | 'No Lift Yet' | 'No Data'
}

export interface RenickDashboardData {
  weekOf: string
  topPosts: RenickPost[]
  overallHealth: {
    pvPerDay: number
    engagementBefore: number
    engagementAfter: number
    engagementLiftPct: number
    organicSearchPct: number
    winners: number
    totalTracked: number
    medianDaysSinceRefresh: number
  }
  keyTakeaways: string[]
}

export interface ContentPattern {
  type: string
  questionFormat: string
  topicCluster: string
  avgLiftPct: number
  exampleRenickTitle: string
  translatedTitle: string
  targetKeyword: string
  category: ArticleCategory
  cityTarget: string
  rationale: string
}

export interface GeneratedPostIdea {
  pattern: ContentPattern
  researchData: string
  draft: BlogPostDraft
  renickSource: string
  renickLift: string
}

// ─────────────────────────────────────────────
// Step 1: Fetch Renick Dashboard
// ─────────────────────────────────────────────

export async function fetchRenickDashboard(): Promise<RenickDashboardData> {
  const DASHBOARD_URL = 'https://blog.teamrenick.com/blog-effectiveness-dashboard/'

  const tavilyKey = process.env.TAVILY_API_KEY
  if (!tavilyKey) throw new Error('TAVILY_API_KEY not set')

  // Use Tavily extract to pull structured content from the dashboard
  const res = await fetch('https://api.tavily.com/extract', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tavilyKey}`,
    },
    body: JSON.stringify({ urls: [DASHBOARD_URL] }),
  })

  if (!res.ok) throw new Error(`Tavily extract failed: ${res.status}`)
  const data = await res.json()
  const rawContent = data?.results?.[0]?.raw_content ?? ''

  // Claude Opus extracts structured data from the raw page content
  const extraction = await anthropic.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 4000,
    messages: [
      {
        role: 'user',
        content: `You are parsing the Team Renick Blog Effectiveness Dashboard. Extract ALL data from this raw page content.

Return a JSON object matching this TypeScript type exactly:
{
  weekOf: string,           // e.g. "2026-04-21"
  topPosts: Array<{
    title: string,
    url: string | null,
    pvBefore: number,
    pvAfter: number,
    liftPct: number,         // positive integer, e.g. 2150 for +2150%
    status: "Winner" | "Flat" | "No Lift Yet" | "No Data"
  }>,
  overallHealth: {
    pvPerDay: number,
    engagementBefore: number,
    engagementAfter: number,
    engagementLiftPct: number,
    organicSearchPct: number,
    winners: number,
    totalTracked: number,
    medianDaysSinceRefresh: number
  },
  keyTakeaways: string[]    // bullet points or insights mentioned on the page
}

Include ALL posts with Winner status, sorted by liftPct descending.
Return ONLY valid JSON, no markdown fences.

PAGE CONTENT:
${rawContent.slice(0, 30000)}`,
      },
    ],
  })

  const jsonStr = (extraction.content[0] as { type: string; text: string }).text.trim()
  return JSON.parse(jsonStr) as RenickDashboardData
}

// ─────────────────────────────────────────────
// Step 2: Extract Content Patterns
// ─────────────────────────────────────────────

export async function extractContentPatterns(
  dashboard: RenickDashboardData,
  learningsContext: string
): Promise<ContentPattern[]> {
  const postsJson = JSON.stringify(dashboard.topPosts.slice(0, 20), null, 2)

  const response = await anthropic.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 4000,
    messages: [
      {
        role: 'user',
        content: `You are designing blog content for Barry Jenkins' Legacy Home Search blog (Hampton Roads, VA real estate).

You have two inputs:
1. This week's top-performing posts from Mike Renick's Sarasota/FL blog (sorted by % traffic lift)
2. The current LEARNINGS.md from Barry's blog — read the "Instructions for Next Week" section carefully

RENICK TOP POSTS:
${postsJson}

BARRY'S BLOG LEARNINGS (read the most recent entry for this week's priorities):
${learningsContext.slice(0, 8000)}

Your task: Identify 5 content patterns from Renick's winners that should be translated to Hampton Roads.

For each pattern, translate it to a specific Hampton Roads post idea. Apply these rules:
- Keep the question format and intent; replace all Florida geography with Hampton Roads equivalents
- Virginia Beach is priority city (highest search volume); use Chesapeake, Norfolk, Suffolk, Hampton, Newport News for variety
- Always consider adding a military/PCS angle for relocation and buyer posts
- Hampton Roads flood zone posts are HIGH priority — Norfolk is one of the fastest-sinking cities in the US
- Skip patterns Barry has recently rejected (check LEARNINGS.md skip signals)
- Prioritize patterns Barry has recently approved (check LEARNINGS.md approval signals)

Return a JSON array of exactly 5 ContentPattern objects:
[{
  "type": string,              // e.g. "Cost Breakdown", "City Comparison", "Flood Zone", "Market Timing", "Process Guide"
  "questionFormat": string,    // the question template, e.g. "What does it cost to X in Y?"
  "topicCluster": string,      // e.g. "closing costs", "waterfront", "flood insurance"
  "avgLiftPct": number,        // average % lift of Renick posts using this pattern
  "exampleRenickTitle": string,// the Renick post title that inspired this
  "translatedTitle": string,   // the exact title for Barry's Hampton Roads post
  "targetKeyword": string,     // primary SEO keyword phrase
  "category": string,          // one of: market-update | buying-tips | selling-tips | community-spotlight | investment | news
  "cityTarget": string,        // primary city or "Hampton Roads"
  "rationale": string          // 1-sentence explanation of why this translation will work
}]

Return ONLY valid JSON array, no markdown fences.`,
      },
    ],
  })

  const jsonStr = (response.content[0] as { type: string; text: string }).text.trim()
  return JSON.parse(jsonStr) as ContentPattern[]
}

// ─────────────────────────────────────────────
// Step 3: Research Each Translated Idea
// ─────────────────────────────────────────────

export async function researchPostIdea(pattern: ContentPattern): Promise<string> {
  const tavilyKey = process.env.TAVILY_API_KEY
  if (!tavilyKey) throw new Error('TAVILY_API_KEY not set')

  const queries = buildResearchQueries(pattern)
  const results: string[] = []

  for (const query of queries.slice(0, 3)) {
    try {
      const res = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tavilyKey}`,
        },
        body: JSON.stringify({
          query,
          search_depth: 'advanced',
          max_results: 5,
          include_answer: true,
        }),
      })

      if (!res.ok) continue
      const data = await res.json()

      if (data.answer) results.push(`Q: ${query}\nA: ${data.answer}`)
      if (data.results) {
        for (const r of data.results.slice(0, 2)) {
          results.push(`SOURCE: ${r.title}\n${r.content?.slice(0, 400) ?? ''}`)
        }
      }
    } catch {
      // Continue on individual query failure
    }
  }

  return results.join('\n\n---\n\n').slice(0, 8000)
}

function buildResearchQueries(pattern: ContentPattern): string[] {
  const city = pattern.cityTarget
  const cluster = pattern.topicCluster

  const base = [
    `${city} ${cluster} 2026`,
    `Hampton Roads ${cluster} data statistics 2026`,
    `Virginia ${cluster} real estate buyers sellers`,
  ]

  // Pattern-specific extra queries
  if (pattern.type === 'Flood Zone') {
    base.push(`FEMA flood zone ${city} Virginia 2026`)
    base.push(`flood insurance cost ${city} Hampton Roads`)
  } else if (pattern.type === 'Cost Breakdown') {
    base.push(`average cost ${cluster} ${city} Virginia 2026`)
    base.push(`${city} real estate closing costs fees breakdown`)
  } else if (pattern.type === 'City Comparison') {
    base.push(`${city} vs Chesapeake real estate comparison 2026`)
    base.push(`best city buy home Hampton Roads Virginia 2026`)
  } else if (pattern.type === 'Market Timing') {
    base.push(`${city} housing market inventory days on market 2026`)
    base.push(`should I buy home Hampton Roads now 2026 mortgage rates`)
  } else if (pattern.type === 'Process Guide') {
    base.push(`Virginia real estate ${cluster} law requirements 2026`)
    base.push(`${cluster} Hampton Roads Virginia homeowners`)
  }

  return base
}

// ─────────────────────────────────────────────
// Step 4: Generate Full Blog Post
// ─────────────────────────────────────────────

function makeKey(): string {
  return Math.random().toString(36).slice(2, 10)
}

function textToPortableText(text: string): PortableTextBlock[] {
  const SELLER_URL = 'https://listings.legacyhomesearch.com/seller'
  const SELLER_CTA_RE = /\[SELLER_CTA:\s*([^\]]+)\]/

  const lines = text.split('\n').filter((l) => l.trim())
  const blocks: PortableTextBlock[] = []

  for (const line of lines) {
    const trimmed = line.trim()
    let style: PortableTextBlock['style'] = 'normal'
    let content = trimmed

    if (trimmed.startsWith('## ')) {
      style = 'h2'
      content = trimmed.slice(3)
    } else if (trimmed.startsWith('### ')) {
      style = 'h3'
      content = trimmed.slice(4)
    } else if (trimmed.startsWith('> ')) {
      style = 'blockquote'
      content = trimmed.slice(2)
    }

    const match = SELLER_CTA_RE.exec(content)
    if (!match || style !== 'normal') {
      blocks.push({
        _type: 'block',
        _key: makeKey(),
        style,
        markDefs: [],
        children: [{ _type: 'span', _key: makeKey(), text: content, marks: [] }],
      })
      continue
    }

    // Inline seller CTA link
    const linkText = match[1].trim()
    const before = content.slice(0, match.index).trimEnd()
    const after = content.slice(match.index + match[0].length).trimStart()
    const linkKey = makeKey()

    const children: PortableTextSpan[] = []
    if (before) children.push({ _type: 'span', _key: makeKey(), text: before + ' ', marks: [] })
    children.push({ _type: 'span', _key: makeKey(), text: linkText, marks: [linkKey] })
    if (after) children.push({ _type: 'span', _key: makeKey(), text: ' ' + after, marks: [] })

    blocks.push({
      _type: 'block',
      _key: makeKey(),
      style: 'normal',
      markDefs: [{ _type: 'link', _key: linkKey, href: SELLER_URL }],
      children,
    })
  }

  return blocks
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .slice(0, 96)
}

export async function generateBlogPost(
  pattern: ContentPattern,
  researchData: string,
  learningsContext: string
): Promise<BlogPostDraft> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2500,
    messages: [
      {
        role: 'user',
        content: `You are a knowledgeable real estate professional at Legacy Home Search in Virginia Beach, Virginia. Write a blog post for Hampton Roads home buyers, sellers, and investors.

POST BRIEF:
- Title: ${pattern.translatedTitle}
- Target keyword: ${pattern.targetKeyword}
- Category: ${pattern.category}
- City focus: ${pattern.cityTarget}
- Post type: ${pattern.type}
- Inspired by: "${pattern.exampleRenickTitle}" which got +${pattern.avgLiftPct}% traffic lift for a similar Florida market blog

RESEARCH DATA (use this to populate the post with real, current Hampton Roads data):
${researchData}

BLOG LEARNINGS & STYLE GUIDE (follow all active instructions in this file):
${learningsContext.slice(0, 5000)}

WRITING RULES:
- Voice: knowledgeable, approachable, direct. Not salesy. Genuinely helpful.
- Always tie insights back to Hampton Roads / Virginia Beach specifically
- Include a military/PCS angle wherever it naturally fits
- Include a "## What This Means For You" section with 3–4 bullet points
- Post structure: intro → 2–3 body sections with ## headings → ## What This Means For You → closing paragraph
- 350–450 words total
- SELLER CTA RULE: Where you mention sellers, homeowners with equity, or what a home is worth, end that sentence with [SELLER_CTA: Find out what your home is worth →] inline. Max 2 times per post.

Return a JSON object with EXACTLY these fields (matching the BlogPostDraft type):
{
  "title": "Engaging headline optimized for the target keyword",
  "slug": "url-slug-here",
  "excerpt": "2-3 sentence summary for blog listing page",
  "category": "${pattern.category}",
  "metaTitle": "SEO title under 60 chars",
  "metaDescription": "SEO meta description 120-160 chars",
  "body": "Full post in plain text. Use ## for h2, ### for h3, - for bullets.",
  "sourceUrl": "https://blog.teamrenick.com/blog-effectiveness-dashboard/",
  "sourceTitle": "${pattern.exampleRenickTitle}"
}

Return ONLY valid JSON, no markdown fences.`,
      },
    ],
  })

  const jsonStr = (response.content[0] as { type: string; text: string }).text.trim()
  const raw = JSON.parse(jsonStr)

  return {
    title: raw.title,
    slug: raw.slug || slugify(raw.title),
    excerpt: raw.excerpt,
    category: raw.category as ArticleCategory,
    metaTitle: raw.metaTitle,
    metaDescription: raw.metaDescription,
    body: textToPortableText(raw.body),
    sourceUrl: raw.sourceUrl,
    sourceTitle: raw.sourceTitle,
  }
}

// ─────────────────────────────────────────────
// Step 5: Stage Posts in Redis
// ─────────────────────────────────────────────

export function buildWeekId(date?: Date): string {
  const d = date ?? new Date()
  return d.toISOString().slice(0, 10) // e.g. "2026-04-22"
}

export interface StagedPost {
  postId: string
  weekId: string
  pattern: ContentPattern
  draft: BlogPostDraft
  renickSource: string
  renickLift: string
  stagedAt: string
}

export async function stagePostsInRedis(posts: StagedPost[]): Promise<void> {
  const { Redis } = await import('@upstash/redis')
  const redis = Redis.fromEnv()

  for (const post of posts) {
    await redis.set(
      `pipeline:staged:${post.weekId}:${post.postId}`,
      JSON.stringify(post),
      { ex: 7 * 24 * 60 * 60 } // 7 day TTL
    )
  }

  // Store the week's full post ID list for easy retrieval
  const weekKey = `pipeline:week:${posts[0]?.weekId}`
  await redis.set(weekKey, JSON.stringify(posts.map((p) => p.postId)), {
    ex: 14 * 24 * 60 * 60,
  })
}

export async function getStagedPost(weekId: string, postId: string): Promise<StagedPost | null> {
  const { Redis } = await import('@upstash/redis')
  const redis = Redis.fromEnv()
  const raw = await redis.get<string>(`pipeline:staged:${weekId}:${postId}`)
  if (!raw) return null
  return typeof raw === 'string' ? JSON.parse(raw) : raw
}

export async function recordApprovalDecision(
  weekId: string,
  postId: string,
  action: 'approve' | 'skip'
): Promise<void> {
  const { Redis } = await import('@upstash/redis')
  const redis = Redis.fromEnv()

  const key = `pipeline:approval:${weekId}`
  const existing = (await redis.get<string>(key)) ?? '{}'
  const decisions = typeof existing === 'string' ? JSON.parse(existing) : existing
  decisions[postId] = action

  await redis.set(key, JSON.stringify(decisions), { ex: 30 * 24 * 60 * 60 })
}

export async function getWeekApprovals(
  weekId: string
): Promise<Record<string, 'approve' | 'skip'>> {
  const { Redis } = await import('@upstash/redis')
  const redis = Redis.fromEnv()
  const raw = await redis.get<string>(`pipeline:approval:${weekId}`)
  if (!raw) return {}
  return typeof raw === 'string' ? JSON.parse(raw) : raw
}
