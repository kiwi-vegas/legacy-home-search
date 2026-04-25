/**
 * app/api/cron/renick-pipeline/route.ts
 *
 * Tuesday 8:05 AM PT (15:05 UTC) — Renick → Jenkins idea pipeline.
 *
 * New flow (Phase 2):
 *  1. Fetch + parse the Renick dashboard
 *  2. Read LEARNINGS.md for context
 *  3. Extract 5 content patterns (Claude Opus)
 *  4. Research each pattern (Tavily)
 *  5. Convert patterns → IdeaCandidate objects (no pre-writing)
 *  6. Save to unified idea store
 *
 * Post writing now happens only when the reviewer approves an idea
 * at /admin/idea-review.
 */

import { NextResponse } from 'next/server'
import {
  fetchRenickDashboard,
  extractContentPatterns,
  researchPostIdea,
  patternsToIdeas,
  buildWeekId,
} from '@/lib/renick-pipeline'
import { readLearnings } from '@/lib/learnings'
import { saveIdea, getCoveredTopics } from '@/lib/idea-store'

export const maxDuration = 300

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return runRenickPipeline()
}

export async function POST(request: Request) {
  const adminSecret = process.env.ADMIN_SECRET
  if (!adminSecret) return NextResponse.json({ error: 'Not configured' }, { status: 500 })
  const body = await request.json().catch(() => ({}))
  if (body.secret !== adminSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return runRenickPipeline()
}

async function runRenickPipeline() {
  const weekId = buildWeekId()
  const log: string[] = [`[renick-pipeline] Starting — weekId: ${weekId}`]

  try {
    // ── Step 1: Fetch Renick dashboard ──────────────────────────────────
    log.push('Fetching Renick dashboard...')
    const dashboard = await fetchRenickDashboard()
    log.push(`Dashboard fetched. Winners: ${dashboard.topPosts.filter((p) => p.status === 'Winner').length}`)

    // ── Step 2: Read LEARNINGS.md ────────────────────────────────────────
    log.push('Reading LEARNINGS.md...')
    const learningsContext = await readLearnings()
    log.push(`LEARNINGS.md loaded (${learningsContext.length} chars)`)

    // ── Step 3: Extract content patterns ────────────────────────────────
    log.push('Extracting content patterns...')
    const patterns = await extractContentPatterns(dashboard, learningsContext)
    log.push(`Patterns extracted: ${patterns.length}`)

    // ── Step 4: Research each pattern ───────────────────────────────────
    const researchByIndex: Record<number, string> = {}
    for (let i = 0; i < patterns.length; i++) {
      log.push(`[${i + 1}/${patterns.length}] Researching: ${patterns[i].translatedTitle}`)
      researchByIndex[i] = await researchPostIdea(patterns[i])
    }

    // ── Step 5: Convert patterns to idea candidates (no pre-writing) ────
    log.push('Converting patterns to idea candidates...')
    const coveredTopics = await getCoveredTopics()
    const ideas = patternsToIdeas(patterns, researchByIndex, dashboard, coveredTopics)
    log.push(`${ideas.length} ideas passed scoring threshold`)

    // ── Step 6: Save to unified idea store ──────────────────────────────
    for (const idea of ideas) {
      await saveIdea(idea)
    }
    log.push(`Saved ${ideas.length} ideas to queue`)

    return NextResponse.json({
      success: true,
      weekId,
      ideasQueued: ideas.length,
      titles: ideas.map((i) => `[${i.score.total}] ${i.title}`),
      log,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    log.push(`ERROR: ${message}`)
    console.error('[renick-pipeline] Error:', err)

    try {
      await notifyOperatorOfFailure(weekId, message)
    } catch {
      // Don't let notification failure mask the original error
    }

    return NextResponse.json({ success: false, error: message, log }, { status: 500 })
  }
}

async function notifyOperatorOfFailure(weekId: string, error: string): Promise<void> {
  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey) return

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${resendKey}`,
    },
    body: JSON.stringify({
      from: process.env.FROM_EMAIL ?? 'pipeline@legacyhomesearch.com',
      to: ['kiwi@ylopo.com'],
      subject: `[PIPELINE ERROR] Renick pipeline failed — Week of ${weekId}`,
      text: `The Renick pipeline encountered an error:\n\n${error}\n\nWeek ID: ${weekId}\nTime: ${new Date().toISOString()}`,
    }),
  })
}
