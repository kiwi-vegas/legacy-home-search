/**
 * Patches the most recent published blog post to workflowStatus: 'media_pending'
 * so it appears in the VA queue for testing.
 * Run: npx tsx --env-file=.env.local /tmp/seed-queue.ts
 */
import { getSanityWriteClient } from '../lib/sanity-write'

async function main() {
  const client = getSanityWriteClient()

  // Fetch 3 recent posts that don't have workflowStatus yet
  const posts = await client.fetch(
    `*[_type == "blogPost" && !defined(workflowStatus)] | order(publishedAt desc)[0...3]{_id, title, publishedAt}`
  )

  if (!posts.length) {
    console.log('No eligible posts found.')
    return
  }

  console.log(`Found ${posts.length} posts to seed into VA queue:`)
  for (const post of posts) {
    console.log(`  - ${post.title} (${post._id})`)
    await client.patch(post._id).set({ workflowStatus: 'media_pending' }).commit()
    console.log(`    ✓ Set to media_pending`)
  }
  console.log('\nDone — visit /admin/va-queue to see them.')
}

main().catch(console.error)
