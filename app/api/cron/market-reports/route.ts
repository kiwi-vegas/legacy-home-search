import { NextResponse } from 'next/server'
import { client } from '@/sanity/client'
import { sendMarketReportMissingEmail, sendAltosUploadReminderEmail } from '@/lib/email'

const ALL_COMMUNITIES = [
  'virginia-beach', 'chesapeake', 'norfolk', 'suffolk', 'hampton', 'newport-news',
]

export const maxDuration = 30

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return runCheck()
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  if (body.secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return runCheck()
}

async function runCheck() {
  const now = new Date()
  const year = now.getFullYear()
  const monthName = now.toLocaleDateString('en-US', { month: 'long' })
  const period = `${monthName} ${year}` // e.g. "April 2026"

  // Always send Barry the monthly upload reminder first
  try {
    await sendAltosUploadReminderEmail(monthName, year)
    console.log(`[market-reports-cron] Upload reminder sent to Barry for ${period}`)
  } catch (err) {
    console.error('[market-reports-cron] Failed to send reminder email:', err)
  }

  const existing = await client.fetch<Array<{ community: string }>>(
    `*[_type == "marketReport" && reportPeriod == $period]{ community }`,
    { period }
  )

  const received = new Set(existing.map((r) => r.community))
  const missing = ALL_COMMUNITIES.filter((c) => !received.has(c))

  if (missing.length > 0) {
    const missingNames = missing.map((c) =>
      c.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    )
    await sendMarketReportMissingEmail(missingNames)
    console.log(`[market-reports-cron] Missing reports for: ${missingNames.join(', ')}`)
    return NextResponse.json({ missing: missingNames, period })
  }

  console.log(`[market-reports-cron] All ${ALL_COMMUNITIES.length} reports received for ${period}`)
  return NextResponse.json({ success: true, period, allReceived: true })
}
