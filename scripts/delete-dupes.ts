import { getSanityWriteClient } from '../lib/sanity-write'

async function main() {
  const client = getSanityWriteClient()

  const posts: Array<{ _id: string; title: string; slug: { current: string }; _createdAt: string }> =
    await client.fetch(
      `*[_type == "blogPost" && slug.current match "virginia-beach-home-prices*"] | order(_createdAt desc) { _id, title, slug, _createdAt }`
    )

  console.log(`Found ${posts.length} matching posts:`)
  posts.forEach((p, i) => console.log(`  [${i}] ${p._createdAt} | ${p.slug?.current}`))

  const toDelete = posts.slice(1)
  for (const p of toDelete) {
    await client.delete(p._id)
    console.log(`Deleted: ${p._id}`)
  }
  console.log(`\nKept: ${posts[0]?.slug?.current}`)
}

main().catch(console.error)
