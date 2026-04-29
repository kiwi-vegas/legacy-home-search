/**
 * Retroactively adds external links to the last N published blog posts.
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/add-links-to-posts.ts
 *
 * What it does for each post:
 *   1. Fetches the full Portable Text body from Sanity
 *   2. Converts it to plain markdown text (preserving existing links)
 *   3. Asks Claude to add [Entity](url) links for named entities in the text
 *   4. Converts back to Portable Text
 *   5. Patches the Sanity doc with the enriched body
 */

import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@sanity/client'
import { portableTextToMarkdown, markdownToPortableText } from '../lib/portable-text-utils'

const POSTS_TO_UPDATE = 6

const sanityRead = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? '2nr7n3lm',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
  token: process.env.SANITY_WRITE_TOKEN,
})

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

async function enrichBodyWithLinks(
  plainText: string,
  postTitle: string,
): Promise<string> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 3000,
    messages: [
      {
        role: 'user',
        content: `You are editing a Hampton Roads real estate blog post to add helpful outbound links.

Post title: "${postTitle}"

Below is the full post body in markdown format. Some links may already exist as [text](url) — preserve ALL existing links exactly as they are.

Your task: identify any specific named entities that should have an external link and add them in [text](url) markdown format. This includes:
- Named events, festivals, and concerts (e.g., "the Patriotic Festival", "Town Point Wine Festival")
- Named venues, parks, and locations (e.g., "Town Point Park", "Chesapeake City Park")
- Government agencies and programs (e.g., "VHDA", "Virginia Housing", "City of Norfolk")
- Military bases (e.g., "Naval Station Norfolk", "NAS Oceana", "Fort Eustis")
- Schools, universities, school districts (e.g., "Virginia Beach City Public Schools", "Old Dominion University")
- Named businesses or organizations with public websites
- State and city government sites when referenced

Rules:
- ONLY use URLs you are very confident are correct and official. If unsure about a URL, skip the link.
- Do NOT invent or guess URLs. Real examples: [VHDA](https://www.vhda.com), [Naval Station Norfolk](https://www.cnic.navy.mil/regions/cnrma/installations/ns_norfolk.html), [Town Point Park](https://www.norfolk.gov/facilities/facility/details/Town-Point-Park-9)
- Link only the FIRST mention of each entity in the text — not every occurrence.
- Do not link generic phrases like "Hampton Roads" or "Virginia Beach" — only specific named organizations/events.
- Preserve ALL existing [text](url) links exactly as they appear.
- Return the COMPLETE post body with your additions. Do not shorten or summarize it.
- Return ONLY the plain text body, no extra commentary.

POST BODY:
${plainText}`,
      },
    ],
  })

  return response.content[0].type === 'text' ? response.content[0].text.trim() : plainText
}

async function main() {
  console.log(`Fetching last ${POSTS_TO_UPDATE} published posts from Sanity...`)

  const PUBLIC_FILTER = `(
    (!defined(workflowStatus) && (!defined(status) || status == "published")) ||
    workflowStatus == "published"
  )`

  // Fetch last N posts regardless of publish status so pending posts also get enriched
  const posts = await sanityRead.fetch<Array<{
    _id: string
    title: string
    body: any[]
  }>>(
    `*[_type == "blogPost"] | order(publishedAt desc)[0...${POSTS_TO_UPDATE}]{
      _id, title, body
    }`,
  )

  console.log(`Found ${posts.length} posts to enrich.\n`)

  for (const post of posts) {
    console.log(`Processing: "${post.title}"`)

    if (!post.body?.length) {
      console.log(`  → No body, skipping.\n`)
      continue
    }

    // Convert existing Portable Text → markdown (preserves existing links)
    const originalMarkdown = portableTextToMarkdown(post.body)

    // Ask Claude to add entity links
    let enriched: string
    try {
      enriched = await enrichBodyWithLinks(originalMarkdown, post.title)
    } catch (err) {
      console.error(`  → Claude error, skipping:`, err)
      continue
    }

    // Convert back to Portable Text
    const newBody = markdownToPortableText(enriched)

    // Patch Sanity
    await sanityRead.patch(post._id).set({ body: newBody }).commit()
    console.log(`  → Done. Body updated.\n`)

    // Small delay to avoid rate limits
    await new Promise((r) => setTimeout(r, 1500))
  }

  console.log('All posts enriched.')
}

main().catch((err) => {
  console.error('Script failed:', err)
  process.exit(1)
})
