import { NextResponse } from 'next/server'
import { runEventsResearch, getTargetMonth } from '@/lib/events-research'
import { Resend } from 'resend'

export const maxDuration = 120

// Vercel cron: GET with Bearer CRON_SECRET (runs 25th of each month at 9 AM PT)
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return runEventsJob(1)
}

// Manual trigger: POST with ?secret=ADMIN_SECRET
// Optional body: { offsetMonths: 1 } — 1 = next month (default), 0 = current month
export async function POST(request: Request) {
  const { searchParams } = new URL(request.url)
  if (searchParams.get('secret') !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const body = await request.json().catch(() => ({}))
  const offset = typeof body.offsetMonths === 'number' ? body.offsetMonths : 1
  return runEventsJob(offset)
}

async function runEventsJob(offsetMonths: number) {
  const { label } = getTargetMonth(offsetMonths)
  console.log(`[events-research] Starting research for ${label}`)

  try {
    const result = await runEventsResearch(offsetMonths)

    if (result.postsCreated > 0) {
      await sendNotificationEmail(result.monthLabel, result.postTitles)
    }

    console.log(`[events-research] Done — ${result.postsCreated} posts created for ${label}`)
    return NextResponse.json(result)
  } catch (err) {
    console.error('[events-research] Error:', err instanceof Error ? err.message : err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    )
  }
}

async function sendNotificationEmail(monthLabel: string, titles: string[]) {
  const resendKey = process.env.RESEND_API_KEY
  const fromEmail = process.env.FROM_EMAIL
  const operatorEmail = process.env.OPERATOR_EMAIL
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL && process.env.NEXT_PUBLIC_APP_URL.trim())
    ? process.env.NEXT_PUBLIC_APP_URL.trim().replace(/\/+$/, '')
    : 'https://www.legacyhometeamlpt.com'
  const secret = process.env.ADMIN_SECRET

  if (!resendKey || !fromEmail || !operatorEmail) return

  const resend = new Resend(resendKey)
  const queueUrl = `${appUrl}/admin/va-queue?secret=${secret}`

  const listItems = titles
    .map((t) => `<li style="margin-bottom:8px; font-size:14px; color:#1a1a1a;">${t}</li>`)
    .join('')

  await resend.emails.send({
    from: fromEmail,
    to: operatorEmail,
    subject: `${titles.length} event posts ready for ${monthLabel} — VA Queue`,
    html: `
      <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;padding:32px 24px;background:#fff;">
        <div style="background:#1E3A5F;padding:20px 24px;border-radius:8px 8px 0 0;">
          <h1 style="margin:0;font-size:18px;color:#fff;font-weight:600;">📅 ${monthLabel} Event Posts Ready</h1>
        </div>
        <div style="background:#f8f7f4;padding:24px;border-radius:0 0 8px 8px;border:1px solid #e5e3de;border-top:none;">
          <p style="font-size:15px;color:#333;margin:0 0 16px;">
            ${titles.length} community event posts have been written for <strong>${monthLabel}</strong> and are waiting in the VA queue for thumbnails and publishing.
          </p>
          <ul style="margin:0 0 20px;padding:0 0 0 20px;">
            ${listItems}
          </ul>
          <a href="${queueUrl}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:12px 24px;border-radius:6px;font-size:14px;font-weight:600;">Open VA Queue →</a>
        </div>
      </div>`,
  })
}
