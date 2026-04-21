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

const GA4_PROPERTY_ID = process.env.GA4_PROPERTY_ID || '391852993'

interface GA4PostData {
  title: string
  slug: string
  pageviews7d: number
  avgTimeOnPage: string
  organicSessions: number
}

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
    const publishedSlugs: { title: string; slug: string }[] = []

    for (const post of stagedPosts) {
      const decision = approvalDecisions[post.postId]
      if (decision === 'approve') {
        publishedTitles.push(post.draft.title)
        publishedSlugs.push({ title: post.draft.title, slug: post.draft.slug })
      } else {
        skippedTitles.push(post.draft.title)
      }
    }

    // ── Fetch GA4 performance data for published posts ───────────────────
    let ga4Data: GA4PostData[] | undefined
    try {
      const fetched = await fetchGA4PostPerformance(publishedSlugs)
      if (fetched.length > 0) {
        ga4Data = fetched
        log.push(`Fetched GA4 data for ${fetched.length} posts`)
      } else {
        log.push('GA4 data unavailable (no results or not configured)')
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      log.push(`WARNING: GA4 fetch failed — ${msg}`)
      ga4Data = undefined
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
      ga4Data,
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

/**
 * Fetches GA4 performance data (pageviews, avg session duration) for each
 * published blog post slug over the last 7 days.
 *
 * GA4 Data API requires OAuth or a service-account token — not an API key.
 * This implementation reads GOOGLE_API_KEY and:
 *   - If it looks like a service-account JSON, mints a Bearer token via JWT and
 *     queries the GA4 Data API.
 *   - Otherwise, skips gracefully and returns [].
 */
async function fetchGA4PostPerformance(
  slugs: { title: string; slug: string }[]
): Promise<GA4PostData[]> {
  if (slugs.length === 0) return []

  const rawKey = process.env.GOOGLE_API_KEY
  if (!rawKey) return []

  const trimmed = rawKey.trim()
  if (!trimmed.startsWith('{')) {
    console.warn('[learnings-update] GOOGLE_API_KEY is not a service-account JSON — skipping GA4')
    return []
  }

  let creds: { client_email: string; private_key: string }
  try {
    creds = JSON.parse(trimmed)
  } catch {
    console.warn('[learnings-update] GOOGLE_API_KEY is not valid JSON — skipping GA4')
    return []
  }
  if (!creds.client_email || !creds.private_key) return []

  const accessToken = await getGoogleAccessToken(creds)
  if (!accessToken) return []

  const endDate = new Date()
  const startDate = new Date()
  startDate.setUTCDate(endDate.getUTCDate() - 7)
  const fmt = (d: Date) => d.toISOString().slice(0, 10)

  const res = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${GA4_PROPERTY_ID}:runReport`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        dateRanges: [{ startDate: fmt(startDate), endDate: fmt(endDate) }],
        dimensions: [{ name: 'pagePath' }],
        metrics: [{ name: 'screenPageViews' }, { name: 'averageSessionDuration' }],
        dimensionFilter: {
          filter: {
            fieldName: 'pagePath',
            stringFilter: { matchType: 'BEGINS_WITH', value: '/blog/' },
          },
        },
        limit: 1000,
      }),
    }
  )

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`GA4 API ${res.status}: ${text.slice(0, 200)}`)
  }

  const data = (await res.json()) as {
    rows?: Array<{ dimensionValues: { value: string }[]; metricValues: { value: string }[] }>
  }
  const rows = data.rows || []

  const bySlug = new Map<string, { views: number; avgDuration: number }>()
  for (const row of rows) {
    const path = row.dimensionValues[0]?.value || ''
    const slug = path.replace(/^\/blog\//, '').replace(/\/$/, '')
    if (!slug) continue
    const views = parseInt(row.metricValues[0]?.value || '0', 10)
    const avgDuration = parseFloat(row.metricValues[1]?.value || '0')
    bySlug.set(slug, { views, avgDuration })
  }

  return slugs.map(({ title, slug }) => {
    const entry = bySlug.get(slug)
    const seconds = entry?.avgDuration ?? 0
    const mins = Math.floor(seconds / 60)
    const secs = Math.round(seconds % 60)
    return {
      title,
      slug,
      pageviews7d: entry?.views ?? 0,
      avgTimeOnPage: `${mins}m ${secs}s`,
      // TODO: GA4 Data API doesn't easily separate organic sessions without a
      // segment/filter on sessionDefaultChannelGroup — populate as 0 for now.
      organicSessions: 0,
    }
  })
}

/**
 * Mints a Google OAuth2 access token from a service-account JSON using the
 * JWT Bearer flow. Scoped to the GA4 Data API (analytics.readonly).
 */
async function getGoogleAccessToken(creds: {
  client_email: string
  private_key: string
}): Promise<string | null> {
  const crypto = await import('crypto')
  const now = Math.floor(Date.now() / 1000)

  const header = { alg: 'RS256', typ: 'JWT' }
  const claim = {
    iss: creds.client_email,
    scope: 'https://www.googleapis.com/auth/analytics.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }

  const b64url = (s: string | Buffer) =>
    (Buffer.isBuffer(s) ? s : Buffer.from(s))
      .toString('base64')
      .replace(/=+$/, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')

  const unsigned = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(claim))}`
  const signer = crypto.createSign('RSA-SHA256')
  signer.update(unsigned)
  const signature = b64url(signer.sign(creds.private_key.replace(/\\n/g, '\n')))
  const jwt = `${unsigned}.${signature}`

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Google token endpoint ${res.status}: ${text.slice(0, 200)}`)
  }

  const data = (await res.json()) as { access_token?: string }
  return data.access_token || null
}
