/**
 * lib/renick-email.ts
 *
 * Builds and sends the weekly approval email to Barry Jenkins.
 * Each post gets its own card with title, keyword, summary, and APPROVE/SKIP buttons.
 */

import type { StagedPost } from './renick-pipeline'

export async function sendApprovalEmail(
  posts: StagedPost[],
  weekId: string
): Promise<void> {
  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey) throw new Error('RESEND_API_KEY not set')

  const barryEmail = process.env.BARRY_EMAIL
  if (!barryEmail) throw new Error('BARRY_EMAIL not set')

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://legacyhometeamlpt.com'
  const adminSecret = process.env.ADMIN_SECRET ?? ''

  const subject = `[Action Needed] ${posts.length} New Blog Posts Ready — Week of ${formatDate(weekId)}`
  const html = buildApprovalEmailHtml(posts, weekId, appUrl, adminSecret)
  const text = buildApprovalEmailText(posts, weekId, appUrl, adminSecret)

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${resendKey}`,
    },
    body: JSON.stringify({
      from: process.env.FROM_EMAIL ?? 'pipeline@legacyhomesearch.com',
      to: [barryEmail],
      subject,
      html,
      text,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Resend email failed: ${res.status} — ${err}`)
  }
}

function formatDate(weekId: string): string {
  // "2026-04-22" → "April 22, 2026"
  const d = new Date(weekId + 'T12:00:00Z')
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

function approveUrl(appUrl: string, weekId: string, postId: string, action: string, secret: string): string {
  return `${appUrl}/api/blog/approve?secret=${encodeURIComponent(secret)}&weekId=${weekId}&postId=${encodeURIComponent(postId)}&action=${action}`
}

function buildApprovalEmailHtml(
  posts: StagedPost[],
  weekId: string,
  appUrl: string,
  secret: string
): string {
  const postCards = posts
    .map((post, i) => {
      const approveHref = approveUrl(appUrl, weekId, post.postId, 'approve', secret)
      const skipHref = approveUrl(appUrl, weekId, post.postId, 'skip', secret)
      const num = i + 1
      const liftNum = parseInt(post.renickLift.replace(/[^0-9]/g, ''), 10)
      const liftColor = liftNum >= 500 ? '#28a745' : liftNum >= 200 ? '#5a9e6f' : '#7a8a9a'

      return `
        <!-- Post ${num} -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:10px;border-radius:8px;border:1px solid #e8ecf0;overflow:hidden;">
          <!-- Post number + lift badge -->
          <tr style="background:#f8f9fa;">
            <td style="padding:10px 16px;border-bottom:1px solid #e8ecf0;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="font-size:12px;font-weight:600;color:#8a9aaa;text-transform:uppercase;letter-spacing:0.8px;">Post ${num} of ${posts.length}</td>
                  <td align="right" style="font-size:13px;font-weight:700;color:${liftColor};">Inspired by +${post.renickLift} Renick winner</td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Title -->
          <tr>
            <td style="padding:14px 16px 8px;background:#ffffff;">
              <p style="margin:0;font-size:16px;font-weight:700;color:#1a2e4a;line-height:1.4;">${post.draft.title}</p>
            </td>
          </tr>
          <!-- Meta row -->
          <tr>
            <td style="padding:0 16px 10px;background:#ffffff;">
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding-right:16px;">
                    <span style="font-size:11px;font-weight:600;color:#8a9aaa;text-transform:uppercase;letter-spacing:0.6px;">Keyword</span><br>
                    <span style="font-size:13px;color:#3a4a5a;">${post.pattern.targetKeyword}</span>
                  </td>
                  <td style="padding-right:16px;">
                    <span style="font-size:11px;font-weight:600;color:#8a9aaa;text-transform:uppercase;letter-spacing:0.6px;">Category</span><br>
                    <span style="font-size:13px;color:#3a4a5a;">${formatCategory(post.draft.category)}</span>
                  </td>
                  <td>
                    <span style="font-size:11px;font-weight:600;color:#8a9aaa;text-transform:uppercase;letter-spacing:0.6px;">City</span><br>
                    <span style="font-size:13px;color:#3a4a5a;">${post.pattern.cityTarget}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Excerpt -->
          <tr>
            <td style="padding:0 16px 14px;background:#ffffff;">
              <p style="margin:0;font-size:13px;color:#5a6a7a;line-height:1.6;">${post.draft.excerpt}</p>
            </td>
          </tr>
          <!-- Approve / Skip buttons -->
          <tr>
            <td style="padding:12px 16px;background:#f8f9fa;border-top:1px solid #e8ecf0;">
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding-right:10px;">
                    <a href="${approveHref}" style="display:inline-block;padding:10px 24px;background:#28a745;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;border-radius:6px;">✓ Approve &amp; Publish</a>
                  </td>
                  <td>
                    <a href="${skipHref}" style="display:inline-block;padding:10px 24px;background:#ffffff;color:#8a9aaa;font-size:14px;font-weight:600;text-decoration:none;border-radius:6px;border:1px solid #e8ecf0;">Skip</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>`
    })
    .join('\n')

  // Build "Approve All" URL (approves each post in sequence)
  const approveAllLinks = posts
    .map((p) => approveUrl(appUrl, weekId, p.postId, 'approve', secret))
    .join('|')

  const approveAllHref = `${appUrl}/api/blog/approve?secret=${encodeURIComponent(secret)}&weekId=${weekId}&approveAll=true&postIds=${posts.map((p) => encodeURIComponent(p.postId)).join(',')}`

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f4f6f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f6f8;padding:32px 0;">
  <tr>
    <td align="center">
      <table width="640" cellpadding="0" cellspacing="0" border="0" style="max-width:640px;width:100%;background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background-color:#1a2e4a;padding:28px 36px 24px;">
            <p style="margin:0;color:#7eb3e0;font-size:11px;font-weight:600;letter-spacing:1.2px;text-transform:uppercase;">Legacy Home Search — Blog Pipeline</p>
            <h1 style="margin:6px 0 0;color:#ffffff;font-size:22px;font-weight:700;line-height:1.3;">${posts.length} New Posts Ready for Review</h1>
            <p style="margin:10px 0 0;color:#a8c4dc;font-size:13px;">Week of ${formatDate(weekId)} &nbsp;|&nbsp; Inspired by Renick's top performers</p>
            <p style="margin:6px 0 0;font-size:13px;color:#a8c4dc;">One click to approve &amp; publish. Posts go live within 60 seconds.</p>
          </td>
        </tr>

        <!-- Post cards -->
        <tr>
          <td style="padding:24px 28px 8px;">
            ${postCards}
          </td>
        </tr>

        <!-- Approve All -->
        <tr>
          <td style="padding:8px 28px 28px;">
            <table width="100%" cellpadding="16" cellspacing="0" border="0" style="background:#f0f7ff;border-radius:8px;border:1px solid #c8dff8;">
              <tr>
                <td>
                  <p style="margin:0 0 12px;font-size:14px;font-weight:600;color:#1a2e4a;">Approve everything at once?</p>
                  <a href="${approveAllHref}" style="display:inline-block;padding:12px 32px;background:#2d7dd2;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;border-radius:6px;">✓ Approve All ${posts.length} Posts</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:0 28px 24px;">
            <table width="100%" cellpadding="14" cellspacing="0" border="0" style="background:#f4f6f8;border-radius:6px;">
              <tr>
                <td style="font-size:12px;color:#7a8a9a;line-height:1.6;">
                  Posts are generated automatically each Tuesday based on what's working on the Renick Sarasota blog.<br>
                  Approved posts publish to Sanity &amp; go live at legacyhometeamlpt.com/blog within 60 seconds.<br>
                  Thumbnails are generated automatically using the Barry Jenkins thumbnail pipeline.
                </td>
              </tr>
            </table>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body>
</html>`
}

function buildApprovalEmailText(
  posts: StagedPost[],
  weekId: string,
  appUrl: string,
  secret: string
): string {
  const lines = [
    `Legacy Home Search — ${posts.length} New Posts Ready — Week of ${formatDate(weekId)}`,
    ``,
    `One click to approve & publish. Posts go live within 60 seconds.`,
    ``,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    ``,
  ]

  posts.forEach((post, i) => {
    const approveHref = approveUrl(appUrl, weekId, post.postId, 'approve', secret)
    const skipHref = approveUrl(appUrl, weekId, post.postId, 'skip', secret)
    lines.push(`POST ${i + 1} — Inspired by +${post.renickLift} Renick winner`)
    lines.push(`Title: ${post.draft.title}`)
    lines.push(`Keyword: ${post.pattern.targetKeyword}`)
    lines.push(`Category: ${formatCategory(post.draft.category)}`)
    lines.push(`Summary: ${post.draft.excerpt}`)
    lines.push(``)
    lines.push(`→ APPROVE: ${approveHref}`)
    lines.push(`→ SKIP: ${skipHref}`)
    lines.push(``)
    lines.push(`─────────────────────────────────────────`)
    lines.push(``)
  })

  const approveAllHref = `${appUrl}/api/blog/approve?secret=${encodeURIComponent(secret)}&weekId=${weekId}&approveAll=true&postIds=${posts.map((p) => encodeURIComponent(p.postId)).join(',')}`
  lines.push(`APPROVE ALL: ${approveAllHref}`)
  lines.push(``)
  lines.push(`Posts generated automatically from the Renick → Jenkins content pipeline.`)
  lines.push(`Thumbnails generated automatically using the Barry Jenkins thumbnail system.`)

  return lines.join('\n')
}

function formatCategory(cat: string): string {
  const map: Record<string, string> = {
    'market-update': 'Market Update',
    'buying-tips': 'Buying Tips',
    'selling-tips': 'Selling Tips',
    'community-spotlight': 'Community Spotlight',
    'investment': 'Investment',
    'news': 'News',
  }
  return map[cat] ?? cat
}
