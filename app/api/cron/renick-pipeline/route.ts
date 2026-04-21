/**
 * app/api/cron/renick-pipeline/route.ts
 *
 * Tuesday 8:05 AM PT (15:05 UTC) — Renick → Jenkins content pipeline orchestrator.
 *
 * Steps:
 *  1. Fetch + parse the Renick dashboard
 *  2. Read LEARNINGS.md for context
 *  3. Extract 5 content patterns (Claude Opus)
 *  4. Research each pattern (Tavily)
 *  5. Generate 5 full blog post drafts (Claude Sonnet)
 *  6. Stage posts in Redis (7-day TTL)
 *  7. Send approval email to Barry
 */

import { NextResponse } from 'next/server'
import {
  fetchRenickDashboard,
  extractContentPatterns,
  researchPostIdea,
  generateBlogPost,
  stagePostsInRedis,
  buildWeekId,
  type StagedPost,
} from '@/lib/renick-pipeline'
import { readLearnings } from '@/lib/learnings'
import { sendApprovalEmail } from '@/lib/renick-email'

export const maxDuration = 300 // 5 min — plenty of time for all AI calls

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const weekId = buildWeekId()
  const log: string[] = [`[renick-pipeline] Starting — weekId: ${weekId}`]

  try {
    // ── Step 1: Fetch Renick dashboard ──────────────────────────────────
    log.push('Fetching Renick dashboard...')
    const dashboard = await fetchRenickDashboard()
    log.push(`Dashboard fetched. Winners: ${dashboard.topPosts.filter(p => p.status === 'Winner').length}`)

    // ── Step 2: Read LEARNINGS.md ────────────────────────────────────────
    log.push('Reading LEARNINGS.md...')
    const learningsContext = await readLearnings()
    log.push(`LEARNINGS.md loaded (${learningsContext.length} chars)`)

    // ── Step 3: Extract content patterns ────────────────────────────────
    log.push('Extracting content patterns...')
    const patterns = await extractContentPatterns(dashboard, learningsContext)
    log.push(`Patterns extracted: ${patterns.length}`)

    // ── Step 4 + 5: Research + generate posts (sequentially to avoid rate limits) ─
    const stagedPosts: StagedPost[] = []

    for (let i = 0; i < patterns.length; i++) {
      const pattern = patterns[i]
      log.push(`[${i + 1}/${patterns.length}] Researching: ${pattern.translatedTitle}`)

      const researchData = await researchPostIdea(pattern)
      log.push(`[${i + 1}/${patterns.length}] Generating post...`)

      const draft = await generateBlogPost(pattern, researchData, learningsContext)

      // Find the Renick source post that inspired this pattern
      const sourcePost = dashboard.topPosts.find(
        (p) => p.title === pattern.exampleRenickTitle
      )

      const postId = `${weekId}-${i + 1}-${Math.random().toString(36).slice(2, 7)}`

      stagedPosts.push({
        postId,
        weekId,
        pattern,
        draft,
        renickSource: pattern.exampleRenickTitle,
        renickLift: sourcePost ? `${sourcePost.liftPct}%` : `${pattern.avgLiftPct}%`,
        stagedAt: new Date().toISOString(),
      })

      log.push(`[${i + 1}/${patterns.length}] Generated: "${draft.title}"`)
    }

    // ── Step 6: Stage in Redis ───────────────────────────────────────────
    log.push('Staging posts in Redis...')
    await stagePostsInRedis(stagedPosts)
    log.push(`Staged ${stagedPosts.length} posts`)

    // ── Step 7: Send approval email ──────────────────────────────────────
    log.push('Sending approval email to Barry...')
    await sendApprovalEmail(stagedPosts, weekId)
    log.push('Approval email sent.')

    return NextResponse.json({
      success: true,
      weekId,
      postsGenerated: stagedPosts.length,
      titles: stagedPosts.map((p) => p.draft.title),
      log,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    log.push(`ERROR: ${message}`)
    console.error('[renick-pipeline] Error:', err)

    // Notify operator of failure
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
  const operatorEmail = process.env.OPERATOR_EMAIL
  if (!resendKey || !operatorEmail) return

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${resendKey}`,
    },
    body: JSON.stringify({
      from: process.env.FROM_EMAIL ?? 'pipeline@legacyhomesearch.com',
      to: [operatorEmail],
      subject: `[PIPELINE ERROR] Renick → Jenkins failed — Week of ${weekId}`,
      text: `The Renick → Jenkins pipeline encountered an error:\n\n${error}\n\nWeek ID: ${weekId}\nTime: ${new Date().toISOString()}`,
    }),
  })
}
