import Anthropic from '@anthropic-ai/sdk'
import type { ScoredArticle, BlogPostDraft, PortableTextBlock, PortableTextSpan } from './types'

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

export async function writePost(article: ScoredArticle): Promise<BlogPostDraft> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const response = await anthropic.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 2000,
    messages: [
      {
        role: 'user',
        content: `You are a knowledgeable real estate professional writing a blog post for Legacy Home Search to share with clients and followers.

Write a blog post based on this article:
TITLE: ${article.title}
URL: ${article.url}
SNIPPET: ${article.content.slice(0, 500)}
WHY IT MATTERS: ${article.whyItMatters}

Your audience: home buyers, sellers, and investors.
Your voice: knowledgeable, approachable, direct. Not salesy. You genuinely care about helping people.

Return a JSON object with EXACTLY these fields:
{
  "title": "Your rewritten, engaging headline (not the original title)",
  "excerpt": "2-3 sentence summary for the blog listing page",
  "metaTitle": "SEO title under 60 chars",
  "metaDescription": "SEO description 120-160 chars",
  "body": "The full post in plain text. Use ## for h2 headings, ### for h3. Include: intro paragraph, 2-3 body sections with headings, a ## What This Means For You section with 3-4 bullet points (use - prefix), and a closing paragraph. 300-400 words total."
}

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
      // Convert bullet to a list item block (we'll use normal style with a bullet prefix for simplicity)
      blocks.push({
        _type: 'block',
        _key: makeKey(),
        style: 'normal',
        markDefs: [],
        children: [{ _type: 'span', _key: makeKey(), text: '• ' + trimmed.slice(2), marks: [] }],
      })
    } else {
      blocks.push(...textToPortableText(trimmed))
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
