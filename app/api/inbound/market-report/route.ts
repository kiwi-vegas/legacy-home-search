import { NextResponse } from 'next/server'
import { getSanityWriteClient } from '@/lib/sanity-write'
import { writeMarketReport, detectCommunity, detectPeriod, buildSlug } from '@/lib/market-report-writer'
import { sendMarketReportReadyEmail } from '@/lib/email'
import { generateAndUploadCoverImageGemini } from '@/lib/image-gen-gemini'
import type { ScoredArticle } from '@/lib/types'

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

  // ── Extract email content ──────────────────────────────────────────────
  // Support both Resend inbound format and direct POST for testing
  const emailData = payload.data ?? payload
  const subject: string = emailData.subject ?? ''
  const emailText: string = emailData.text ?? emailData.body ?? ''

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

  // ── Generate cover image ───────────────────────────────────────────────
  // Reuse the blog image pipeline — treat as a community-spotlight article
  const fakeArticle: ScoredArticle = {
    id: `market-report-${slug}`,
    title: `${content.communityName} Real Estate Market — ${period}`,
    url: '',
    content: content.marketSummary,
    category: 'community-spotlight',
    relevanceScore: 9,
    whyItMatters: content.marketSummary,
  }

  let coverImageRef: { _type: 'reference'; _ref: string } | null = null
  try {
    coverImageRef = await generateAndUploadCoverImageGemini(fakeArticle)
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
