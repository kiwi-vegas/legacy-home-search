import { Resend } from 'resend'
import type { ScoredArticle } from './types'

const CATEGORY_LABELS: Record<string, string> = {
  'market-update': 'Market Update',
  'buying-tips': 'Buying Tips',
  'selling-tips': 'Selling Tips',
  'community-spotlight': 'Community Spotlight',
  investment: 'Investment',
  news: 'News',
}

const CATEGORY_COLORS: Record<string, string> = {
  'market-update': '#2563eb',
  'buying-tips': '#4CAF50',
  'selling-tips': '#2196F3',
  'community-spotlight': '#9C27B0',
  investment: '#FF9800',
  news: '#607D8B',
}

function articleCard(article: ScoredArticle, index: number): string {
  const color = CATEGORY_COLORS[article.category] ?? '#2563eb'
  const label = CATEGORY_LABELS[article.category] ?? article.category
  return `
    <tr>
      <td style="padding: 16px 0; border-bottom: 1px solid #e5e3de;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="width: 28px; vertical-align: top; padding-top: 2px;">
              <span style="color: #2563eb; font-size: 18px; font-weight: 700;">${index + 1}</span>
            </td>
            <td style="padding-left: 12px;">
              <span style="display: inline-block; background: ${color}22; color: ${color}; font-size: 11px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; padding: 2px 8px; border-radius: 3px; margin-bottom: 6px;">${label}</span>
              <div style="font-size: 15px; font-weight: 600; color: #1a1a1a; margin-bottom: 6px; line-height: 1.4;">${article.title}</div>
              <div style="font-size: 13px; color: #555550; line-height: 1.6; margin-bottom: 8px;">${article.whyItMatters}</div>
              <div style="font-size: 12px; color: #888884;">
                ${article.source ?? ''} ${article.publishedDate ? '· ' + new Date(article.publishedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
                · Score: <strong style="color: #2563eb;">${article.relevanceScore}/10</strong>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>`
}

export async function sendDigestEmail(articles: ScoredArticle[], date: string): Promise<void> {
  const resendKey = process.env.RESEND_API_KEY
  const fromEmail = process.env.FROM_EMAIL
  const operatorEmail = process.env.OPERATOR_EMAIL
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL && process.env.NEXT_PUBLIC_APP_URL.trim())
    ? process.env.NEXT_PUBLIC_APP_URL.trim().replace(/\/+$/, '')
    : 'https://www.legacyhometeamlpt.com'
  const adminSecret = process.env.ADMIN_SECRET

  if (!resendKey || !fromEmail || !operatorEmail) {
    throw new Error('Missing email configuration (RESEND_API_KEY, FROM_EMAIL, or OPERATOR_EMAIL)')
  }

  const pickerUrl = `${appUrl}/admin/blog-picker/${date}?secret=${adminSecret}`
  const dateFormatted = new Date(date + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#f8f7f4;font-family:Inter,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f7f4;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;border:1px solid #e0ddd8;">

        <!-- Header -->
        <tr>
          <td style="padding: 32px 32px 24px; border-bottom: 1px solid #e0ddd8;">
            <div style="font-size: 11px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: #2563eb; margin-bottom: 8px;">Legacy Home Search · Daily Blog Digest</div>
            <div style="font-size: 22px; font-weight: 700; color: #1a1a1a;">${dateFormatted}</div>
            <div style="font-size: 14px; color: #888884; margin-top: 4px;">${articles.length} articles found · Pick 1–5 to publish</div>
          </td>
        </tr>

        <!-- Articles -->
        <tr>
          <td style="padding: 8px 32px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              ${articles.map((a, i) => articleCard(a, i)).join('')}
            </table>
          </td>
        </tr>

        <!-- CTA -->
        <tr>
          <td style="padding: 32px;">
            <a href="${pickerUrl}" style="display:block;text-align:center;background:#2563eb;color:#ffffff;font-weight:700;font-size:15px;letter-spacing:0.05em;padding:16px 32px;border-radius:8px;text-decoration:none;">
              Pick Articles to Publish →
            </a>
            <div style="font-size: 11px; color: #888884; text-align: center; margin-top: 12px;">
              This link expires in 48 hours. Only you have access.
            </div>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding: 24px 32px; border-top: 1px solid #e0ddd8;">
            <div style="font-size: 11px; color: #888884; text-align: center;">
              Legacy Home Search · Automated Blog Pipeline
            </div>
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
    to: operatorEmail,
    subject: `Virginia Beach Blog Digest — ${articles.length} articles ready to publish (${dateFormatted})`,
    html,
  })
}

// ─── Market Report Ready Email ────────────────────────────────────────────────

export async function sendMarketReportReadyEmail(
  communityName: string,
  reportPeriod: string,
  draftId: string
): Promise<void> {
  const resendKey = process.env.RESEND_API_KEY
  const fromEmail = process.env.FROM_EMAIL
  const operatorEmail = process.env.OPERATOR_EMAIL
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL && process.env.NEXT_PUBLIC_APP_URL.trim())
    ? process.env.NEXT_PUBLIC_APP_URL.trim().replace(/\/+$/, '')
    : 'https://www.legacyhometeamlpt.com'
  const adminSecret = process.env.ADMIN_SECRET

  if (!resendKey || !fromEmail || !operatorEmail) return

  const reviewUrl = `${appUrl}/admin/market-reports/review/${draftId}?secret=${adminSecret}`

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f8f7f4;font-family:Inter,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f7f4;padding:32px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:12px;border:1px solid #e0ddd8;">
        <tr>
          <td style="padding:32px 32px 24px;border-bottom:1px solid #e0ddd8;">
            <div style="font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#2563eb;margin-bottom:8px;">Legacy Home Search · Market Reports</div>
            <div style="font-size:22px;font-weight:700;color:#1a1a1a;">${communityName} — ${reportPeriod}</div>
            <div style="font-size:14px;color:#888884;margin-top:4px;">Your market report is ready to review and publish.</div>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 32px;">
            <p style="font-size:15px;color:#1a1a1a;margin:0 0 20px;">Claude has processed your Altos data and written a complete market report for <strong>${communityName}</strong> covering ${reportPeriod}. The report includes sections for buyers, sellers, and investors.</p>
            <p style="font-size:14px;color:#555550;margin:0 0 28px;">Review the draft, make any edits, and publish with one click. It will be live on the site within 60 seconds.</p>
            <a href="${reviewUrl}" style="display:block;text-align:center;background:#2563eb;color:#ffffff;font-weight:700;font-size:15px;padding:16px 32px;border-radius:8px;text-decoration:none;">Review &amp; Publish Report →</a>
            <div style="font-size:11px;color:#888884;text-align:center;margin-top:12px;">This link is private — only you have access.</div>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 32px;border-top:1px solid #e0ddd8;">
            <div style="font-size:11px;color:#888884;text-align:center;">Legacy Home Search · Automated Market Reports</div>
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
    to: operatorEmail,
    subject: `${communityName} Market Report Ready — ${reportPeriod}`,
    html,
  })
}

// ─── Monthly Altos Upload Reminder Email (sent to Barry on the 1st) ───────────

export async function sendAltosUploadReminderEmail(monthName: string, year: number): Promise<void> {
  const resendKey = process.env.RESEND_API_KEY
  const fromEmail = process.env.FROM_EMAIL
  const barryEmail = process.env.BARRY_EMAIL ?? 'barry@yourfriendlyagent.net'
  if (!resendKey || !fromEmail) return

  const communities = [
    'Virginia Beach', 'Chesapeake', 'Norfolk', 'Suffolk', 'Hampton', 'Newport News',
  ]

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#f8f7f4;font-family:Inter,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f7f4;padding:32px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:12px;border:1px solid #e0ddd8;">

        <!-- Header -->
        <tr>
          <td style="padding:32px 32px 24px;border-bottom:1px solid #e0ddd8;">
            <div style="font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#2563eb;margin-bottom:8px;">Legacy Home Search · Market Reports</div>
            <div style="font-size:22px;font-weight:700;color:#1a1a1a;margin-bottom:4px;">Time to upload your ${monthName} market reports</div>
            <div style="font-size:14px;color:#888884;">Your monthly Altos Research PDFs are ready to download.</div>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:28px 32px;">

            <p style="font-size:15px;color:#1a1a1a;margin:0 0 24px;line-height:1.7;">
              Hey Barry — it's the 1st of the month, which means it's time to grab this month's Altos reports and get them live on the site.
            </p>

            <!-- Step 1 -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
              <tr>
                <td style="width:32px;vertical-align:top;padding-top:1px;">
                  <div style="width:24px;height:24px;background:#2563eb;border-radius:50%;text-align:center;line-height:24px;font-size:12px;font-weight:700;color:#fff;">1</div>
                </td>
                <td style="padding-left:14px;">
                  <div style="font-size:14px;font-weight:700;color:#1a1a1a;margin-bottom:4px;">Download the PDFs from Altos Research</div>
                  <div style="font-size:13px;color:#555550;line-height:1.6;margin-bottom:8px;">Log in, open each city's report, and save as PDF. Name each file with the city name so it uploads correctly.</div>
                  <a href="https://altos.re/" style="display:inline-block;background:#f0f4ff;color:#2563eb;font-size:13px;font-weight:600;padding:8px 16px;border-radius:6px;text-decoration:none;border:1px solid #bfdbfe;">
                    Open Altos Research →
                  </a>
                </td>
              </tr>
            </table>

            <!-- Communities list -->
            <div style="margin:16px 0 24px 46px;padding:16px;background:#f8f7f4;border-radius:8px;border:1px solid #e0ddd8;">
              <div style="font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#888884;margin-bottom:10px;">Download reports for these 6 cities</div>
              ${communities.map((c) => `<div style="font-size:14px;color:#1a1a1a;padding:4px 0;border-bottom:1px solid #ece9e3;">&#10003;&nbsp; ${c}</div>`).join('')}
            </div>

            <!-- Step 2 -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr>
                <td style="width:32px;vertical-align:top;padding-top:1px;">
                  <div style="width:24px;height:24px;background:#2563eb;border-radius:50%;text-align:center;line-height:24px;font-size:12px;font-weight:700;color:#fff;">2</div>
                </td>
                <td style="padding-left:14px;">
                  <div style="font-size:14px;font-weight:700;color:#1a1a1a;margin-bottom:4px;">Upload all 6 PDFs at once</div>
                  <div style="font-size:13px;color:#555550;line-height:1.6;margin-bottom:8px;">Drop all the files on the upload page at the same time. Claude reads each one and publishes the reports automatically — takes about 90 seconds per city.</div>
                  <div style="font-size:13px;color:#555550;margin-bottom:12px;">
                    Password: <strong style="color:#1a1a1a;background:#f0f4ff;padding:2px 8px;border-radius:4px;font-family:monospace;">4037</strong>
                  </div>
                  <a href="https://www.legacyhometeamlpt.com/upload" style="display:inline-block;background:#2563eb;color:#ffffff;font-size:14px;font-weight:700;padding:12px 28px;border-radius:8px;text-decoration:none;">
                    Go to Upload Page →
                  </a>
                </td>
              </tr>
            </table>

          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 32px;border-top:1px solid #e0ddd8;">
            <div style="font-size:11px;color:#aaa9a4;text-align:center;">
              Legacy Home Search · Automated monthly reminder · ${monthName} ${year}
            </div>
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
    to: barryEmail,
    subject: `Upload your ${monthName} ${year} Altos market reports`,
    html,
  })
}

// ─── Market Report Safety-Net Reminder Email ──────────────────────────────────

export async function sendMarketReportMissingEmail(missingCities: string[]): Promise<void> {
  const resendKey = process.env.RESEND_API_KEY
  const fromEmail = process.env.FROM_EMAIL
  const operatorEmail = process.env.OPERATOR_EMAIL
  if (!resendKey || !fromEmail || !operatorEmail) return

  const resend = new Resend(resendKey)
  await resend.emails.send({
    from: fromEmail,
    to: operatorEmail,
    subject: `Market reports missing for: ${missingCities.join(', ')}`,
    html: `<p style="font-family:Inter,sans-serif;font-size:15px;">No Altos market report email was received this month for: <strong>${missingCities.join(', ')}</strong>.</p><p style="font-family:Inter,sans-serif;font-size:14px;color:#555;">Check your Altos campaign settings to make sure the campaigns are set to deliver to your inbound address.</p>`,
  })
}
