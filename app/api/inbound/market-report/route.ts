import { NextResponse } from 'next/server'
import { getSanityWriteClient } from '@/lib/sanity-write'
import { writeMarketReport, detectCommunity, detectPeriod, buildSlug } from '@/lib/market-report-writer'
import { sendMarketReportReadyEmail } from '@/lib/email'
import { generateAndUploadMarketReportCover } from '@/lib/image-gen-market-report'

export const maxDuration = 300

// ─── Resend inbound email webhook ────────────────────────────────────────────
// Resend sends a POST with the email payload when an email arrives at your
// inbound address. Payload structure:
// { type: "email.received", data: { from, to, subject, text, html, ... } }
//
// Webhook signature verification uses the INBOUND_WEBHOOK_SECRET env var.

export async function POST(request: Request) {
  const rawBody = await request.text()

  // ── Verify webhook signature ───────────────────────────────────────────
  const secret = process.env.INBOUND_WEBHOOK_SECRET
  if (secret) {
    // Resend uses Svix for webhook signing
    try {
      const { Webhook } = await import('svix')
      const wh = new Webhook(secret)
      wh.verify(rawBody, {
        'svix-id': request.headers.get('svix-id') ?? '',
        'svix-timestamp': request.headers.get('svix-timestamp') ?? '',
        'svix-signature': request.headers.get('svix-signature') ?? '',
      })
    } catch {
      console.error('[market-report-inbound] Invalid webhook signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }
  } else {
    console.warn('[market-report-inbound] INBOUND_WEBHOOK_SECRET not set — skipping signature check')
  }

  let payload: any
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // ── Extract email metadata from webhook payload ────────────────────────
  // Resend inbound webhooks only include metadata — body must be fetched separately
  // Payload: { type: "email.received", data: { email_id, subject, from, to, ... } }
  const emailData = payload.data ?? payload
  const subject: string = emailData.subject ?? ''
  const emailId: string = emailData.email_id ?? emailData.id ?? ''

  console.log('[market-report-inbound] Payload keys:', Object.keys(emailData).join(', '))
  console.log('[market-report-inbound] subject:', subject, '| emailId:', emailId)

  // ── Fetch email body from Resend API ───────────────────────────────────
  // Direct test POSTs can include body text inline to skip the API call
  let emailText: string = emailData.text ?? emailData.body ?? ''

  if (!emailText && emailId) {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      console.error('[market-report-inbound] RESEND_API_KEY not set — cannot fetch email body')
      return NextResponse.json({ error: 'RESEND_API_KEY not configured' }, { status: 500 })
    }
    try {
      const url = `https://api.resend.com/emails/receiving/${emailId}`
      console.log('[market-report-inbound] Fetching email body from:', url)
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${apiKey}` },
      })
      const responseText = await res.text()
      console.log('[market-report-inbound] Resend API response', res.status, ':', responseText.slice(0, 500))
      if (!res.ok) throw new Error(`Resend API ${res.status}: ${responseText}`)
      const email = JSON.parse(responseText)
      emailText = email.text ?? email.html ?? ''
      console.log('[market-report-inbound] Email body length:', emailText.length)
    } catch (err) {
      console.error('[market-report-inbound] Failed to fetch email body:', err instanceof Error ? err.message : err)
      return NextResponse.json({
        error: 'Could not retrieve email body from Resend',
        detail: err instanceof Error ? err.message : String(err),
        debug: { emailId, subject, payloadKeys: Object.keys(emailData) },
      }, { status: 502 })
    }
  }

  if (!emailText && !subject) {
    return NextResponse.json({ error: 'No email content found in payload' }, { status: 400 })
  }

  // ── Detect community ───────────────────────────────────────────────────
  const community = detectCommunity(subject, emailText)
  if (!community) {
    console.error('[market-report-inbound] Could not detect community from email')
    // Send Barry a heads-up
    const { sendMarketReportMissingEmail } = await import('@/lib/email')
    await sendMarketReportMissingEmail(['Unknown city'])
    return NextResponse.json({
      error: 'Could not detect community',
      hint: 'Check that the Altos email subject or body mentions one of: Virginia Beach, Chesapeake, Norfolk, Suffolk, Hampton, Newport News',
    }, { status: 422 })
  }

  const period = detectPeriod(subject, emailText)
  const slug = buildSlug(community, period)

  console.log(`[market-report-inbound] Processing: ${community} — ${period} (slug: ${slug})`)

  // ── Write report with Claude ───────────────────────────────────────────
  const content = await writeMarketReport(emailText, community, period)
  console.log(`[market-report-inbound] Report written for ${content.communityName}`)

  // ── Generate cover image (DALL-E 3 — YouTube/financial illustration style) ──
  let coverImageRef: { _type: 'reference'; _ref: string } | null = null
  try {
    const headlineStat = content.medianListPrice ?? content.medianPriceChange ?? ''
    coverImageRef = await generateAndUploadMarketReportCover(content.communityName, period, headlineStat)
    console.log(`[market-report-inbound] Cover image generated: ${coverImageRef?._ref}`)
  } catch (err) {
    console.error('[market-report-inbound] Cover image failed:', err instanceof Error ? err.message : err)
  }

  // ── Publish draft to Sanity ────────────────────────────────────────────
  const writeClient = getSanityWriteClient()

  // Check for slug collision — if same community+period already exists, update it
  const { client } = await import('@/sanity/client')
  const existing = await client.fetch<{ _id: string } | null>(
    `*[_type == "marketReport" && slug.current == $slug][0]{ _id }`,
    { slug }
  )

  const doc: Record<string, any> = {
    _type: 'marketReport',
    community,
    communityName: content.communityName,
    reportPeriod: period,
    slug: { _type: 'slug', current: slug },
    published: false,
    altosEmailText: emailText.slice(0, 10000),
    medianListPrice: content.medianListPrice,
    medianPriceChange: content.medianPriceChange,
    daysOnMarket: content.daysOnMarket,
    activeInventory: content.activeInventory,
    inventoryChange: content.inventoryChange,
    priceReductions: content.priceReductions,
    marketSummary: content.marketSummary,
    buyerSection: content.buyerSection,
    sellerSection: content.sellerSection,
    investorSection: content.investorSection,
    barrysTake: content.barrysTake,
    metaTitle: content.metaTitle,
    metaDescription: content.metaDescription,
  }

  if (coverImageRef) {
    doc.coverImage = { _type: 'image', asset: { _type: 'reference', _ref: coverImageRef._ref } }
  }

  let draftId: string
  if (existing?._id) {
    await writeClient.patch(existing._id).set(doc).commit()
    draftId = existing._id
    console.log(`[market-report-inbound] Updated existing draft: ${draftId}`)
  } else {
    const created = await writeClient.create(doc as any)
    draftId = created._id
    console.log(`[market-report-inbound] Created draft: ${draftId}`)
  }

  // ── Notify Barry ───────────────────────────────────────────────────────
  await sendMarketReportReadyEmail(content.communityName, period, draftId)
  console.log(`[market-report-inbound] Notification sent to operator`)

  return NextResponse.json({
    success: true,
    community,
    period,
    slug,
    draftId,
  })
}
