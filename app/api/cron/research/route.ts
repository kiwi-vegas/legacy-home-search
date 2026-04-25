import { NextResponse } from 'next/server'
import { fetchAndScoreArticles } from '@/lib/research'
import { fetchAndScoreIdeas } from '@/lib/research'
import { storeArticles } from '@/lib/store'
import { saveIdea, getCoveredTopics } from '@/lib/idea-store'
import { BREAKING_ALERT_THRESHOLD } from '@/lib/scoring'
import type { IdeaCandidate } from '@/lib/types'
import { Resend } from 'resend'

export const maxDuration = 60

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return runResearch()
}

// Also allow POST for manual testing
export async function POST(request: Request) {
  const adminSecret = process.env.ADMIN_SECRET
  if (!adminSecret) return NextResponse.json({ error: 'Not configured' }, { status: 500 })
  const body = await request.json().catch(() => ({}))
  if (body.secret !== adminSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return runResearch()
}

async function runResearch() {
  const date = new Date().toISOString().split('T')[0]

  try {
    console.log(`[research] Starting daily research for ${date}`)

    // ── Keep legacy article store for blog-picker backward compat ──────────
    const legacyArticles = await fetchAndScoreArticles()
    if (legacyArticles.length > 0) {
      await storeArticles(date, { date, articles: legacyArticles, fetchedAt: new Date().toISOString() })
    }

    // ── New: score as ideas and route to unified queue ─────────────────────
    const coveredTopics = await getCoveredTopics()
    const ideas = await fetchAndScoreIdeas(coveredTopics)
    console.log(`[research] ${ideas.length} ideas passed threshold`)

    let savedCount = 0
    const breakingIdeas: IdeaCandidate[] = []

    for (const idea of ideas) {
      await saveIdea(idea)
      savedCount++
      if (idea.urgency === 'breaking' && idea.score.total >= BREAKING_ALERT_THRESHOLD) {
        breakingIdeas.push(idea)
      }
    }

    // ── Send breaking news alerts (immediate, bypasses weekly queue) ───────
    if (breakingIdeas.length > 0) {
      await sendBreakingAlert(breakingIdeas)
      console.log(`[research] Breaking alert sent for ${breakingIdeas.length} idea(s)`)
    }

    console.log(`[research] Saved ${savedCount} ideas to queue`)

    return NextResponse.json({
      success: true,
      date,
      ideasQueued: savedCount,
      breakingAlerts: breakingIdeas.length,
      titles: ideas.map((i) => `[${i.score.total}] ${i.title}`),
    })
  } catch (error) {
    console.error('[research] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// ─── Breaking news alert email ────────────────────────────────────────────────

async function sendBreakingAlert(ideas: IdeaCandidate[]): Promise<void> {
  const resendKey  = process.env.RESEND_API_KEY
  const fromEmail  = process.env.FROM_EMAIL
  const appUrl     = process.env.NEXT_PUBLIC_APP_URL ?? 'https://legacyhometeamlpt.com'
  const adminSecret = process.env.ADMIN_SECRET

  if (!resendKey || !fromEmail) return

  const reviewUrl = `${appUrl}/admin/idea-review?secret=${adminSecret}`

  const ideaCards = ideas.map((idea) => `
    <tr>
      <td style="padding:16px 0;border-bottom:1px solid #fee2e2;">
        <div style="display:inline-block;background:#fef2f2;color:#dc2626;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;padding:3px 10px;border-radius:99px;margin-bottom:8px;">
          ⚡ BREAKING · Score ${idea.score.total}/100
        </div>
        <div style="font-size:16px;font-weight:700;color:#1a1a1a;margin-bottom:6px;line-height:1.4;">${idea.title}</div>
        <div style="font-size:13px;color:#555;line-height:1.6;margin-bottom:8px;">${idea.whyItMatters}</div>
        <div style="font-size:12px;color:#888;">
          ${idea.sourceLabels[0] ?? ''} · ${idea.sourceDomains[0] ?? ''}
        </div>
      </td>
    </tr>`).join('')

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#fff5f5;font-family:Inter,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff5f5;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;border:2px solid #fca5a5;">

        <tr>
          <td style="padding:28px 32px 20px;background:#fef2f2;border-radius:10px 10px 0 0;border-bottom:1px solid #fca5a5;">
            <div style="font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#dc2626;margin-bottom:8px;">⚡ Breaking News Alert</div>
            <div style="font-size:20px;font-weight:700;color:#1a1a1a;">${ideas.length} time-sensitive content ${ideas.length === 1 ? 'opportunity' : 'opportunities'} detected</div>
            <div style="font-size:14px;color:#888;margin-top:4px;">These scored ≥85/100 and are happening right now. Act fast for best results.</div>
          </td>
        </tr>

        <tr>
          <td style="padding:8px 32px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              ${ideaCards}
            </table>
          </td>
        </tr>

        <tr>
          <td style="padding:28px 32px;">
            <a href="${reviewUrl}" style="display:block;text-align:center;background:#dc2626;color:#fff;font-weight:700;font-size:15px;padding:16px 32px;border-radius:8px;text-decoration:none;">
              Review &amp; Approve Now →
            </a>
            <div style="font-size:11px;color:#888;text-align:center;margin-top:10px;">These ideas are also in your weekly review queue.</div>
          </td>
        </tr>

        <tr>
          <td style="padding:20px 32px;border-top:1px solid #fee2e2;">
            <div style="font-size:11px;color:#aaa;text-align:center;">Legacy Home Team · Content Pipeline</div>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`

  const resend = new Resend(resendKey)
  await resend.emails.send({
    from: fromEmail,
    to: 'kiwi@ylopo.com',
    subject: `⚡ [Breaking] ${ideas.length} time-sensitive content ${ideas.length === 1 ? 'idea' : 'ideas'} — act now`,
    html,
  })
}
