import { NextResponse } from 'next/server'
import { checkCoverage, seedMissingTopics } from '@/lib/required-topics-coverage'

export const maxDuration = 60

// Vercel cron: GET with Bearer CRON_SECRET (runs monthly, 3rd at 9 AM PT)
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return runJob({ seed: true })
}

// Manual: POST with ?secret=ADMIN_SECRET&dryRun=1 (preview) or no dryRun (seed)
export async function POST(request: Request) {
  const { searchParams } = new URL(request.url)
  if (searchParams.get('secret') !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const dryRun = searchParams.get('dryRun') === '1'
  return runJob({ seed: !dryRun })
}

async function runJob({ seed }: { seed: boolean }) {
  try {
    const report = await checkCoverage()

    const summary = {
      totalRequired: report.total,
      covered: report.covered.length,
      missing: report.missing.length,
      alreadyQueued: report.alreadyQueued.length,
      toSeed: report.toSeed.length,
    }

    if (!seed) {
      return NextResponse.json({
        ...summary,
        coverageDetails: {
          covered: report.covered.map((g) => g.title),
          missing: report.missing.map((g) => g.title),
          alreadyQueued: report.alreadyQueued.map((g) => g.title),
          toSeed: report.toSeed.map((g) => g.title),
        },
      })
    }

    const seedResult = await seedMissingTopics()
    console.log(`[required-topics-coverage] Seeded ${seedResult.seededCount} missing topics`)

    return NextResponse.json({
      ...summary,
      seeded: seedResult.seededCount,
      seededTitles: seedResult.seededTitles,
    })
  } catch (err) {
    console.error('[required-topics-coverage]', err instanceof Error ? err.message : err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    )
  }
}
