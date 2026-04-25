/**
 * lib/idea-writer.ts
 *
 * Unified writer: turns an approved IdeaCandidate into a publishable BlogPostDraft.
 * Called only after a reviewer approves an idea on /admin/idea-review.
 *
 * Works for both source types:
 *  - daily-research: uses article snippet + proposed angle
 *  - renick-pattern: uses Tavily research + pattern context
 */

import Anthropic from '@anthropic-ai/sdk'
import type { IdeaCandidate, BlogPostDraft, PortableTextBlock, PortableTextSpan } from './types'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const SELLER_URL = 'https://listings.legacyhomesearch.com/seller'
const SELLER_CTA_RE = /\[SELLER_CTA:\s*([^\]]+)\]/

// ─── Portable text helpers ────────────────────────────────────────────────────

function makeKey(): string {
  return Math.random().toString(36).slice(2, 10)
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

function lineToBlock(line: string): PortableTextBlock {
  const trimmed = line.trim()
  let style: PortableTextBlock['style'] = 'normal'
  let content = trimmed

  if (trimmed.startsWith('## '))       { style = 'h2';         content = trimmed.slice(3) }
  else if (trimmed.startsWith('### ')) { style = 'h3';         content = trimmed.slice(4) }
  else if (trimmed.startsWith('> '))   { style = 'blockquote'; content = trimmed.slice(2) }

  const match = style === 'normal' ? SELLER_CTA_RE.exec(content) : null

  if (!match) {
    return {
      _type: 'block', _key: makeKey(), style, markDefs: [],
      children: [{ _type: 'span', _key: makeKey(), text: content, marks: [] }],
    }
  }

  // Inline seller CTA link
  const linkText = match[1].trim()
  const before = content.slice(0, match.index).trimEnd()
  const after  = content.slice(match.index + match[0].length).trimStart()
  const linkKey = makeKey()

  const children: PortableTextSpan[] = []
  if (before) children.push({ _type: 'span', _key: makeKey(), text: before + ' ', marks: [] })
  children.push({ _type: 'span', _key: makeKey(), text: linkText, marks: [linkKey] })
  if (after)  children.push({ _type: 'span', _key: makeKey(), text: ' ' + after, marks: [] })

  return {
    _type: 'block', _key: makeKey(), style: 'normal',
    markDefs: [{ _type: 'link', _key: linkKey, href: SELLER_URL }],
    children,
  }
}

function bodyTextToBlocks(bodyText: string): PortableTextBlock[] {
  const blocks: PortableTextBlock[] = []
  for (const line of bodyText.split('\n').filter((l) => l.trim())) {
    const trimmed = line.trim()
    if (trimmed.startsWith('- ')) {
      blocks.push(lineToBlock('• ' + trimmed.slice(2)))
    } else {
      blocks.push(lineToBlock(trimmed))
    }
  }
  return blocks
}

// ─── Main writer ──────────────────────────────────────────────────────────────

export async function writePostFromIdea(
  idea: IdeaCandidate,
  learningsContext: string,
): Promise<BlogPostDraft> {
  const cityFocus = idea.cityTarget ?? 'Virginia Beach'
  const keyword   = idea.targetKeyword ?? idea.title

  const renickContext = idea.renickTitle
    ? `\nThis idea is inspired by a Renick blog post — "${idea.renickTitle}" — which drove ${idea.renickLift} traffic lift in a comparable market. Match that post's format and intent, translated to Hampton Roads.`
    : ''

  const researchSection = idea.researchData
    ? `\nRESEARCH / SOURCE MATERIAL:\n${idea.researchData.slice(0, 5000)}`
    : ''

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2500,
    messages: [{
      role: 'user',
      content: `You are Barry Jenkins, writing for the Legacy Home Search blog in Virginia Beach. Barry has been a Hampton Roads real estate agent for 20+ years, his family lives here, he's sold thousands of homes. He writes to genuinely inform local buyers, sellers, homeowners, and investors — not to sell, but to help them make smarter decisions.

POST BRIEF:
- Title/Angle: ${idea.title}
- Editorial framing: ${idea.angle}
- Why it matters to Hampton Roads residents: ${idea.whyItMatters}
- Category: ${idea.category}
- Content type: ${idea.contentType}
- Primary city focus: ${cityFocus}
- Target keyword: ${keyword}
- Primary audiences: ${idea.audiences.join(', ')}
${renickContext}

BLOG LEARNINGS & STYLE GUIDE (follow all active instructions):
${learningsContext.slice(0, 4000)}
${researchSection}

WRITING RULES:
- Voice: knowledgeable, warm, direct. Feels like advice from a trusted neighbor who knows the market cold — not a pitch.
- Open with a local hook — a specific Hampton Roads fact, data point, or recent development
- Always tie insights back to what they mean for Hampton Roads buyers/sellers/homeowners specifically
- Include a military/PCS angle where it naturally fits
- Structure: intro → 2–3 body sections with ## headings → ## What This Means For You (3–4 bullet points) → brief closing
- 350–450 words total
- SELLER CTA RULE: where the post mentions sellers, homeowners with equity, or what a home is worth, end that sentence with [SELLER_CTA: Find out what your home is worth →] inline. Max 2 times per post, only where it genuinely fits.
- Avoid: salesy language, generic "tips", "as a real estate agent I recommend", excessive CTAs

Return a JSON object with EXACTLY these fields:
{
  "title": "Final polished headline (optimize for keyword: ${keyword})",
  "slug": "url-slug",
  "excerpt": "2–3 sentence summary for blog listing page",
  "metaTitle": "SEO title under 60 chars",
  "metaDescription": "SEO description 120–160 chars",
  "body": "Full post in plain text. Use ## for h2, ### for h3, - for bullets."
}

Return ONLY valid JSON, no markdown fences.`,
    }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text.trim() : '{}'
  const raw  = JSON.parse(text)

  const blocks = bodyTextToBlocks(raw.body ?? '')

  // Append source credit if we have a source URL
  if (idea.sourceUrls.length > 0) {
    const sourceUrl = idea.sourceUrls[0]
    const sourceName = idea.sourceDomains[0] ?? sourceUrl
    const linkKey = makeKey()
    blocks.push({
      _type: 'block', _key: makeKey(), style: 'normal',
      markDefs: [{ _type: 'link', _key: linkKey, href: sourceUrl }],
      children: [{ _type: 'span', _key: makeKey(), text: `Source: ${sourceName}`, marks: [linkKey] }],
    })
  }

  return {
    title:           raw.title ?? idea.title,
    slug:            raw.slug  ?? slugify(raw.title ?? idea.title),
    excerpt:         raw.excerpt ?? '',
    category:        idea.category,
    metaTitle:       raw.metaTitle ?? '',
    metaDescription: raw.metaDescription ?? '',
    body:            blocks,
    sourceUrl:       idea.sourceUrls[0] ?? '',
    sourceTitle:     idea.renickTitle ?? idea.title,
  }
}
