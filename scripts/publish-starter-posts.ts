/**
 * One-time script: publish 10 high-performing blog post types adapted for Hampton Roads.
 * Modeled after the top-performing post categories from a comparable real estate blog.
 *
 * Run: npx tsx --env-file=.env.local scripts/publish-starter-posts.ts
 */

import { getSanityWriteClient } from '../lib/sanity-write'
import type { PortableTextBlock, PortableTextSpan } from '../lib/types'

// ─── Portable Text helpers ───────────────────────────────────────────────────

let keyCounter = 0
const k = () => `k${++keyCounter}`

function span(text: string, marks: string[] = []): PortableTextSpan {
  return { _type: 'span', _key: k(), text, marks }
}

function p(...texts: (string | PortableTextSpan)[]): PortableTextBlock {
  const children: PortableTextSpan[] = texts.map((t) =>
    typeof t === 'string' ? span(t) : t
  )
  return { _type: 'block', _key: k(), style: 'normal', markDefs: [], children }
}

function h2(text: string): PortableTextBlock {
  return { _type: 'block', _key: k(), style: 'h2', markDefs: [], children: [span(text)] }
}

function h3(text: string): PortableTextBlock {
  return { _type: 'block', _key: k(), style: 'h3', markDefs: [], children: [span(text)] }
}

function bold(text: string): PortableTextSpan {
  return span(text, ['strong'])
}

const CTA: PortableTextBlock[] = [
  h2('Ready to Make Your Move?'),
  p(
    "Whether you're buying, selling, or just getting your bearings in this market — I'd love to help. " +
    "I'm Barry Jenkins, REALTOR\u00ae serving Virginia Beach and the greater Hampton Roads area. " +
    'Let me show you what this market can do for you.'
  ),
  p('📞 Call or text: 757-919-8874 | 🌐 legacyhometeamlpt.com'),
]

// ─── Post definitions ────────────────────────────────────────────────────────

interface PostDef {
  title: string
  slug: string
  category: string
  excerpt: string
  metaTitle: string
  metaDescription: string
  body: PortableTextBlock[]
}

const posts: PostDef[] = [
  // ─── 1. Buyer Closing Costs ──────────────────────────────────────────────
  {
    title: 'What Are Typical Closing Costs for Virginia Home Buyers?',
    slug: 'typical-closing-costs-virginia-home-buyers',
    category: 'buying-tips',
    excerpt:
      'Closing costs in Virginia typically run 2–5% of the purchase price for buyers. Here\'s exactly what you\'ll pay — and a few ways to reduce it.',
    metaTitle: 'Closing Costs for Virginia Home Buyers in 2026 | Legacy Home Search',
    metaDescription:
      'Buying a home in Virginia Beach or Hampton Roads? Here are the typical closing costs buyers pay in 2026, from loan fees to title insurance.',
    body: [
      p(
        "Buying a home in Hampton Roads is exciting — until you see the closing disclosure for the first time. " +
        "Between lender fees, title insurance, and prepaid items, buyers in Virginia typically pay between ",
        bold('2% and 5%'),
        " of the purchase price in closing costs, on top of their down payment. On a $375,000 home (close to the current Hampton Roads median), that's roughly $7,500 to $18,750."
      ),
      p(
        "The good news: a lot of this is negotiable, some of it is a one-time cost that protects you for as long as you own the home, " +
        "and there are programs specifically designed to help buyers reduce the cash they need at closing."
      ),
      h2("What You'll Pay: The Typical Line Items"),
      h3('Lender Fees'),
      p(
        "Loan origination fees, underwriting, and processing typically run ",
        bold("0.5% to 1%"),
        " of the loan amount. On a $350,000 loan, that's $1,750 to $3,500. Some lenders offer 'no-origination-fee' loans in exchange for a slightly higher interest rate — worth comparing if you're tight on cash at closing."
      ),
      h3('Appraisal'),
      p(
        "Your lender will require an independent appraisal to confirm the home is worth what you're paying. In Hampton Roads, appraisals typically run ",
        bold("$500–$700"),
        ". You pay this upfront, usually before closing."
      ),
      h3('Home Inspection'),
      p(
        "Not technically a closing cost, but plan for ",
        bold("$400–$600"),
        " for a standard home inspection. For older homes or properties with a well and septic, budget more. This is paid directly to the inspector, typically before closing."
      ),
      h3('Title Search and Title Insurance'),
      p(
        "Title insurance protects you (and your lender) if a title problem surfaces after closing — a prior lien, a clerical error in public records, or an heir with an undisclosed claim. In Virginia, buyers pay for the lender's title insurance policy; owners' title insurance is optional but strongly recommended. Combined title fees typically run ",
        bold("$1,200–$2,500"),
        " depending on purchase price."
      ),
      h3('Recording Fees and Transfer Taxes'),
      p(
        "Virginia charges a deed recordation tax of ",
        bold("$0.25 per $100 of purchase price"),
        ", typically split between buyer and seller. Recording fees for the deed and deed of trust run $75–$150 through the city clerk's office."
      ),
      h3('Prepaid Items'),
      p(
        "Prepaid items aren't fees — they're costs you're paying ahead of time. Expect to prepay: " +
        "(1) homeowners insurance (first year's premium, typically $1,200–$2,000 in coastal Virginia), " +
        "(2) 2–3 months of property taxes into escrow, and (3) prepaid mortgage interest from closing date to month-end. " +
        "Together, prepaids often add up to $3,000–$6,000 on a typical Hampton Roads purchase."
      ),
      h2("How to Reduce What You Pay at Closing"),
      p(
        "Three legitimate ways buyers lower their closing costs in this market:"
      ),
      p(
        bold("1. Negotiate seller concessions."),
        " In a balanced or buyer-friendly market, you can ask the seller to contribute toward your closing costs as part of the offer. In Hampton Roads, seller concessions of 2–3% are common, especially on homes that have been sitting. This rolls your costs into the deal rather than coming out of pocket."
      ),
      p(
        bold("2. Use VHDA programs."),
        " Virginia Housing (formerly VHDA) offers down payment and closing cost assistance for first-time buyers who meet income limits. The Down Payment Assistance Grant doesn't have to be repaid — it's worth checking eligibility before you write your first offer."
      ),
      p(
        bold("3. Shop lenders."),
        " Closing costs vary significantly by lender. Getting three loan estimates takes about an hour and can save you $1,500–$3,000. Compare the Loan Estimate (the standardized three-page form every lender is required to give you) side by side."
      ),
      ...CTA,
    ],
  },

  // ─── 2. Seller Commissions ───────────────────────────────────────────────
  {
    title: 'What Do Sellers Pay in Virginia Real Estate Commissions?',
    slug: 'virginia-real-estate-commissions-sellers',
    category: 'selling-tips',
    excerpt:
      'The NAR settlement changed how commissions work. Here\'s what Virginia Beach sellers actually pay in 2026 — and how to negotiate it.',
    metaTitle: 'Real Estate Commission for Virginia Sellers in 2026 | Legacy Home Search',
    metaDescription:
      'How much do home sellers pay in real estate commissions in Virginia? The NAR settlement changed the rules in 2024. Here\'s what Hampton Roads sellers need to know.',
    body: [
      p(
        "August 2024 changed real estate commissions nationally — and the changes affected how sellers and buyers in Virginia Beach and Hampton Roads negotiate. " +
        "If you're selling a home in 2026 and haven't looked at how commissions work lately, this is worth five minutes of your time."
      ),
      h2("How Commission Works Now (Post-NAR Settlement)"),
      p(
        "Before August 2024, sellers typically offered a total commission (often 5–6%) that covered both the listing agent and the buyer's agent. " +
        "The buyer's agent's share was advertised on MLS as an incentive to cooperate. That practice ended."
      ),
      p(
        "Today, buyer's agent compensation is negotiated directly between the buyer and their agent, not offered by the seller through MLS. " +
        "Sellers are ",
        bold("no longer required to offer buyer's agent compensation"),
        " — but can still choose to as a seller concession, and often do to attract more buyers."
      ),
      h2("What Virginia Beach Sellers Are Actually Paying in 2026"),
      h3("Listing Agent Commission"),
      p(
        "The listing agent's commission — what you pay the agent who markets and sells your home — is fully negotiable. " +
        "In Hampton Roads, listing commissions typically range from ",
        bold("2.5% to 3%"),
        " of the sale price. On a $400,000 home, that's $10,000 to $12,000."
      ),
      h3("Buyer's Agent Compensation (Optional, But Strategic)"),
      p(
        "Even though it's no longer required, many sellers in competitive Hampton Roads submarkets are still offering ",
        bold("2% to 2.5%"),
        " toward buyer's agent compensation as a concession — because it expands the buyer pool and signals goodwill. " +
        "Buyers who can't afford to pay their agent out of pocket simply won't make offers on homes where it isn't offered."
      ),
      p(
        "Think of it this way: if 30% of buyers in your price range need seller help with buyer's agent fees, refusing to offer it eliminates 30% of your offers before they're written."
      ),
      h3("Total Commission Range"),
      p(
        "For a typical Hampton Roads home sale in 2026, sellers who choose to offer buyer's agent compensation effectively pay a total of ",
        bold("4.5% to 5.5%"),
        " in agent compensation. For comparison, pre-settlement totals were typically 5% to 6%. " +
        "Some sellers are saving 0.5–1% — though it varies widely by situation."
      ),
      h2("Other Seller Costs Beyond Commission"),
      p(
        "Commission is the biggest line item, but not the only one. Virginia sellers also pay:"
      ),
      p(
        bold("Grantor's tax:"),
        " Virginia imposes a grantor's tax of $0.50 per $500 of the sale price ($1.00 per $500 in Northern Virginia, but Hampton Roads uses the standard rate). On a $400,000 sale, that's $400."
      ),
      p(
        bold("Settlement/closing fees:"),
        " The title company charges a settlement fee, typically $350–$500, to conduct the closing and disburse funds."
      ),
      p(
        bold("Deed preparation:"),
        " $100–$200."
      ),
      p(
        bold("Prorated property taxes:"),
        " You'll owe your share of property taxes up to closing day, prorated from January 1."
      ),
      p(
        bold("Repairs from inspection:"),
        " Negotiated case-by-case. Budget 0–2% of the sale price depending on your home's condition and what buyers request."
      ),
      h2("The Bottom Line for Virginia Sellers"),
      p(
        "Total seller costs in Hampton Roads — including commission, taxes, fees, and typical concessions — run roughly ",
        bold("6% to 9%"),
        " of the sale price. On a $400,000 home, expect to net between $364,000 and $376,000 before paying off your mortgage. " +
        "A seller net sheet will calculate your exact proceeds based on your specific situation."
      ),
      p(
        "Want a free net sheet for your home? I can pull your estimated proceeds in about five minutes with the current market comps."
      ),
      ...CTA,
    ],
  },

  // ─── 3. Seller Closing Costs ─────────────────────────────────────────────
  {
    title: 'How Much Are Closing Costs for Hampton Roads Home Sellers?',
    slug: 'closing-costs-hampton-roads-home-sellers',
    category: 'selling-tips',
    excerpt:
      'Beyond commission, Hampton Roads sellers pay grantor\'s tax, settlement fees, and prorated taxes. Here\'s the complete breakdown.',
    metaTitle: 'Hampton Roads Seller Closing Costs in 2026 | Legacy Home Search',
    metaDescription:
      'What closing costs do home sellers pay in Virginia Beach, Chesapeake, and Hampton Roads? A complete line-by-line breakdown for 2026.',
    body: [
      p(
        "Most sellers in Hampton Roads focus on the offer price — and miss the line items between 'accepted offer' and 'final check.' " +
        "Closing costs for sellers in Virginia are real, they add up, and knowing them before you list means no surprises on closing day."
      ),
      p(
        "The short answer: beyond real estate commission (covered separately), Virginia sellers pay a handful of required fees that typically total ",
        bold("1% to 2%"),
        " of the sale price on their own. Combined with commission, total seller-side costs in Hampton Roads run 6–9%."
      ),
      h2("Required Closing Costs for Virginia Sellers"),
      h3("Virginia Grantor's Tax"),
      p(
        "This is the state's share of the transaction. Virginia charges the seller $0.50 per $500 of the sale price. " +
        "On a $375,000 home, that's ",
        bold("$375"),
        ". It's modest, but it's required. (Note: if you're selling in Northern Virginia, the rate doubles — but Hampton Roads sellers pay the standard rate.)"
      ),
      h3("City/County Transfer Tax"),
      p(
        "Some Hampton Roads cities add a local transfer tax. Virginia Beach, Chesapeake, and other cities in the region typically share the deed recordation tax with the buyer. " +
        "Budget approximately ",
        bold("$200–$500"),
        " for the seller's portion of recordation fees depending on city and sale price."
      ),
      h3("Settlement Fee (Title Company)"),
      p(
        "The settlement agent (title company) conducts the closing, prepares the settlement statement, and disburses funds to all parties. " +
        "In Hampton Roads, settlement fees typically run ",
        bold("$350–$600"),
        " for the seller. Virginia is not an attorney-required state — title companies handle the majority of residential closings."
      ),
      h3("Deed Preparation"),
      p(
        "The title company or an attorney prepares the deed that transfers ownership to the buyer. Cost: typically ",
        bold("$100–$250"),
        "."
      ),
      h3("Mortgage Payoff Fees"),
      p(
        "If you have a mortgage on the property, your lender will charge a payoff statement fee (typically $25–$50) and a reconveyance fee to release the lien (~$50–$150). " +
        "You'll also owe a daily per-diem interest rate from your last payment date to closing."
      ),
      h3("Prorated Property Taxes"),
      p(
        "You owe property taxes for every day you owned the home in the current tax year. The buyer receives a credit at closing for your portion. " +
        "In Virginia Beach, the tax rate is ",
        bold("$1.012 per $100"),
        " of assessed value. On a $375,000 home, that's roughly $3,795/year — about $10.40 per day. " +
        "If you close in April, expect to credit the buyer for roughly $1,000–$1,300 in prorated taxes."
      ),
      h2("Optional Costs That Often Come Up"),
      p(
        bold("Repair credits or concessions."),
        " After the home inspection, buyers often request repairs or a credit. This is fully negotiable, but budgeting 0–2% for credits is prudent on older homes."
      ),
      p(
        bold("Home warranty."),
        " Many sellers offer a one-year home warranty ($400–$700) to give buyers confidence and reduce post-closing disputes. Not required, but common in Hampton Roads."
      ),
      p(
        bold("Staging or pre-listing repairs."),
        " Not a closing cost, but worth factoring into your net. A $2,000 paint job and carpet cleaning often returns several times that in final sale price."
      ),
      h2("What Your Net Proceeds Will Look Like"),
      p(
        "On a $400,000 Hampton Roads home sale, here's a rough seller cost summary excluding commission:"
      ),
      p("Grantor's tax: ~$400"),
      p("Settlement/deed fees: ~$700"),
      p("Prorated taxes (closing in April): ~$1,200"),
      p("Mortgage payoff fees: ~$200"),
      p("Total (non-commission): ~$2,500"),
      p(
        "Add in typical total commission (5–5.5%): ~$20,000–$22,000, and your total selling costs come to approximately $22,500–$24,500 — leaving you with roughly ",
        bold("$375,000–$377,500"),
        " before paying off your mortgage."
      ),
      p(
        "Want an exact number? I can run a seller net sheet for your specific home, price, and city in about five minutes."
      ),
      ...CTA,
    ],
  },

  // ─── 4. Full Cost to Sell in VB ──────────────────────────────────────────
  {
    title: 'What Does It Cost to Sell a House in Virginia Beach?',
    slug: 'cost-to-sell-house-virginia-beach',
    category: 'selling-tips',
    excerpt:
      'Selling in Virginia Beach costs 6–9% of the sale price when you add up commission, closing costs, and repairs. Here\'s the full picture.',
    metaTitle: 'Cost to Sell a Home in Virginia Beach 2026 | Legacy Home Search',
    metaDescription:
      'What does it really cost to sell a house in Virginia Beach? Commission, closing costs, repairs, and staging — the full breakdown for 2026.',
    body: [
      p(
        "Virginia Beach home values hit a new high in 2025 — up 4.17% year-over-year, more than double the national average. " +
        "If you've owned your home for five years or more, you've built serious equity. But before you count your proceeds, it helps to know exactly what it costs to turn that equity into cash."
      ),
      h2("The Full Cost of Selling a Virginia Beach Home"),
      h3("Real Estate Commission"),
      p(
        "Commission is your largest cost. Post-NAR settlement, listing agents in Virginia Beach typically charge ",
        bold("2.5% to 3%"),
        " to market and sell your home. Many sellers also offer ",
        bold("2% to 2.5%"),
        " toward buyer's agent compensation as a concession — expanding the buyer pool and increasing competition for your home."
      ),
      p(
        "Total commission range: ",
        bold("4.5% to 5.5%"),
        " of the sale price. On a $425,000 home — near the current Virginia Beach median — that's $19,125 to $23,375."
      ),
      h3("Virginia Grantor's Tax"),
      p(
        "Virginia charges sellers $0.50 per $500 of the sale price. On a $425,000 sale: ",
        bold("$425"),
        "."
      ),
      h3("Settlement Fees"),
      p(
        "Title company settlement fee, deed prep, and recordation: approximately ",
        bold("$700–$1,000"),
        " for the seller's portion."
      ),
      h3("Prorated Property Taxes"),
      p(
        "Virginia Beach's property tax rate is $1.012 per $100 of assessed value. On a $425,000 home: roughly $4,300/year. " +
        "If you close in the middle of the year, expect to credit the buyer about $2,150 in prorated taxes — though the exact amount depends on your closing date."
      ),
      h3("Mortgage Payoff"),
      p(
        "Your existing mortgage is paid off at closing from the proceeds. This isn't a cost per se, but it reduces your net check. " +
        "Expect $100–$250 in lender payoff and reconveyance fees."
      ),
      h3("Pre-Sale Preparation Costs"),
      p(
        "These aren't closing costs, but they directly affect your final sale price — and skipping them often costs more than spending them:"
      ),
      p(
        bold("Deep cleaning and declutter:"),
        " $300–$600."
      ),
      p(
        bold("Paint touch-ups or full interior repaint:"),
        " $1,500–$4,000 depending on scope. Fresh neutral paint consistently returns 2–3x its cost."
      ),
      p(
        bold("Landscaping refresh:"),
        " $300–$800. First impressions matter — especially in Virginia Beach where outdoor living is a selling point."
      ),
      p(
        bold("Minor repairs:"),
        " Budget $500–$2,000 for items that will show up on inspection — leaky faucets, HVAC filters, caulking, smoke detectors."
      ),
      h3("Repair Credits After Inspection"),
      p(
        "After the buyer's inspection, you may receive a repair request. In Hampton Roads, repair credits of ",
        bold("$1,000–$5,000"),
        " are common on homes priced below $500,000. You can negotiate whether to make the repairs or offer a cash credit at closing."
      ),
      h2("Full-Picture Cost Summary: $425,000 Virginia Beach Home"),
      p("Commission (5%): $21,250"),
      p("Grantor's tax + closing fees: $1,300"),
      p("Prorated taxes: $2,150"),
      p("Pre-sale prep: $3,000"),
      p("Inspection credits: $2,000"),
      p(bold("Total estimated costs: ~$29,700 (7.0%)")),
      p(
        bold("Estimated net at closing: ~$395,300"),
        " — before paying off your mortgage balance."
      ),
      h2("One More Number Worth Knowing"),
      p(
        "Hampton Roads home values rose 4.17% in 2025. If you bought a $375,000 home five years ago, it's worth roughly $450,000–$475,000 today. " +
        "Even after selling costs, you're likely looking at significant equity — especially if you've been paying down your mortgage. " +
        "The question isn't whether selling makes financial sense. It's whether now is the right time for you."
      ),
      ...CTA,
    ],
  },

  // ─── 5. Cost to Buy in VB ────────────────────────────────────────────────
  {
    title: 'What Does It Cost to Buy a Home in Virginia Beach in 2026?',
    slug: 'cost-to-buy-home-virginia-beach-2026',
    category: 'buying-tips',
    excerpt:
      'Beyond the purchase price, buying in Virginia Beach means closing costs, a down payment, and ongoing ownership costs. Here\'s what to budget.',
    metaTitle: 'Full Cost to Buy a Home in Virginia Beach 2026 | Legacy Home Search',
    metaDescription:
      'What does it actually cost to buy a home in Virginia Beach in 2026? Down payment, closing costs, inspections, and first-year ownership — all in one place.',
    body: [
      p(
        "The listing price is just the starting number. Buying a home in Virginia Beach in 2026 involves a down payment, closing costs, prepaid items, moving expenses, and early ownership costs — all of which most first-time buyers underestimate. " +
        "Here's a clear, honest breakdown of what to budget before you start your search."
      ),
      h2("The Virginia Beach Market Right Now"),
      p(
        "Virginia Beach home values rose 4.17% in 2025 — more than double the national average of 1.7%. " +
        "The median home price in Virginia Beach is currently in the $400,000–$430,000 range. " +
        "Inventory remains tight, and well-priced homes in desirable zip codes are still moving quickly. " +
        "The good news: unlike coastal markets in Florida or California, Virginia Beach remains genuinely attainable for families and first-time buyers."
      ),
      h2("Upfront Costs: What You Need at Closing"),
      h3("Down Payment"),
      p(
        "Down payment requirements vary by loan type:"
      ),
      p(
        bold("VA Loan (0% down):"),
        " Hampton Roads has one of the highest concentrations of active-duty military and veterans in the country. If you're eligible, a VA loan is the most powerful tool available — no down payment, no PMI, competitive rates."
      ),
      p(
        bold("FHA Loan (3.5% down):"),
        " On a $400,000 home, that's $14,000. FHA loans have more flexible credit requirements and are popular with first-time buyers."
      ),
      p(
        bold("Conventional 5% down:"),
        " $20,000 on a $400,000 home. Requires PMI until you reach 20% equity."
      ),
      p(
        bold("Conventional 20% down:"),
        " $80,000. Eliminates PMI and gives you the cleanest offer in a competitive situation."
      ),
      h3("Closing Costs"),
      p(
        "Virginia buyers typically pay ",
        bold("2–5% of the purchase price"),
        " in closing costs. On a $400,000 home, that's $8,000–$20,000. Main line items: lender fees (origination, underwriting), appraisal ($500–$700), home inspection ($400–$600), title insurance and settlement fees ($1,500–$2,500), recording fees, and prepaid items (homeowners insurance, property taxes, prepaid interest)."
      ),
      p(
        "Two ways to reduce this: (1) negotiate seller concessions toward closing costs as part of your offer, and (2) check VHDA down payment assistance programs if you're a first-time buyer."
      ),
      h3("Home Inspection"),
      p(
        "Plan for $400–$600 for a standard inspection. Add $150–$250 for a radon test (worth doing in Hampton Roads), $300–$500 for a pest/termite inspection, and $400–$700 if the home has a well or septic. " +
        "These are paid directly to inspectors, typically before closing."
      ),
      h2("Monthly Ownership Costs"),
      p(
        "Once you're in the home, your monthly cost is more than just the mortgage payment:"
      ),
      h3("Mortgage Payment"),
      p(
        "On a $400,000 home with 5% down and a 30-year conventional loan at ~6.8% interest (April 2026 rates), the principal + interest payment is approximately ",
        bold("$2,470/month"),
        "."
      ),
      h3("Property Taxes"),
      p(
        "Virginia Beach's property tax rate is $1.012 per $100 of assessed value. On a $400,000 home: ",
        bold("$4,048/year ($337/month)"),
        ". This is typically escrowed into your monthly mortgage payment."
      ),
      h3("Homeowners Insurance"),
      p(
        "Coastal Virginia homeowners insurance runs $1,200–$2,200/year depending on proximity to water, flood zone, and home age. Budget $100–$180/month. " +
        "If your home is in a flood zone, flood insurance through NFIP or a private carrier is additional — typically $500–$1,500/year."
      ),
      h3("PMI (if applicable)"),
      p(
        "If you put down less than 20% on a conventional loan, expect to pay PMI of approximately 0.5–1% of the loan per year. On a $380,000 loan, that's roughly $158–$317/month, which drops off once you reach 20% equity."
      ),
      h2("Total First-Year Budget: $400,000 Virginia Beach Home"),
      p(bold("One-time at purchase:")),
      p("Down payment (5%): $20,000"),
      p("Closing costs (~3%): $12,000"),
      p("Inspection fees: $1,200"),
      p("Moving expenses: $1,500–$3,000"),
      p(bold("Total upfront: ~$34,700–$36,200")),
      p(bold("Monthly housing costs:")),
      p("Mortgage P+I: $2,470"),
      p("Property taxes: $337"),
      p("Homeowners insurance: $150"),
      p("PMI: $200"),
      p(bold("Total monthly: ~$3,157")),
      p(
        "High? Maybe on paper. But consider: renting a comparable 3-bedroom home in Virginia Beach currently runs $2,400–$2,800/month — with zero equity building, zero tax benefits, and no protection from annual rent increases."
      ),
      ...CTA,
    ],
  },

  // ─── 6. Sellers + Appraisals ────────────────────────────────────────────
  {
    title: 'What Do Hampton Roads Home Sellers Need to Know About Appraisals?',
    slug: 'hampton-roads-sellers-appraisal-guide',
    category: 'selling-tips',
    excerpt:
      'The buyer\'s lender orders an appraisal after your home goes under contract. Here\'s how it works, what can go wrong, and how to prepare.',
    metaTitle: 'Home Appraisals for Hampton Roads Sellers | Legacy Home Search',
    metaDescription:
      'Selling a home in Virginia Beach or Hampton Roads? Here\'s everything sellers need to know about the appraisal process in 2026.',
    body: [
      p(
        "You've accepted an offer, you're under contract, and things are moving along — then the buyer's lender orders an appraisal. " +
        "For many sellers, this is the part of the transaction that feels most out of their control. " +
        "Here's how appraisals actually work, what sellers can do to prepare, and what to do if the number comes in lower than your contract price."
      ),
      h2("Why Lenders Order Appraisals"),
      p(
        "When a buyer takes out a mortgage, the lender is advancing money secured by the property. " +
        "Before lending $380,000 on a home, the bank wants independent confirmation that the home is actually worth $380,000. " +
        "That's what an appraisal does — a licensed, independent appraiser evaluates the property and delivers a formal opinion of value."
      ),
      p(
        "The appraiser is hired by the lender (not the buyer), assigned through an appraisal management company to ensure independence, and follows strict guidelines. " +
        "They're not there to negotiate on anyone's behalf. They're there to protect the lender from lending more than the collateral is worth."
      ),
      h2("What Appraisers Look At in Hampton Roads"),
      p(
        "The appraiser will visit the home for a physical inspection, typically lasting 30–60 minutes. They'll note:"
      ),
      p("Square footage, lot size, bedroom and bathroom count, age and condition"),
      p("Upgrades: kitchen, bathrooms, HVAC, roof, windows"),
      p("Condition issues: deferred maintenance, water damage, outdated systems"),
      p("Location factors: proximity to military bases, noise corridors, flood zones"),
      p(
        "Then they pull comparable sales (comps) — homes similar to yours that sold in the last 3–6 months, ideally within a mile or two. " +
        "In Hampton Roads, recent comps are generally strong: values appreciated 4.17% in 2025, and the market has maintained healthy activity through 2026."
      ),
      h2("How Sellers Can Prepare"),
      p(
        "You can't tell the appraiser what value to assign — but you can make their job easier and reduce the risk of a low appraisal:"
      ),
      p(
        bold("Have comps ready."),
        " Prepare a list of recent sales in your neighborhood that support your price, especially any sales your agent isn't sure the appraiser will find. If a comp is strong but technically outside the typical search radius, flag it."
      ),
      p(
        bold("Document upgrades."),
        " Create a one-page summary of improvements made since purchase: new roof, HVAC system, kitchen remodel, added square footage, etc. With costs and dates. Appraisers can use this to justify higher adjustments."
      ),
      p(
        bold("Be present (or have your agent there)."),
        " You or your agent can point out features the appraiser might otherwise miss — the custom built-ins, the high-end appliances, the brand-new tankless water heater."
      ),
      p(
        bold("Clean and declutter."),
        " Appraisers are supposed to be objective, but condition matters. A clean, well-maintained home signals care. Obvious deferred maintenance triggers downward adjustments."
      ),
      h2("What Happens If the Appraisal Comes In Low"),
      p(
        "If the appraised value comes in below the contract price, the lender will only lend based on the appraised value. " +
        "This creates a gap. You have four options:"
      ),
      p(
        bold("1. Reduce the price"),
        " to the appraised value. The buyer gets what they need; you get less."
      ),
      p(
        bold("2. Challenge the appraisal."),
        " If you have strong comps the appraiser didn't use, your agent can submit a formal reconsideration of value (ROV). Appraisers are sometimes persuaded; sometimes not. Success rate depends on the quality of the alternative comps."
      ),
      p(
        bold("3. Split the difference."),
        " The buyer pays the gap in cash (the difference between appraisal and purchase price) out of pocket. This requires the buyer to have the funds and the willingness."
      ),
      p(
        bold("4. Walk away."),
        " If the buyer had a financing contingency, a failed appraisal is typically a valid exit point. Both parties can walk with the earnest money returned to the buyer."
      ),
      p(
        "In a strong Hampton Roads market with rising values and limited inventory, truly low appraisals are less common — but they do happen, especially on unique properties, fixer-uppers, or in fast-moving submarkets where comps lag actual market prices."
      ),
      ...CTA,
    ],
  },

  // ─── 7. Low Appraisal ───────────────────────────────────────────────────
  {
    title: 'What Happens If the Appraisal Comes In Low in Virginia?',
    slug: 'appraisal-comes-in-low-virginia',
    category: 'buying-tips',
    excerpt:
      'A low appraisal doesn\'t have to kill the deal. Here are your options as a buyer when the appraised value comes in below the contract price.',
    metaTitle: 'Low Appraisal in Virginia: What Buyers Can Do | Legacy Home Search',
    metaDescription:
      "The appraisal came in below the purchase price. Now what? Here are your options as a buyer in Virginia Beach and Hampton Roads in 2026.",
    body: [
      p(
        "You're under contract on a home in Hampton Roads, the inspection went well, and then the appraisal report lands — and the number is lower than what you agreed to pay. " +
        "It's one of the most stressful moments in a real estate transaction. " +
        "Here's what a low appraisal actually means, and what your options are as a buyer."
      ),
      h2("What a Low Appraisal Means"),
      p(
        "When the appraised value comes in below the contract price, your lender has a problem: they agreed to lend based on the assumption that the home was worth the purchase price. " +
        "A $400,000 purchase with 5% down means the lender is advancing $380,000. " +
        "But if the appraisal says the home is worth $380,000, the lender will only advance 95% of $380,000 — which is $361,000. " +
        "Now you have a $19,000 gap."
      ),
      p(
        "This gap doesn't automatically kill the deal. It creates a negotiation point. Here's how buyers typically respond:"
      ),
      h2("Option 1: Request the Seller to Reduce the Price"),
      p(
        "The most common response: go back to the seller and ask them to accept the appraised value as the new purchase price. " +
        "The seller may agree — especially if the market is cooling or their home has been on the market for a while. " +
        "In a tight Hampton Roads market with multiple offers, sellers have more leverage and may decline."
      ),
      h2("Option 2: Pay the Gap Out of Pocket"),
      p(
        "You can choose to pay the difference between the appraised value and the purchase price in cash, on top of your down payment. " +
        "If the appraisal gap is $10,000, you bring an extra $10,000 to closing. " +
        "This requires having the funds — and the confidence that the home is actually worth what you're paying. " +
        "In a rising market, paying slightly above appraised value isn't always irrational: if values are moving up 4%/year, today's 'overpay' may look prescient in 12 months."
      ),
      h2("Option 3: Split the Difference"),
      p(
        "Seller and buyer each give a little. You pay part of the gap; the seller reduces the price by the rest. " +
        "This is often the path of least resistance when both parties genuinely want the deal to close and the gap is manageable (under $10,000)."
      ),
      h2("Option 4: Challenge the Appraisal"),
      p(
        "If you or your agent believes the appraisal missed strong comps or made a factual error, you can request a reconsideration of value (ROV). " +
        "Your agent submits alternative comparable sales, photographs, or data the appraiser may not have considered. " +
        "The appraiser reviews and either revises the value or maintains it. " +
        "ROVs are worth pursuing when you have genuinely compelling comps — not just wishful thinking."
      ),
      h2("Option 5: Walk Away"),
      p(
        "If your purchase contract included a financing contingency (which most do), a low appraisal that can't be resolved typically allows you to exit the contract and get your earnest money back. " +
        "Virginia purchase contracts generally allow buyers to walk if the property doesn't appraise at the agreed purchase price and the parties can't resolve it."
      ),
      h2("How to Protect Yourself Before This Happens"),
      p(
        "A few things your agent should do before the appraisal is ordered:"
      ),
      p(
        bold("Review the comps"),
        " used to justify the offer price. If you paid above recent comps, understand why — and have documentation ready."
      ),
      p(
        bold("Include an appraisal gap clause"),
        " in your offer if you're in a competitive bidding situation. This language commits you to paying a specified amount above the appraised value — it signals strength and helps sellers accept your offer with confidence."
      ),
      p(
        bold("Know the market trend."),
        " In Hampton Roads, values have risen 4.17% in 2025. Fast-rising markets mean comps can lag true value. An appraiser using 6-month-old comps might undervalue a home in a neighborhood that's moved significantly."
      ),
      h2("The Bottom Line"),
      p(
        "A low appraisal is an obstacle, not a dead end. In most cases, buyers and sellers find a way through. " +
        "What matters is having an experienced agent who knows how to respond quickly, negotiate effectively, and protect your interests — whether that means fighting the appraisal or walking away with your deposit intact."
      ),
      ...CTA,
    ],
  },

  // ─── 8. First-Time Buyer Neighborhoods ──────────────────────────────────
  {
    title: 'Best Neighborhoods for First-Time Buyers in Virginia Beach?',
    slug: 'best-neighborhoods-first-time-buyers-virginia-beach',
    category: 'buying-tips',
    excerpt:
      'Virginia Beach has great options for first-time buyers — if you know where to look. Here are the neighborhoods offering the best value in 2026.',
    metaTitle: 'Best Neighborhoods for First-Time Buyers in Virginia Beach | Legacy Home Search',
    metaDescription:
      'First-time buyer in Virginia Beach? These neighborhoods offer the best combination of affordability, access, and long-term value in 2026.',
    body: [
      p(
        "First-time buyers in Virginia Beach face a real challenge: a market that's appreciated steadily, inventory that stays tight, and a wide geographic spread that makes it hard to know which neighborhoods are actually worth buying into. " +
        "Here's a practical look at the areas that deliver the best combination of affordability, access, and long-term value."
      ),
      h2("What 'Best' Means for First-Time Buyers"),
      p(
        "For most first-timers, 'best neighborhood' translates to: homes priced under $400,000, reasonable commute times, low crime, decent schools, and genuine appreciation potential. " +
        "Virginia Beach's geography (it stretches from the Oceanfront to the North Landing area) means there are neighborhoods at almost every price point — you just need to know where they are."
      ),
      h2("Neighborhoods Worth Knowing"),
      h3("Kempsville"),
      p(
        "Kempsville is one of Virginia Beach's most established and approachable areas for buyers under $375,000. " +
        "You'll find solid 3-bedroom, 2-bath ranches and split-levels from the 1970s–90s, often updated, with large lots and mature trees. " +
        "It's centrally located — quick access to I-264 and I-64 means reasonable commute times to virtually anywhere in Hampton Roads. " +
        "School quality is solid, and the neighborhood has the bones of long-term stability."
      ),
      h3("Bayside / Chic's Beach"),
      p(
        "North of the main tourist strip, Bayside and Chic's Beach offer a more relaxed coastal lifestyle at more accessible price points. " +
        "Homes here skew toward the $350,000–$475,000 range with walkable access to the bay. " +
        "It's a strong long-term bet: as Virginia Beach continues to attract remote workers and retirees who want coastal living without Oceanfront prices, Bayside is positioned well."
      ),
      h3("Great Neck (Virginia Beach side)"),
      p(
        "The Great Neck corridor — on the Virginia Beach side of the bridge — offers newer construction and well-regarded schools at prices that are still attainable for first-timers who stretch a bit. " +
        "Expect $375,000–$500,000 for move-in ready homes. The tradeoff is higher price per square foot, but the long-term value case is strong."
      ),
      h3("Princess Anne / Courthouse"),
      p(
        "The area around the VA Beach courthouse and municipal center is underrated for first-time buyers. " +
        "More suburban and less beachy — but that's reflected in the price. You can find newer construction and well-maintained older homes in the $325,000–$425,000 range, " +
        "with good access to the city's commercial corridors and a short drive to the Oceanfront."
      ),
      h2("Beyond Virginia Beach: Chesapeake and Suffolk"),
      p(
        "If Virginia Beach feels stretched, look south and west. "
      ),
      p(
        bold("Chesapeake"),
        " — particularly the Greenbrier and Great Bridge areas — has consistently offered better square footage per dollar than Virginia Beach. " +
        "Highly rated schools, newer construction, and a quieter suburban feel. Median home price currently runs $350,000–$400,000, below Virginia Beach."
      ),
      p(
        bold("North Suffolk"),
        " (the Harbour View corridor) is the region's fastest-growing submarket. New construction, expanding retail, and road infrastructure improvements. " +
        "Entry-level homes start around $325,000, and the area is drawing significant employer investment. " +
        "It's further from the beach, but buyers who prioritize space and value are finding it hard to ignore."
      ),
      h2("Using Available Assistance"),
      p(
        "Virginia Housing (formerly VHDA) offers first-time buyer programs including down payment assistance grants that don't require repayment. " +
        "Combined with a VA loan (if you're eligible) or FHA financing, the upfront cash required to buy in these neighborhoods can be significantly lower than you might expect. " +
        "It's worth getting pre-approved and asking your lender specifically about Virginia Housing programs."
      ),
      p(
        "Hampton Roads is one of the more attainable coastal housing markets in the country. That won't be true forever — but it's still true in 2026."
      ),
      ...CTA,
    ],
  },

  // ─── 9. VB vs Chesapeake ────────────────────────────────────────────────
  {
    title: 'Virginia Beach vs Chesapeake: Which Is Better for Home Buyers?',
    slug: 'virginia-beach-vs-chesapeake-buyers',
    category: 'community-spotlight',
    excerpt:
      'Both cities offer strong value — but they\'re different in important ways. Here\'s a head-to-head comparison for buyers weighing their options.',
    metaTitle: 'Virginia Beach vs Chesapeake for Home Buyers 2026 | Legacy Home Search',
    metaDescription:
      'Trying to decide between Virginia Beach and Chesapeake? Here\'s a data-driven comparison of home prices, schools, growth, and lifestyle in 2026.',
    body: [
      p(
        "Virginia Beach gets most of the headlines in Hampton Roads real estate. But Chesapeake — its larger-by-area neighbor to the south and west — is quietly becoming the market that savvy buyers are targeting in 2026. " +
        "Here's an honest comparison of both cities to help you decide which fits your situation better."
      ),
      h2("Home Prices"),
      h3("Virginia Beach"),
      p(
        "Virginia Beach has a median home price in the ",
        bold("$400,000–$430,000 range"),
        " as of early 2026. Prices rose 4.17% in 2025. Premium neighborhoods near the Oceanfront, Shore Drive, and Great Neck push higher; inland areas like Kempsville and Princess Anne offer more value."
      ),
      h3("Chesapeake"),
      p(
        "Chesapeake's median home price sits in the ",
        bold("$350,000–$390,000 range"),
        " — meaningfully below Virginia Beach. For the same dollar amount, buyers typically get larger lots, more square footage, and often newer construction. " +
        "Chesapeake has been growing steadily and is seeing its own price appreciation — values have risen alongside the region's overall 4%+ trend."
      ),
      p(
        bold("Edge: Chesapeake"),
        " for buyers who prioritize value per dollar. Virginia Beach for buyers who want coastal access."
      ),
      h2("Schools"),
      p(
        "Both cities have strong school systems that consistently outperform state averages. Virginia Beach City Public Schools is one of the larger districts in Virginia; Chesapeake Public Schools has earned a strong reputation, particularly in the Great Bridge and Greenbrier areas. " +
        "Neither city has a clear overall advantage — it depends heavily on the specific neighborhood and school zone."
      ),
      p(
        bold("Edge: Tie."),
        " Research specific school zones in neighborhoods you're considering — they matter more than city-level comparisons."
      ),
      h2("Commute and Location"),
      h3("Virginia Beach"),
      p(
        "Virginia Beach's geography is wide. Commute times vary enormously depending on where you are in the city — from 15 minutes in Kempsville to Naval Station Norfolk, to 45 minutes from the Resort Area to the Peninsula. " +
        "The Hampton Roads Bridge-Tunnel expansion (completing Spring 2027) will dramatically improve access to Hampton and Newport News from Virginia Beach."
      ),
      h3("Chesapeake"),
      p(
        "Chesapeake is geographically large too, but its central corridor (Great Bridge, Greenbrier) offers surprisingly quick access to Norfolk and Portsmouth via I-464 and I-64. " +
        "North Suffolk buyers have easy access to Harbour View amenities. The Chesapeake Expressway (Route 168) provides a direct route to the Outer Banks — a feature buyers who care about weekend trips south appreciate."
      ),
      p(
        bold("Edge: Depends on your workplace."),
        " If you work in Norfolk or Portsmouth, Chesapeake's central corridor is hard to beat. If you work on the Oceanfront or at Naval Station Oceana, Virginia Beach wins."
      ),
      h2("Growth and Investment"),
      p(
        "Both cities are growing, but in different ways. Virginia Beach has seen major private sector investment — Amazon's 3.2-million-square-foot fulfillment center on Dam Neck Road now employs over 1,000 people with day-one benefits. " +
        "Chesapeake is seeing residential and commercial growth across its northern and western corridors. " +
        "Industrial vacancy across Hampton Roads sits at just 4.9%, signaling a tight, active commercial market that lifts surrounding residential values."
      ),
      p(
        bold("Edge: Virginia Beach"),
        " for major private investment signals. Chesapeake for buyers who want growth upside with a lower entry price."
      ),
      h2("Lifestyle"),
      p(
        "Virginia Beach offers what most people picture when they think of 'Hampton Roads living' — the Oceanfront, craft brewery scene, walkable beach communities, and an active outdoor culture year-round. " +
        "It's the most populous city in Virginia for a reason."
      ),
      p(
        "Chesapeake is quieter and more suburban — but it's not without character. " +
        "The Great Dismal Swamp is a massive natural reserve offering hiking and wildlife. " +
        "Chesapeake City Park is one of the best public parks in the region. And the growth in retail and dining in Greenbrier means you no longer have to cross the city line for amenities."
      ),
      h2("Bottom Line"),
      p(
        "If you want coastal lifestyle, walkability to the water, or maximum job access from multiple directions: Virginia Beach. " +
        "If you want more home for your dollar, newer construction, strong schools, and a quieter suburban environment: Chesapeake. " +
        "Both cities are solid long-term real estate decisions in a region that's been outperforming the national housing market consistently."
      ),
      p(
        "The better question might not be 'which city' but 'which neighborhood within the city' — because the variation within Virginia Beach and Chesapeake is often greater than the variation between them."
      ),
      ...CTA,
    ],
  },

  // ─── 10. Home Values 2026 ────────────────────────────────────────────────
  {
    title: 'What Are Hampton Roads Home Values Doing in 2026?',
    slug: 'hampton-roads-home-values-2026',
    category: 'market-update',
    excerpt:
      'Hampton Roads home values rose 4.17% in 2025 — more than double the national average. Here\'s what\'s driving the market and what to expect in 2026.',
    metaTitle: 'Hampton Roads Home Values 2026 | Market Trends | Legacy Home Search',
    metaDescription:
      'Hampton Roads home values appreciated 4.17% in 2025, well above the national average. Here\'s what\'s driving the market and what buyers and sellers should expect in 2026.',
    body: [
      p(
        "Hampton Roads isn't just holding its own in 2026 — it's outperforming. " +
        "Home values in the region appreciated ",
        bold("4.17% in 2025"),
        ", more than double the national average of 1.7%, and experts are projecting continued appreciation heading into next year. " +
        "Here's what's driving the numbers and what it means for buyers and sellers."
      ),
      h2("The Numbers"),
      p(
        "Virginia Beach's median home price is currently in the $400,000–$430,000 range, up from roughly $385,000–$410,000 a year ago. " +
        "Chesapeake runs slightly below Virginia Beach at $350,000–$390,000. Across the region:"
      ),
      p("Active inventory remains limited — well below pre-pandemic norms"),
      p("Days on market have stayed relatively short, particularly for move-in-ready homes under $450,000"),
      p("Multiple-offer situations persist in the most desirable price ranges and neighborhoods"),
      p(
        "This isn't a hot-money speculation market. It's a fundamentally undersupplied market with multiple demand drivers that show no signs of reversing."
      ),
      h2("What's Driving Hampton Roads Values"),
      h3("The Military Economy"),
      p(
        "Hampton Roads has an economic anchor that most markets envy: Naval Station Norfolk, the largest naval installation in the world. " +
        "The federal defense budget for fiscal year 2026 totals $900 billion, with expanded investments specifically in shipbuilding and military pay increases. " +
        "That means more stable employment, more families planting roots, and consistent housing demand regardless of what the broader economy does. " +
        "This military-anchored stability has historically made Hampton Roads more insulated from national downturns than virtually any other market on the East Coast."
      ),
      h3("Infrastructure Investment"),
      p(
        "The Hampton Roads Bridge-Tunnel expansion is a generational infrastructure project. The new tunnels are in their final outfitting phase, with full completion expected in Spring 2027. " +
        "When complete, commute times between Virginia Beach and the Peninsula will drop significantly — improving access to Naval Station Norfolk, the Port of Virginia, and the entire west side of Hampton Roads. " +
        "Infrastructure improvements historically drive real estate demand and property values upward in surrounding areas."
      ),
      h3("Private Sector Investment"),
      p(
        "Amazon opened a 3.2-million-square-foot robotics fulfillment center on Dam Neck Road in Virginia Beach in fall 2025, supporting over 1,000 full-time jobs with day-one health benefits. " +
        "Large private employers don't just create jobs — they anchor neighborhoods and create the kind of economic stability that makes homeownership a smart long-term decision."
      ),
      h3("Limited New Supply"),
      p(
        "Hampton Roads is not a market with unlimited buildable land. Much of Virginia Beach and Norfolk is already developed. " +
        "New construction is concentrated in Chesapeake and Suffolk — particularly the Harbour View corridor and North Suffolk — " +
        "and even there, builders are running at capacity. This supply constraint is a structural feature of the market, not a temporary condition."
      ),
      h2("What This Means for Buyers"),
      p(
        "The market is competitive but not impossible. A few things buyers should know:"
      ),
      p(
        bold("Waiting is a strategy that's been expensive."),
        " A buyer who waited two years hoping for prices to drop paid significantly more in 2025 than they would have in 2023 — and got two fewer years of appreciation."
      ),
      p(
        bold("VA loans are especially powerful right now."),
        " With zero down payment requirements and no PMI, eligible military buyers have a structural advantage in this market that shouldn't be wasted."
      ),
      p(
        bold("Inventory improves in spring and summer."),
        " If you're flexible on timing, March through June tends to see the largest selection of available homes."
      ),
      h2("What This Means for Sellers"),
      p(
        "Values are up, demand is strong, and inventory is limited — the classic recipe for seller-friendly conditions. " +
        "That said, overpriced homes still sit. Buyers in 2026 are informed and working with agents who pull comps carefully. " +
        "Pricing within 2–3% of market value consistently results in faster sales and stronger offers than reaching for the moon."
      ),
      p(
        "The Hampton Roads market has performed well for homeowners over the past decade. If you're thinking about selling and moving up — or cashing out equity — this is a market with real momentum behind it."
      ),
      ...CTA,
    ],
  },
]

// ─── Publish ─────────────────────────────────────────────────────────────────

async function main() {
  const writeClient = getSanityWriteClient()

  console.log(`Publishing ${posts.length} starter blog posts to Sanity...\n`)

  let published = 0
  let skipped = 0

  for (const post of posts) {
    // Check for existing slug
    const existing = await writeClient.fetch(
      `*[_type == "blogPost" && slug.current == $slug][0]._id`,
      { slug: post.slug }
    )

    if (existing) {
      console.log(`  ⏭  SKIP  ${post.slug}  (already exists)`)
      skipped++
      continue
    }

    await writeClient.create({
      _type: 'blogPost',
      title: post.title,
      slug: { _type: 'slug', current: post.slug },
      publishedAt: new Date().toISOString(),
      category: post.category,
      excerpt: post.excerpt,
      metaTitle: post.metaTitle,
      metaDescription: post.metaDescription,
      body: post.body,
      authorName: 'Barry Jenkins',
      aiGenerated: true,
    })

    console.log(`  ✓  PUBLISHED  ${post.slug}`)
    published++
  }

  console.log(`\nDone. ${published} published, ${skipped} skipped.`)
}

main().catch((err) => {
  console.error('Error:', err)
  process.exit(1)
})
