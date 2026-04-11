import Anthropic from '@anthropic-ai/sdk'

export interface MarketReportContent {
  communityName: string
  reportPeriod: string
  medianListPrice: string
  medianPriceChange: string
  daysOnMarket: string
  activeInventory: string
  inventoryChange: string
  priceReductions: string
  marketSummary: string
  buyerSection: string
  sellerSection: string
  investorSection: string
  barrysTake: string
  metaTitle: string
  metaDescription: string
}

const COMMUNITY_NAMES: Record<string, string> = {
  'virginia-beach': 'Virginia Beach',
  chesapeake: 'Chesapeake',
  norfolk: 'Norfolk',
  suffolk: 'Suffolk',
  hampton: 'Hampton',
  'newport-news': 'Newport News',
}

export function detectCommunity(subject: string, body: string): string | null {
  const text = (subject + ' ' + body).toLowerCase()
  if (text.includes('newport news')) return 'newport-news'
  if (text.includes('virginia beach') || text.includes('vb ') || text.includes(' vb,')) return 'virginia-beach'
  if (text.includes('chesapeake')) return 'chesapeake'
  if (text.includes('norfolk')) return 'norfolk'
  if (text.includes('suffolk')) return 'suffolk'
  if (text.includes('hampton')) return 'hampton'
  return null
}

export function detectPeriod(subject: string, body: string): string {
  const months = [
    'january', 'february', 'march', 'april', 'may', 'june',
    'july', 'august', 'september', 'october', 'november', 'december',
  ]
  const text = (subject + ' ' + body).toLowerCase()
  const yearMatch = text.match(/\b(202[4-9]|203\d)\b/)
  const year = yearMatch ? yearMatch[1] : new Date().getFullYear().toString()
  for (const month of months) {
    if (text.includes(month)) {
      return `${month.charAt(0).toUpperCase() + month.slice(1)} ${year}`
    }
  }
  // Fallback: current month
  return new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

export function buildSlug(community: string, period: string): string {
  return `${community}-${period.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`
}

export async function writeMarketReport(
  emailText: string,
  community: string,
  period: string
): Promise<MarketReportContent> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const communityName = COMMUNITY_NAMES[community] ?? community

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2500,
    messages: [
      {
        role: 'user',
        content: `You are writing a monthly real estate market report for Legacy Home Search, a real estate team led by Barry Jenkins in Hampton Roads, Virginia. Barry has been a licensed agent for 20+ years and his team sells around 900 homes per year. He lives and works in this market and knows it extremely well.

COMMUNITY: ${communityName}
REPORT PERIOD: ${period}

ALTOS RESEARCH DATA (raw email content):
${emailText.slice(0, 4000)}

Your job:
1. Extract the key market metrics from the Altos data above
2. Write a complete market report in Barry's voice

VOICE & TONE:
- Barry is a trusted local expert, not a salesperson
- Plain English — no jargon, no buzzwords, no fluff
- Every claim is tied to a specific number from the data
- Confident and direct — he's seen every market cycle in this area for two decades
- NOT salesy — zero "call us today!" energy in the report sections
- Reads like advice from a knowledgeable friend, not a marketing brochure

AUDIENCE: Ordinary Hampton Roads homeowners, first-time buyers, and local investors.

Return a JSON object with EXACTLY these fields:

{
  "medianListPrice": "e.g. $389,000 — if not found in data, write 'Data pending'",
  "medianPriceChange": "e.g. +2.3% vs March — if not found, write 'See full Altos data below'",
  "daysOnMarket": "e.g. 18 days median — if not found, write 'See full Altos data below'",
  "activeInventory": "e.g. 312 active listings — if not found, write 'See full Altos data below'",
  "inventoryChange": "e.g. -8% vs last month — if not found, write 'See full Altos data below'",
  "priceReductions": "e.g. 14% of listings reduced — if not found, write 'See full Altos data below'",
  "marketSummary": "2-3 sentences. What is the overall state of the ${communityName} market this month? Summarize the most important trend and what's driving it.",
  "buyerSection": "3-4 sentences for buyers. What does this month's data mean for someone looking to buy in ${communityName} right now? Cover: competition level, whether to act now or wait, negotiation position, anything specific they should know. Anchor to the numbers.",
  "sellerSection": "3-4 sentences for sellers. What does this data mean for someone listing their ${communityName} home? Cover: pricing strategy, expected days to sell, leverage position, what they need to do to get top dollar.",
  "investorSection": "3-4 sentences for investors. What's the opportunity (or risk) in ${communityName} this month? Cover: price trajectory, rental demand signals, appreciation outlook, where the value is or isn't.",
  "barrysTake": "3-4 sentences in first person as Barry. This is his unfiltered read on the ${communityName} market this month — drawing on 20 years of seeing these cycles play out locally. Should feel personal, specific to Hampton Roads, and honest. Not a call to action.",
  "metaTitle": "SEO title under 60 chars, e.g. '${communityName} Real Estate Market Report — ${period}'",
  "metaDescription": "SEO description 120-155 chars covering the market state, buyers, sellers, and the month/area"
}

Return ONLY valid JSON. No markdown fences, no preamble.`,
      },
    ],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text.trim() : '{}'
  // Strip any accidental markdown fences
  const cleaned = text.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim()
  const data = JSON.parse(cleaned)

  return {
    communityName,
    reportPeriod: period,
    medianListPrice: data.medianListPrice ?? 'See Altos data below',
    medianPriceChange: data.medianPriceChange ?? '',
    daysOnMarket: data.daysOnMarket ?? '',
    activeInventory: data.activeInventory ?? '',
    inventoryChange: data.inventoryChange ?? '',
    priceReductions: data.priceReductions ?? '',
    marketSummary: data.marketSummary ?? '',
    buyerSection: data.buyerSection ?? '',
    sellerSection: data.sellerSection ?? '',
    investorSection: data.investorSection ?? '',
    barrysTake: data.barrysTake ?? '',
    metaTitle: data.metaTitle ?? `${communityName} Market Report — ${period}`,
    metaDescription: data.metaDescription ?? '',
  }
}
