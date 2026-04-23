/**
 * app/api/blog/approve/route.ts
 *
 * Barry's one-click approval endpoint. Called from links in the approval email.
 *
 * Query params:
 *   secret     — must match ADMIN_SECRET env var
 *   weekId     — e.g. "2026-04-22"
 *   postId     — the staged post ID
 *   action     — "approve" or "skip"
 *
 * Bulk approve-all:
 *   secret     — ADMIN_SECRET
 *   weekId     — week ID
 *   approveAll — "true"
 *   postIds    — comma-separated list of post IDs
 *
 * On approve:
 *   1. Retrieve staged post from Redis
 *   2. Call publishBlogPost() → Sanity
 *   3. Trigger thumbnail pipeline
 *   4. Record approval decision in Redis
 *   5. Return success page
 *
 * On skip:
 *   1. Record skip decision in Redis
 *   2. Return skip confirmation page
 */

import { NextResponse } from 'next/server'
import { getStagedPost, recordApprovalDecision } from '@/lib/renick-pipeline'
import { publishBlogPost } from '@/lib/sanity-write'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)

  const secret = searchParams.get('secret')
  const weekId = searchParams.get('weekId')
  const action = searchParams.get('action') as 'approve' | 'skip' | null
  const approveAll = searchParams.get('approveAll') === 'true'
  const postIdsParam = searchParams.get('postIds')

  // ── Auth ──────────────────────────────────────────────────────────────
  if (!secret || secret !== process.env.ADMIN_SECRET) {
    return new Response(buildHtmlPage('❌ Unauthorized', 'Invalid or missing secret.', 'red'), {
      status: 401,
      headers: { 'Content-Type': 'text/html' },
    })
  }

  if (!weekId) {
    return new Response(buildHtmlPage('❌ Error', 'Missing weekId parameter.', 'red'), {
      status: 400,
      headers: { 'Content-Type': 'text/html' },
    })
  }

  // ── Bulk approve-all ──────────────────────────────────────────────────
  if (approveAll && postIdsParam) {
    const postIds = postIdsParam.split(',').map((id) => decodeURIComponent(id.trim()))
    const results: { postId: string; title: string; success: boolean; error?: string }[] = []

    for (const postId of postIds) {
      try {
        const staged = await getStagedPost(weekId, postId)
        if (!staged) {
          results.push({ postId, title: '(not found)', success: false, error: 'Post not found in Redis' })
          continue
        }

        await approveAndPublish(weekId, postId, staged)
        results.push({ postId, title: staged.draft.title, success: true })
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        results.push({ postId, title: postId, success: false, error: msg })
      }
    }

    const successCount = results.filter((r) => r.success).length
    const html = buildApproveAllResultPage(results, weekId)
    return new Response(html, { status: 200, headers: { 'Content-Type': 'text/html' } })
  }

  // ── Single post action ────────────────────────────────────────────────
  const postId = searchParams.get('postId')
  if (!postId) {
    return new Response(buildHtmlPage('❌ Error', 'Missing postId parameter.', 'red'), {
      status: 400,
      headers: { 'Content-Type': 'text/html' },
    })
  }

  if (!action || !['approve', 'skip'].includes(action)) {
    return new Response(buildHtmlPage('❌ Error', 'Action must be "approve" or "skip".', 'red'), {
      status: 400,
      headers: { 'Content-Type': 'text/html' },
    })
  }

  const staged = await getStagedPost(weekId, postId)
  if (!staged) {
    return new Response(
      buildHtmlPage(
        '⚠️ Post Not Found',
        `This post (${postId}) could not be found. It may have already been processed or the 7-day window has expired.`,
        'orange'
      ),
      { status: 404, headers: { 'Content-Type': 'text/html' } }
    )
  }

  if (action === 'skip') {
    await recordApprovalDecision(weekId, postId, 'skip')
    return new Response(
      buildHtmlPage(
        '✓ Post Skipped',
        `"${staged.draft.title}" has been skipped. This will be noted in next week's LEARNINGS.md update.`,
        'gray'
      ),
      { status: 200, headers: { 'Content-Type': 'text/html' } }
    )
  }

  // action === 'approve'
  try {
    const sanityId = await approveAndPublish(weekId, postId, staged)
    const blogUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://legacyhometeamlpt.com'}/blog/${staged.draft.slug}`

    return new Response(
      buildApproveSuccessPage(staged.draft.title, blogUrl, sanityId),
      { status: 200, headers: { 'Content-Type': 'text/html' } }
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[approve] Publish error:', err)
    return new Response(
      buildHtmlPage('❌ Publish Failed', `Error publishing "${staged.draft.title}": ${message}`, 'red'),
      { status: 500, headers: { 'Content-Type': 'text/html' } }
    )
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Core publish logic
// ─────────────────────────────────────────────────────────────────────────────

async function approveAndPublish(
  weekId: string,
  postId: string,
  staged: Awaited<ReturnType<typeof getStagedPost>> & {}
): Promise<string> {
  const { draft } = staged!

  const sanityId = await publishBlogPost(draft)
  await recordApprovalDecision(weekId, postId, 'approve')

  return sanityId
}

// ─────────────────────────────────────────────────────────────────────────────
// HTML response pages
// ─────────────────────────────────────────────────────────────────────────────

function buildHtmlPage(title: string, message: string, color: 'red' | 'orange' | 'gray' | 'green'): string {
  const colors: Record<string, string> = {
    red: '#dc3545',
    orange: '#fd7e14',
    gray: '#6c757d',
    green: '#28a745',
  }
  const hex = colors[color] ?? '#1a2e4a'

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { margin: 0; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f4f6f8; }
    .card { max-width: 520px; margin: 0 auto; background: #fff; border-radius: 10px; padding: 36px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); text-align: center; }
    h1 { font-size: 22px; color: ${hex}; margin: 0 0 12px; }
    p { font-size: 15px; color: #5a6a7a; line-height: 1.6; margin: 0; }
  </style>
</head>
<body>
  <div class="card">
    <h1>${title}</h1>
    <p>${message}</p>
  </div>
</body>
</html>`
}

function buildApproveSuccessPage(title: string, blogUrl: string, sanityId: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Post Published!</title>
  <style>
    body { margin: 0; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f4f6f8; }
    .card { max-width: 540px; margin: 0 auto; background: #fff; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .header { background: #1a2e4a; padding: 28px 32px; }
    .header p { margin: 0; color: #7eb3e0; font-size: 11px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; }
    .header h1 { margin: 6px 0 0; color: #fff; font-size: 20px; }
    .body { padding: 28px 32px; }
    .title { font-size: 16px; font-weight: 600; color: #1a2e4a; margin: 0 0 16px; line-height: 1.4; }
    .status { display: inline-block; padding: 4px 12px; background: #e8f5e9; color: #28a745; font-size: 12px; font-weight: 600; border-radius: 20px; margin-bottom: 20px; }
    .btn { display: inline-block; padding: 12px 28px; background: #2d7dd2; color: #fff; font-size: 14px; font-weight: 700; text-decoration: none; border-radius: 6px; }
    .meta { margin-top: 20px; font-size: 12px; color: #8a9aaa; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <p>Legacy Home Search — Blog Pipeline</p>
      <h1>✓ Post Published!</h1>
    </div>
    <div class="body">
      <p class="title">${title}</p>
      <p class="status">Live on legacyhometeamlpt.com/blog</p>
      <br>
      <a href="${blogUrl}" class="btn">View Post →</a>
      <p class="meta">Sanity ID: ${sanityId}<br>Add a thumbnail manually in Sanity Studio.</p>
    </div>
  </div>
</body>
</html>`
}

function buildApproveAllResultPage(
  results: { postId: string; title: string; success: boolean; error?: string }[],
  weekId: string
): string {
  const successCount = results.filter((r) => r.success).length
  const rows = results
    .map(
      (r) => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #eee;font-size:14px;color:${r.success ? '#1a2e4a' : '#dc3545'};">${r.title}</td>
      <td style="padding:10px 0;border-bottom:1px solid #eee;text-align:right;font-size:13px;color:${r.success ? '#28a745' : '#dc3545'};">${r.success ? '✓ Published' : `✗ ${r.error ?? 'Failed'}`}</td>
    </tr>`
    )
    .join('')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Approve All Results</title>
  <style>
    body { margin: 0; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f4f6f8; }
    .card { max-width: 560px; margin: 0 auto; background: #fff; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .header { background: #1a2e4a; padding: 28px 32px; }
    .header p { margin: 0; color: #7eb3e0; font-size: 11px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; }
    .header h1 { margin: 6px 0 0; color: #fff; font-size: 20px; }
    .header .sub { margin: 8px 0 0; color: #a8c4dc; font-size: 13px; }
    .body { padding: 28px 32px; }
    table { width: 100%; border-collapse: collapse; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <p>Legacy Home Search — Blog Pipeline</p>
      <h1>Approve All — ${successCount}/${results.length} Published</h1>
      <p class="sub">Week of ${weekId}</p>
    </div>
    <div class="body">
      <table>${rows}</table>
    </div>
  </div>
</body>
</html>`
}
