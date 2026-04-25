/**
 * Seeds 3 test IdeaCandidate objects into the idea queue for UI testing.
 * Run: npx tsx --env-file=.env.local scripts/seed-ideas.ts
 */
import { saveIdea } from '../lib/idea-store'
import type { IdeaCandidate } from '../lib/types'

const weekId = new Date().toISOString().slice(0, 10)

const testIdeas: IdeaCandidate[] = [
  {
    id: `test-research-${weekId}-1`,
    weekId,
    source: 'daily-research',
    title: 'Virginia Beach Property Values Are Up 8% — What It Means for Homeowners Right Now',
    angle: 'Property values in Virginia Beach have risen 8% year-over-year according to the latest Altos Research data. This piece breaks down which neighborhoods are driving the gains and what homeowners should know before making any equity decisions.',
    whyItMatters: 'Hampton Roads homeowners are sitting on significantly more equity than a year ago, and understanding where that value is concentrated can inform refinancing, selling, or investment decisions. Military families approaching PCS orders especially need this data.',
    category: 'market-update',
    audiences: ['homeowner', 'seller', 'investor'],
    contentType: 'Market Update',
    urgency: 'timely',
    score: {
      total: 82,
      localRelevance: 24,
      timeliness: 16,
      formatFit: 12,
      audienceValue: 13,
      sourceCredibility: 8,
      novelty: 7,
      seoPotential: 2,
    },
    sourceUrls: ['https://altosresearch.com'],
    sourceDomains: ['altosresearch.com'],
    sourceLabels: ['Market Data'],
    researchData: 'Virginia Beach median home prices reached $385,000 in Q1 2026, up 8.2% year-over-year. Days on market averaged 22 days, down from 31 a year ago. Inventory remains tight at 1.4 months supply.',
    targetKeyword: 'Virginia Beach property values 2026',
    cityTarget: 'Virginia Beach',
    status: 'pending',
    createdAt: new Date().toISOString(),
  },
  {
    id: `test-renick-${weekId}-2`,
    weekId,
    source: 'renick-pattern',
    title: 'What Does It Actually Cost to Buy a Home in Hampton Roads in 2026?',
    angle: 'A full cost breakdown — down payment, closing costs, inspection, insurance, and first-year costs — specific to Hampton Roads prices and Virginia-specific fees. The kind of post buyers bookmark and share.',
    whyItMatters: 'Most buyers underestimate total purchase costs by 20-30%. With Hampton Roads prices and Virginia-specific closing cost structures, the real number surprises first-timers. This post demystifies it with local data.',
    category: 'cost-breakdown',
    audiences: ['buyer'],
    contentType: 'Cost Breakdown',
    urgency: 'evergreen',
    score: {
      total: 78,
      localRelevance: 20,
      timeliness: 10,
      formatFit: 15,
      audienceValue: 14,
      sourceCredibility: 8,
      novelty: 8,
      seoPotential: 3,
    },
    sourceUrls: ['https://blog.teamrenick.com/blog-effectiveness-dashboard/'],
    sourceDomains: ['blog.teamrenick.com'],
    sourceLabels: ['Effectiveness Dashboard'],
    renickTitle: 'What Does it Cost to Buy a Home in Sarasota in 2026?',
    renickLift: '+430%',
    renickPattern: 'Cost Breakdown',
    researchData: 'Virginia average closing costs: 2-5% of purchase price. In Hampton Roads, median purchase price $385K means $7,700-$19,250 in closing costs. VA loans: 0% down but 2.15% funding fee. Conventional: 3-20% down. Home inspection avg $400-600. Flood insurance required for Zone AE properties.',
    targetKeyword: 'cost to buy a home Hampton Roads 2026',
    cityTarget: 'Hampton Roads',
    status: 'pending',
    createdAt: new Date().toISOString(),
  },
  {
    id: `test-research-${weekId}-3`,
    weekId,
    source: 'daily-research',
    title: 'Norfolk Flood Zone Maps Are Being Redrawn — Here\'s What Homeowners Need to Know',
    angle: 'FEMA is updating flood zone designations across Norfolk in 2026. Thousands of properties will see their flood insurance requirements change, affecting both current homeowners and buyers evaluating Norfolk neighborhoods.',
    whyItMatters: 'Norfolk has the fastest rate of land subsidence on the East Coast, and new FEMA maps will pull more properties into mandatory flood insurance zones. For buyers and existing homeowners, understanding these changes could mean thousands of dollars in annual costs.',
    category: 'flood-and-risk',
    audiences: ['homeowner', 'buyer', 'investor'],
    contentType: 'Flood Risk',
    urgency: 'timely',
    score: {
      total: 88,
      localRelevance: 25,
      timeliness: 18,
      formatFit: 14,
      audienceValue: 14,
      sourceCredibility: 10,
      novelty: 5,
      seoPotential: 2,
    },
    sourceUrls: ['https://fema.gov'],
    sourceDomains: ['fema.gov'],
    sourceLabels: ['Federal Government'],
    researchData: 'FEMA is conducting a coastal flood study for Norfolk, updating FIRMs (Flood Insurance Rate Maps). Norfolk has subsided 1-2mm per year for decades. Properties in Zone AE require flood insurance for federally backed mortgages. Average flood insurance cost in Hampton Roads: $900-$2,400/year.',
    targetKeyword: 'Norfolk flood zone map 2026',
    cityTarget: 'Norfolk',
    status: 'pending',
    createdAt: new Date().toISOString(),
  },
]

async function main() {
  console.log('Seeding test ideas into idea queue...')
  for (const idea of testIdeas) {
    await saveIdea(idea)
    console.log(`  ✓ [${idea.score.total}] ${idea.title}`)
  }
  console.log('\nDone. Visit /admin/idea-review to see them.')
}

main().catch(console.error)
