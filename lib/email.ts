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
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://legacy-home-search.vercel.app'
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
