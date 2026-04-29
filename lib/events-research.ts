/**
 * Monthly events research pipeline.
 *
 * Searches for upcoming Hampton Roads events, writes 1 roundup + up to 3 spotlights,
 * and saves them to Sanity as workflowStatus: 'media_pending' for the VA queue.
 */

import Anthropic from '@anthropic-ai/sdk'
import { publishBlogPost } from './sanity-write'
import { markdownToPortableText } from './portable-text-utils'
import type { BlogPostDraft } from './types'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function stripJsonFences(text: string): string {
  return text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim()
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

// ─── Target month helpers ─────────────────────────────────────────────────────

export function getTargetMonth(offsetMonths = 1): {
  month: string
  year: string
  label: string
  shortLabel: string
} {
  const now = new Date()
  const target = new Date(now.getFullYear(), now.getMonth() + offsetMonths, 1)
  const month = target.toLocaleString('en-US', { month: 'long' })
  const year = target.getFullYear().toString()
  return {
    month,
    year,
    label: `${month} ${year}`,
    shortLabel: target.toLocaleString('en-US', { month: 'short', year: 'numeric' }),
  }
}

// ─── Tavily search ────────────────────────────────────────────────────────────

interface RawResult {
  title: string
  url: string
  content: string
  source: string
}

async function fetchEventResults(month: string, year: string): Promise<RawResult[]> {
  const apiKey = process.env.TAVILY_API_KEY
  if (!apiKey) throw new Error('TAVILY_API_KEY is not set')

  const queries = [
    `Virginia Beach events ${month} ${year}`,
    `Hampton Roads events activities ${month} ${year}`,
    `Norfolk events concerts festivals ${month} ${year}`,
    `Chesapeake Suffolk Hampton Newport News events ${month} ${year}`,
    `Hampton Roads outdoor festivals community ${month} ${year}`,
    `Virginia Beach things to do ${month} ${year}`,
    `Hampton Roads farmers market community events ${month} ${year}`,
    `Hampton Roads family activities kids ${month} ${year}`,
  ]

  const results: RawResult[] = []
  const seenUrls = new Set<string>()

  for (const query of queries) {
    try {
      const res = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          query,
          search_depth: 'basic',
          max_results: 6,
          include_answer: false,
        }),
      })
      if (!res.ok) continue
      const data = await res.json()
      for (const r of data.results ?? []) {
        if (!seenUrls.has(r.url)) {
          seenUrls.add(r.url)
          results.push({
            title: r.title,
            url: r.url,
            content: r.content ?? '',
            source: new URL(r.url).hostname.replace('www.', ''),
          })
        }
      }
    } catch {
      // skip failed query
    }
  }

  return results
}

// ─── Event extraction ─────────────────────────────────────────────────────────

interface ExtractedEvent {
  name: string
  dates: string
  location: string
  description: string
  type: 'major' | 'community'
  url?: string
}

async function extractEvents(
  results: RawResult[],
  month: string,
  year: string,
): Promise<ExtractedEvent[]> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const resultText = results
    .slice(0, 40)
    .map((r) => `SOURCE: ${r.source}\nTITLE: ${r.title}\nURL: ${r.url}\nSNIPPET: ${r.content.slice(0, 400)}`)
    .join('\n\n---\n\n')

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 3000,
    messages: [
      {
        role: 'user',
        content: `You are a local events researcher for Hampton Roads, Virginia.

Below are search results for events happening in Hampton Roads in ${month} ${year}. Extract all distinct events.

For each event return:
- name: event name
- dates: specific dates or pattern (e.g. "May 10–12", "Every Saturday in May", "May 3")
- location: city and venue name
- description: 2–3 sentences about what it is, who it's for, and what attendees can expect
- type: "major" (large multi-day festival, big concert series, annual flagship event — deserves its own dedicated blog post) or "community" (farmers market, neighborhood event, smaller recurring event — goes in a monthly roundup)
- url: most relevant URL from the search results, or omit if none

Rules:
- Only include Hampton Roads area events (Virginia Beach, Norfolk, Chesapeake, Suffolk, Hampton, Newport News). Drop anything outside this region.
- Skip purely commercial promotions with no community value.
- Mark at most 3 events as "major" — only the genuinely biggest, most noteworthy events.
- Recurring weekly events (farmers markets, etc.) count as ONE entry, not multiple.
- If the exact date is unclear, still include the event with approximate dates.

Return a JSON array of event objects. Return ONLY valid JSON, no markdown.

SEARCH RESULTS:
${resultText}`,
      },
    ],
  })

  try {
    const raw = response.content[0].type === 'text' ? response.content[0].text.trim() : '[]'
    const events = JSON.parse(stripJsonFences(raw)) as ExtractedEvent[]
    console.log(`[events-research] Extracted ${events.length} events for ${month} ${year}`)
    return events
  } catch (err) {
    console.error('[events-research] Event extraction JSON parse failed:', err)
    return []
  }
}

// ─── Post writing ─────────────────────────────────────────────────────────────

async function writeSpotlightPost(
  event: ExtractedEvent,
  month: string,
  year: string,
): Promise<BlogPostDraft> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2000,
    messages: [
      {
        role: 'user',
        content: `You are Barry Jenkins, a real estate agent at Legacy Home Search who has lived and worked in Hampton Roads for over 20 years. You care deeply about this community and love sharing what makes it a great place to live, raise a family, and put down roots.

Write a community spotlight blog post about this upcoming event:
Event: ${event.name}
Dates: ${event.dates}
Location: ${event.location}
Description: ${event.description}
Month: ${month} ${year}

Your voice: warm, local, genuinely excited — not a press release. You're a neighbor sharing something worth knowing about. Briefly weave in (1–2 sentences max) why events like this are part of what makes Hampton Roads such a great place to live and own a home.

Return a JSON object with EXACTLY these fields:
{
  "title": "Engaging headline that names the event and month — not clickbait, just clear and inviting",
  "excerpt": "2–3 sentences. Names the event, dates, and why Hampton Roads residents should know about it.",
  "metaTitle": "SEO title under 60 chars",
  "metaDescription": "120–160 chars for search preview",
  "body": "Full post in plain text. Use ## for h2 headings, ### for h3. Structure: intro paragraph → What Is It section → What to Expect section → Dates & Details section (date, time, location, cost if known) → Why It Matters to Our Community (1–2 sentences, Barry's personal note) → closing. 350–500 words total."
}

EXTERNAL LINK RULE — this is required:
Whenever you mention a specific named event, venue, organization, city park, or website that has its own web presence, wrap the FIRST mention in markdown link syntax: [Entity Name](https://official-url.com)
Only use URLs you are confident are real and official. Skip the link if unsure. Do not invent URLs.
Link only the first mention of each entity.

Return ONLY valid JSON, no markdown fences.`,
      },
    ],
  })

  const raw = response.content[0].type === 'text' ? response.content[0].text.trim() : '{}'
  const data = JSON.parse(stripJsonFences(raw))

  return {
    title: data.title,
    slug: slugify(data.title),
    excerpt: data.excerpt,
    category: 'community-spotlight',
    metaTitle: data.metaTitle,
    metaDescription: data.metaDescription,
    body: markdownToPortableText(data.body),
    sourceUrl: event.url ?? `https://www.visitvirginiabeach.com`,
    sourceTitle: event.name,
  }
}

async function writeRoundupPost(
  events: ExtractedEvent[],
  month: string,
  year: string,
): Promise<BlogPostDraft> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const eventList = events
    .map((e) => `- ${e.name} (${e.dates}, ${e.location}): ${e.description}`)
    .join('\n')

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2500,
    messages: [
      {
        role: 'user',
        content: `You are Barry Jenkins, a real estate agent at Legacy Home Search who has lived and worked in Hampton Roads for over 20 years. You genuinely love this community and enjoy sharing what's going on.

Write a monthly community events roundup blog post for Hampton Roads in ${month} ${year}.

Here are the events to cover:
${eventList}

Your voice: warm, local, like a knowledgeable neighbor. You're not writing a press release — you're sharing what's worth knowing about. Keep it honest and personal where it fits.

Lightly weave in (1–2 sentences, at the end) that one of the things that makes Hampton Roads such a great place to live is how much there always is to do — and that it's one of the reasons your clients love settling here.

Return a JSON object with EXACTLY these fields:
{
  "title": "What's Happening in Hampton Roads in ${month} — Events, Festivals & Things To Do",
  "excerpt": "2–3 sentences overview of the month's highlights across the Hampton Roads area.",
  "metaTitle": "Hampton Roads Events ${month} ${year} | Things To Do Guide",
  "metaDescription": "120–160 chars — a preview of the month's best events",
  "body": "Full post in plain text. Use ## for h2 headings. Structure: brief intro paragraph → then organized sections by theme (Festivals & Big Events, Outdoor & Farmers Markets, Family & Community, etc.) — list events with their dates and locations under each section → closing paragraph with Barry's note about community. 400–600 words. For each event, give 2–3 sentences of description. Use - for bullet-style items."
}

EXTERNAL LINK RULE — this is required:
For each named event in the roundup, link its name the first time it appears: [Event Name](https://official-url.com)
Also link any named venues, parks, or organizations with their own web presence.
Only use URLs you are confident are real and official. Skip the link if unsure. Do not invent URLs.

Return ONLY valid JSON, no markdown fences.`,
      },
    ],
  })

  const raw = response.content[0].type === 'text' ? response.content[0].text.trim() : '{}'
  const data = JSON.parse(stripJsonFences(raw))

  return {
    title: data.title,
    slug: slugify(data.title),
    excerpt: data.excerpt,
    category: 'community-spotlight',
    metaTitle: data.metaTitle,
    metaDescription: data.metaDescription,
    body: markdownToPortableText(data.body),
    sourceUrl: 'https://www.visitvirginiabeach.com',
    sourceTitle: `Hampton Roads Events — ${month} ${year}`,
  }
}

// ─── Main entry point ─────────────────────────────────────────────────────────

export interface EventsResearchResult {
  postsCreated: number
  monthLabel: string
  postTitles: string[]
}

export async function runEventsResearch(offsetMonths = 1): Promise<EventsResearchResult> {
  const { month, year, label } = getTargetMonth(offsetMonths)

  // 1. Gather search results
  const rawResults = await fetchEventResults(month, year)
  console.log(`[events-research] Tavily returned ${rawResults.length} results for ${label}`)
  if (rawResults.length === 0) {
    return { postsCreated: 0, monthLabel: label, postTitles: [] }
  }

  // 2. Extract and categorize events
  const events = await extractEvents(rawResults, month, year)
  console.log(`[events-research] ${events.length} events extracted (${events.filter(e => e.type === 'major').length} major)`)
  if (events.length === 0) {
    return { postsCreated: 0, monthLabel: label, postTitles: [] }
  }

  const majorEvents = events.filter((e) => e.type === 'major').slice(0, 3)
  const allEvents = events

  // 3. Write posts
  const posts: BlogPostDraft[] = []
  const titles: string[] = []

  // Spotlight posts for major events
  for (const event of majorEvents) {
    try {
      const post = await writeSpotlightPost(event, month, year)
      posts.push(post)
      titles.push(post.title)
    } catch (err) {
      console.error('[events-research] Failed to write spotlight for', event.name, err)
    }
  }

  // Monthly roundup (always)
  try {
    const roundup = await writeRoundupPost(allEvents, month, year)
    posts.push(roundup)
    titles.push(roundup.title)
  } catch (err) {
    console.error('[events-research] Failed to write roundup', err)
  }

  // 4. Save all posts to Sanity (media_pending → VA queue)
  for (const post of posts) {
    await publishBlogPost(post)
  }

  return { postsCreated: posts.length, monthLabel: label, postTitles: titles }
}
