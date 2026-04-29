import Anthropic from '@anthropic-ai/sdk'
import type { ScoredArticle, BlogPostDraft } from './types'
import { markdownToPortableText, lineToBlock } from './portable-text-utils'

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
Whenever the body mentions sellers, homeowners having equity, or what a home is worth, end that sentence with [SELLER_CTA: Find out what your home is worth →] inline — do not put it on its own line, keep it at the end of the sentence it relates to. Use this no more than 2 times per post, only where it genuinely fits.
Example: "If you own a home in Hampton Roads, you're likely sitting on more equity than you realize. [SELLER_CTA: Find out what your home is worth →]"

EXTERNAL LINK RULE — this is required:
Whenever you mention a specific named event, festival, business, school, military base, government agency, or organization that has its own website, wrap the FIRST mention in markdown link syntax: [Entity Name](https://official-url.com)
Only use URLs you are confident are real and official. Do not guess or invent URLs. Skip the link if unsure.
Good examples: [VHDA](https://www.vhda.com), [Naval Station Norfolk](https://www.cnic.navy.mil/regions/cnrma/installations/ns_norfolk.html), [Virginia Beach City Public Schools](https://www.vbschools.com), [Chesapeake Regional Medical Center](https://www.chesapeakeregional.com)
Link only the first mention of each entity, not every occurrence.

Return ONLY valid JSON, no markdown fences.`,
      },
    ],
  })

  const raw = response.content[0].type === 'text' ? response.content[0].text : '{}'
  const data = JSON.parse(raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim())

  const bodyText: string = data.body ?? ''
  const blocks = markdownToPortableText(bodyText)

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
