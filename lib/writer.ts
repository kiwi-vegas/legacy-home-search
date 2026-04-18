import Anthropic from '@anthropic-ai/sdk'
import type { ScoredArticle, BlogPostDraft, PortableTextBlock, PortableTextSpan } from './types'

const SELLER_URL = 'https://listings.legacyhomesearch.com/seller'
const SELLER_CTA_RE = /\[SELLER_CTA:\s*([^\]]+)\]/

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .slice(0, 96)
}

function makeKey(): string {
  return Math.random().toString(36).slice(2, 10)
}

function textToPortableText(text: string): PortableTextBlock[] {
  const lines = text.split('\n').filter((l) => l.trim())
  return lines.map((line) => {
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

    const span: PortableTextSpan = {
      _type: 'span',
      _key: makeKey(),
      text: content,
      marks: [],
    }

    return {
      _type: 'block',
      _key: makeKey(),
      style,
      markDefs: [],
      children: [span],
    }
  })
}

// Converts a plain text line into a PortableText block.
// If the line contains [SELLER_CTA: link text], that portion becomes an inline
// hyperlink to the seller portal — the rest of the sentence stays plain text.
function lineToBlock(line: string): PortableTextBlock {
  const match = SELLER_CTA_RE.exec(line)

  if (!match) {
    return textToPortableText(line)[0]
  }

  const linkText = match[1].trim()
  const before = line.slice(0, match.index).trimEnd()
  const after = line.slice(match.index + match[0].length).trimStart()
  const linkKey = makeKey()

  const children: PortableTextSpan[] = []
  if (before) children.push({ _type: 'span', _key: makeKey(), text: before + ' ', marks: [] })
  children.push({ _type: 'span', _key: makeKey(), text: linkText, marks: [linkKey] })
  if (after) children.push({ _type: 'span', _key: makeKey(), text: ' ' + after, marks: [] })

  return {
    _type: 'block',
    _key: makeKey(),
    style: 'normal',
    markDefs: [{ _type: 'link', _key: linkKey, href: SELLER_URL }],
    children,
  }
}

export async function writePost(article: ScoredArticle): Promise<BlogPostDraft> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2000,
    messages: [
      {
        role: 'user',
        content: `You are a knowledgeable real estate professional at Legacy Home Search in Virginia Beach, Virginia. You're writing a blog post to share with clients and followers across Virginia Beach, Chesapeake, Norfolk, Suffolk, Hampton, and Newport News.

Write a blog post based on this article:
TITLE: ${article.title}
URL: ${article.url}
SNIPPET: ${article.content.slice(0, 500)}
WHY IT MATTERS: ${article.whyItMatters}

Your audience: home buyers, sellers, and investors in Hampton Roads and Virginia Beach.
Your voice: knowledgeable, approachable, direct. Not salesy. You genuinely care about helping Hampton Roads families make smart real estate decisions. Where relevant, tie insights back to the local Hampton Roads / Virginia Beach market and what Virginia-specific factors mean for buyers and owners.

Return a JSON object with EXACTLY these fields:
{
  "title": "Your rewritten, engaging headline (not the original title)",
  "excerpt": "2-3 sentence summary for the blog listing page",
  "metaTitle": "SEO title under 60 chars",
  "metaDescription": "SEO description 120-160 chars",
  "body": "The full post in plain text. Use ## for h2 headings, ### for h3. Include: intro paragraph, 2-3 body sections with headings, a ## What This Means For You section with 3-4 bullet points (use - prefix), and a closing paragraph. 300-400 words total."
}

SELLER CTA RULE — this is required:
Whenever the body mentions sellers, homeowners having equity, or what a home is worth, end that sentence with [SELLER_CTA: Find out what your home is worth →] inline — do not put it on its own line, keep it at the end of the sentence it relates to. Use this no more than 2 times per post, only where it genuinely fits. Example:
"If you own a home in Hampton Roads, you're likely sitting on more equity than you realize. [SELLER_CTA: Find out what your home is worth →]"

Return ONLY valid JSON, no markdown fences.`,
      },
    ],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : '{}'
  const data = JSON.parse(text.trim())

  const bodyText: string = data.body ?? ''

  // Convert bullet points to separate blocks
  const blocks: PortableTextBlock[] = []
  const lines = bodyText.split('\n').filter((l: string) => l.trim())

  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed.startsWith('- ')) {
      // Bullet point — strip prefix, then check for inline seller CTA
      const bulletText = trimmed.slice(2)
      const block = lineToBlock('• ' + bulletText)
      blocks.push(block)
    } else {
      blocks.push(lineToBlock(trimmed))
    }
  }

  // Append source credit block
  blocks.push({
    _type: 'block',
    _key: makeKey(),
    style: 'normal',
    markDefs: [{ _type: 'link', _key: 'sourcelink', href: article.url }],
    children: [
      {
        _type: 'span',
        _key: makeKey(),
        text: `Source: ${article.source ?? article.title}`,
        marks: ['sourcelink'],
      },
    ],
  })

  return {
    title: data.title,
    slug: slugify(data.title),
    excerpt: data.excerpt,
    category: article.category,
    metaTitle: data.metaTitle,
    metaDescription: data.metaDescription,
    body: blocks,
    sourceUrl: article.url,
    sourceTitle: article.title,
  }
}
