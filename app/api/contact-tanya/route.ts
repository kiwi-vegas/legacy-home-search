import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { firstName, lastName, email, phone, interest, message } = body

    if (!firstName || !email || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const resendKey = process.env.RESEND_API_KEY
    const fromEmail = process.env.FROM_EMAIL

    if (!resendKey || !fromEmail) {
      return NextResponse.json({ error: 'Email not configured' }, { status: 500 })
    }

    const resend = new Resend(resendKey)

    await resend.emails.send({
      from: fromEmail,
      to: 'tanyasellsvirginia@gmail.com',
      replyTo: email,
      subject: `New inquiry from ${firstName} ${lastName} — Tanya Thompson · Legacy Home Search`,
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#f8f7f4;font-family:Inter,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f7f4;padding:32px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:12px;border:1px solid #e0ddd8;">

        <!-- Header -->
        <tr>
          <td style="padding:28px 32px 20px;border-bottom:1px solid #e0ddd8;">
            <div style="font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#2563eb;margin-bottom:8px;">Tanya Thompson · Legacy Home Search — New Contact Inquiry</div>
            <div style="font-size:22px;font-weight:700;color:#1a1a1a;">${firstName} ${lastName}</div>
            <div style="font-size:14px;color:#888884;margin-top:4px;">Submitted via tanya.legacyhomesearch.com</div>
          </td>
        </tr>

        <!-- Fields -->
        <tr>
          <td style="padding:24px 32px;">
            <table width="100%" cellpadding="0" cellspacing="0">

              <tr>
                <td style="padding:10px 0;border-bottom:1px solid #f0ede8;">
                  <div style="font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#888884;margin-bottom:4px;">Looking to</div>
                  <div style="font-size:15px;color:#1a1a1a;font-weight:600;">${interest || 'Not specified'}</div>
                </td>
              </tr>

              <tr>
                <td style="padding:10px 0;border-bottom:1px solid #f0ede8;">
                  <div style="font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#888884;margin-bottom:4px;">Email</div>
                  <div style="font-size:15px;color:#1a1a1a;">
                    <a href="mailto:${email}" style="color:#2563eb;text-decoration:none;">${email}</a>
                  </div>
                </td>
              </tr>

              ${phone ? `
              <tr>
                <td style="padding:10px 0;border-bottom:1px solid #f0ede8;">
                  <div style="font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#888884;margin-bottom:4px;">Phone</div>
                  <div style="font-size:15px;color:#1a1a1a;">
                    <a href="tel:${phone}" style="color:#2563eb;text-decoration:none;">${phone}</a>
                  </div>
                </td>
              </tr>` : ''}

              <tr>
                <td style="padding:16px 0 0;">
                  <div style="font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#888884;margin-bottom:8px;">Message</div>
                  <div style="font-size:15px;color:#1a1a1a;line-height:1.7;background:#f8f7f4;padding:16px;border-radius:8px;border:1px solid #e0ddd8;">${message.replace(/\n/g, '<br>')}</div>
                </td>
              </tr>

            </table>
          </td>
        </tr>

        <!-- Reply CTA -->
        <tr>
          <td style="padding:8px 32px 28px;">
            <a href="mailto:${email}?subject=Re: Your inquiry to Tanya Thompson · Legacy Home Team" style="display:block;text-align:center;background:#2563eb;color:#ffffff;font-weight:700;font-size:15px;padding:14px 32px;border-radius:8px;text-decoration:none;">
              Reply to ${firstName} →
            </a>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 32px;border-top:1px solid #e0ddd8;">
            <div style="font-size:11px;color:#aaa9a4;text-align:center;">
              Legacy Home Search · Tanya Thompson · Contact Form Submission
            </div>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`,
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Contact form error:', err)
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }
}
