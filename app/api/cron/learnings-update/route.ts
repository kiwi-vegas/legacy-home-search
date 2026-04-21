/**
 * app/api/cron/learnings-update/route.ts
 *
 * Wednesday 7:00 AM PT (14:00 UTC) — updates LEARNINGS.md with last week's data.
 *
 * Steps:
 *  1. Determine last week's weekId (the Tuesday just passed)
 *  2. Read Barry's approval decisions from Redis
 *  3. Read GA4 performance data (if available) — currently a stub, extend as needed
 *  4. Re-read the Renick dashboard data from Redis (staged data includes it)
 *  5. Generate new learnings entry (Claude Opus)
 *  6. Prepend to LEARNINGS.md and commit to GitHub
 *  7. Also ensure BLOG_PIPELINE.md has the self-improving loop section
 */

import { NextResponse } from 'next/server'
import {
  getStagedPost,
  getWeekApprovals,
  buildWeekId,
  type StagedPost,
} from '@/lib/renick-pipeline'
import { generateAndCommitLearnings, ensureBlogPipelineHasLoopSection } from '@/lib/learnings'

export const maxDuration = 120

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // The learnings cron runs Wednesday — look back to Tuesday's weekId
  const weekId = getLastTuesdayWeekId()
  const log: string[] = [`[learnings-update] Starting — weekId: ${weekId}`]

  try {
    // ── Step 1: Get week's post IDs from Redis ───────────────────────────
    const { Redis } = await import('@upstash/redis')
    const redis = Redis.fromEnv()

    const postIdsRaw = await redis.get<string>(`pipeline:week:${weekId}`)
    if (!postIdsRaw) {
      log.push(`No staged posts found for weekId ${weekId} — skipping learnings update`)
      return NextResponse.json({ success: true, skipped: true, reason: 'no posts found', log })
    }

    const postIds: string[] = typeof postIdsRaw === 'string' ? JSON.parse(postIdsRaw) : postIdsRaw
    log.push(`Found ${postIds.length} post IDs for week ${weekId}`)

    // ── Step 2: Fetch all staged posts ───────────────────────────────────
    const stagedPosts: StagedPost[] = []
    for (const postId of postIds) {
      const post = await getStagedPost(weekId, postId)
      if (post) stagedPosts.push(post)
    }
    log.push(`Loaded ${stagedPosts.length} staged posts`)

    if (stagedPosts.length === 0) {
      return NextResponse.json({ success: true, skipped: true, reason: 'posts not found in Redis', log })
    }

    // ── Step 3: Get Barry's approval decisions ───────────────────────────
    const approvalDecisions = await getWeekApprovals(weekId)
    log.push(`Approval decisions: ${JSON.stringify(approvalDecisions)}`)

    const publishedTitles: string[] = []
    const skippedTitles: string[] = []

    for (const post of stagedPosts) {
      const decision = approvalDecisions[post.postId]
      if (decision === 'approve') {
        publishedTitles.push(post.draft.title)
      } else {
        skippedTitles.push(post.draft.title)
      }
    }

    // ── Step 4: Re-construct dashboard summary from staged post data ─────
    // The full dashboard isn't stored separately, but we can reconstruct what we need
    // from the patterns (which contain Renick source info). We build a minimal
    // RenickDashboardData-compatible object.
    const renickDashboard = buildDashboardSummaryFromPosts(stagedPosts)

    const patterns = stagedPosts.map((p) => p.pattern)

    // ── Step 5: Generate and commit learnings entry ──────────────────────
    log.push('Generating learnings entry with Claude Opus...')
    await generateAndCommitLearnings({
      weekId,
      renickDashboard,
      patterns,
      approvalDecisions,
      publishedTitles,
      skippedTitles,
      // GA4 data: not yet integrated — pass undefined, Claude will note it's not available
      // TODO: wire up Google Analytics Data API to fetch organic sessions per slug
    })
    log.push('LEARNINGS.md updated and committed to GitHub')

    // ── Step 6: Ensure BLOG_PIPELINE.md has the self-improving loop section ─
    log.push('Ensuring BLOG_PIPELINE.md has self-improving loop section...')
    await ensureBlogPipelineHasLoopSection()
    log.push('BLOG_PIPELINE.md checked')

    return NextResponse.json({
      success: true,
      weekId,
      postsProcessed: stagedPosts.length,
      published: publishedTitles.length,
      skipped: skippedTitles.length,
      log,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    log.push(`ERROR: ${message}`)
    console.error('[learnings-update] Error:', err)
    return NextResponse.json({ success: false, error: message, log }, { status: 500 })
  }
}

/**
 * Returns the ISO date string (YYYY-MM-DD) for the most recent Tuesday.
 * Called on Wednesday, so "last Tuesday" = yesterday.
 */
function getLastTuesdayWeekId(): string {
  const now = new Date()
  // Day of week: 0=Sun, 1=Mon, 2=Tue, ..., 6=Sat
  // If today is Wednesday (3), last Tuesday was 1 day ago
  const dayOfWeek = now.getUTCDay()
  const daysBack = dayOfWeek === 3 ? 1 : (dayOfWeek + 7 - 2) % 7
  const lastTuesday = new Date(now)
  lastTuesday.setUTCDate(now.getUTCDate() - daysBack)
  return lastTuesday.toISOString().slice(0, 10)
}

/**
 * Re-construct a minimal dashboard summary from staged post data.
 * The full Renick dashboard data isn't stored, but each post contains
 * the Renick source and lift, which is sufficient for LEARNINGS.md.
 */
function buildDashboardSummaryFromPosts(posts: StagedPost[]) {
  return {
    weekOf: posts[0]?.weekId ?? buildWeekId(),
    topPosts: posts.map((p) => ({
      title: p.renickSource,
      url: null,
      pvBefore: 0,
      pvAfter: 0,
      liftPct: parseInt(p.renickLift.replace(/[^0-9]/g, ''), 10) || 0,
      status: 'Winner' as const,
    })),
    overallHealth: {
      pvPerDay: 0,
      engagementBefore: 0,
      engagementAfter: 0,
      engagementLiftPct: 0,
      organicSearchPct: 0,
      winners: posts.length,
      totalTracked: posts.length,
      medianDaysSinceRefresh: 0,
    },
    keyTakeaways: [],
  }
}
