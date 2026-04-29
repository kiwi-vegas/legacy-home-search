import { checkCoverage, seedMissingTopics } from '@/lib/required-topics-coverage'

async function main() {
  console.log('Checking required topics coverage...\n')
  const report = await checkCoverage()

  console.log(`Total required: ${report.total}`)
  console.log(`Already covered by published posts: ${report.covered.length}`)
  console.log(`Already queued in Redis: ${report.alreadyQueued.length}`)
  console.log(`Missing (not covered, not queued): ${report.missing.length}`)
  console.log(`Will seed now: ${report.toSeed.length}`)
  console.log('')

  if (report.covered.length > 0) {
    console.log('=== COVERED ===')
    report.covered.forEach((g) => console.log('  ✓', g.title))
    console.log('')
  }

  if (report.toSeed.length > 0) {
    console.log('=== SEEDING ===')
    report.toSeed.forEach((g, i) => console.log(`  ${i + 1}. ${g.title}`))
    console.log('')

    const result = await seedMissingTopics()
    console.log(`✓ Seeded ${result.seededCount} ideas into Redis idea queue`)
    console.log('  → These will appear on /admin/idea-review for approval')
  } else {
    console.log('Nothing to seed — all required topics are already covered or queued.')
  }
}

main().catch(console.error)
