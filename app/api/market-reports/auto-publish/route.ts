import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getSanityWriteClient } from '@/lib/sanity-write'
import { client } from '@/sanity/client'
import { buildSlug, detectPeriod } from '@/lib/market-report-writer'
import { generateAndUploadMarketReportCover } from '@/lib/image-gen-market-report'

export const maxDuration = 300

const COMMUNITY_NAMES: Record<string, string> = {
  'virginia-beach': 'Virginia Beach',
  'chesapeake': 'Chesapeake',
  'norfolk': 'Norfolk',
  'suffolk': 'Suffolk',
  'hampton': 'Hampton',
  'newport-news': 'Newport News',
}

function detectCommunityFromFilename(filename: string): string | null {
  const lower = filename.toLowerCase().replace(/[_\-.]/g, ' ')
  // Check two-word names first to avoid partial matches
  if (lower.includes('virginia beach')) return 'virginia-beach'
  if (lower.includes('newport news')) return 'newport-news'
  if (lower.includes('chesapeake')) return 'chesapeake'
  if (lower.includes('norfolk')) return 'norfolk'
  if (lower.includes('suffolk')) return 'suffolk'
  if (lower.includes('hampton')) return 'hampton'
  return null
}

export async function POST(request: Request) {
  const adminSecret = process.env.ADMIN_SECRET
  if (!adminSecret) return NextResponse.json({ error: 'Not configured' }, { status: 500 })

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Expected multipart form data' }, { status: 400 })
  }

  const secret = formData.get('secret') as string
  if (secret !== adminSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const pdfFile = formData.get('pdf') as File | null
  if (!pdfFile) {
    return NextResponse.json({ error: 'No PDF file provided' }, { status: 400 })
  }

  // Detect community from filename
  const community = detectCommunityFromFilename(pdfFile.name)
  if (!community) {
    return NextResponse.json({
      error: `Could not detect city from filename "${pdfFile.name}". Rename the file to include the city name (e.g. Virginia_Beach_April_2026.pdf).`,
    }, { status: 400 })
  }

  const communityName = COMMUNITY_NAMES[community]
  console.log(`[auto-publish] Processing ${communityName} — file: ${pdfFile.name} (${pdfFile.size} bytes)`)

  // Convert PDF to base64
  const buffer = await pdfFile.arrayBuffer()
  const base64 = Buffer.from(buffer).toString('base64')

  // ── Claude reads the PDF and writes the full report ────────────────────
  const anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const systemPrompt = `You are Barry Jenkins, lead agent at Legacy Home Team in Hampton Roads, Virginia. You have 20+ years of experience selling homes in this market — your team sells around 900 homes per year. You're writing a monthly market report for ${communityName} based on an Altos Research data PDF.

Voice: Direct, confident, zero sales language. Plain English to ordinary homeowners, first-time buyers, and investors. Every claim tied to a specific number from the data. No fluff, no "exciting opportunities" — straight market intelligence from someone who has lived through every cycle.

Extract all stats from the PDF and write the full report. Return ONLY a valid JSON object with these exact fields (no markdown, no commentary — just JSON):`

  const userPrompt = `Read this Altos Research market report PDF for ${communityName} and return a JSON object with these exact fields:

{
  "period": "April 2026",
  "medianListPrice": "$609,000",
  "medianPriceChange": "up 3% from last month",
  "daysOnMarket": "28 days median",
  "activeInventory": "321 homes",
  "inventoryChange": "rising — up from 290 last month",
  "priceReductions": "27% of listings",
  "marketSummary": "2-3 sentences. Open with the headline number. Name what's driving the market. Close with what this means for anyone buying or selling right now.",
  "buyerSection": "3-4 sentences. What buyers face today — competition level, negotiation room, how to position an offer. Be specific to the numbers.",
  "sellerSection": "3-4 sentences. What sellers can realistically expect — pricing strategy, days to expect, any leverage they have. Specific to the data.",
  "investorSection": "3-4 sentences. Rental market signal (use median rent if in the PDF), appreciation direction, where the value is moving in this market.",
  "barrysTake": "3-4 sentences, first person (I/my/we). Draw a pattern from 20 years of cycles — what this data reminds you of, what you'd tell a client sitting across the table. No cheerleading.",
  "metaTitle": "${communityName} Real Estate Market Trends Data, April 2026",
  "metaDescription": "120-155 chars: key stat + what it means + call to action"
}

Extract the period from the report date (e.g. "REPORT FOR 4/11/2026" → "April 2026"). Use the exact numbers from the PDF. Return only the JSON object.`

  let content: Record<string, string>
  try {
    const response = await anthropicClient.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'document',
            source: { type: 'base64', media_type: 'application/pdf', data: base64 },
          } as any,
          { type: 'text', text: userPrompt },
        ],
      }],
    })
    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error(`No JSON in Claude response. Got: ${text.slice(0, 300)}`)
    content = JSON.parse(jsonMatch[0])
    console.log(`[auto-publish] Claude extracted period: ${content.period}`)
  } catch (err) {
    console.error('[auto-publish] Claude error:', err)
    return NextResponse.json({
      error: 'Failed to process PDF with Claude',
      detail: err instanceof Error ? err.message : String(err),
    }, { status: 502 })
  }

  const period = content.period ?? detectPeriod('', '')
  const slug = buildSlug(community, period)

  // ── Generate cover image ───────────────────────────────────────────────
  let coverImageRef: { _type: 'reference'; _ref: string } | null = null
  try {
    const headlineStat = content.medianListPrice ?? content.medianPriceChange ?? ''
    coverImageRef = await generateAndUploadMarketReportCover(communityName, period, headlineStat)
    console.log(`[auto-publish] Cover image: ${coverImageRef?._ref}`)
  } catch (err) {
    console.error('[auto-publish] Cover image failed (non-fatal):', err instanceof Error ? err.message : err)
  }

  // ── Publish directly to Sanity ─────────────────────────────────────────
  const writeClient = getSanityWriteClient()
  const existing = await client.fetch<{ _id: string } | null>(
    `*[_type == "marketReport" && slug.current == $slug][0]{ _id }`,
    { slug }
  )

  const publishedAt = new Date().toISOString()
  const doc: Record<string, any> = {
    _type: 'marketReport',
    community,
    communityName,
    reportPeriod: period,
    slug: { _type: 'slug', current: slug },
    published: true,
    publishedAt,
    medianListPrice: content.medianListPrice ?? '',
    medianPriceChange: content.medianPriceChange ?? '',
    daysOnMarket: content.daysOnMarket ?? '',
    activeInventory: content.activeInventory ?? '',
    inventoryChange: content.inventoryChange ?? '',
    priceReductions: content.priceReductions ?? '',
    marketSummary: content.marketSummary ?? '',
    buyerSection: content.buyerSection ?? '',
    sellerSection: content.sellerSection ?? '',
    investorSection: content.investorSection ?? '',
    barrysTake: content.barrysTake ?? '',
    metaTitle: content.metaTitle ?? '',
    metaDescription: content.metaDescription ?? '',
  }

  if (coverImageRef) {
    doc.coverImage = { _type: 'image', asset: { _type: 'reference', _ref: coverImageRef._ref } }
  }

  let docId: string
  if (existing?._id) {
    await writeClient.patch(existing._id).set(doc).commit()
    docId = existing._id
  } else {
    const created = await writeClient.create(doc as any)
    docId = created._id
  }

  console.log(`[auto-publish] Published: ${docId} → /market-reports/${slug}`)

  return NextResponse.json({
    success: true,
    communityName,
    period,
    slug,
    url: `/market-reports/${slug}`,
  })
}
