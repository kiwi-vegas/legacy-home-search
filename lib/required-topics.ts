/**
 * Required Evergreen Topics — high-performing post templates that must be
 * covered for every Hampton Roads market the client serves.
 *
 * The coverage system (lib/required-topics-coverage.ts) checks Sanity for
 * existing posts matching each goal and seeds gaps as IdeaCandidates so they
 * appear on the idea-review page for approval.
 *
 * Adding a new required topic: append to REQUIRED_TOPICS below.
 * Removing: remove the entry. Existing posts are unaffected.
 */

import type { ArticleCategory, IdeaAudience } from './types'

// ─── Cities ─────────────────────────────────────────────────────────────────

export const HAMPTON_ROADS_CITIES = [
  { slug: 'hampton-roads',   label: 'Hampton Roads' },  // umbrella
  { slug: 'virginia-beach',  label: 'Virginia Beach' },
  { slug: 'chesapeake',      label: 'Chesapeake' },
  { slug: 'norfolk',         label: 'Norfolk' },
  { slug: 'suffolk',         label: 'Suffolk' },
  { slug: 'hampton',         label: 'Hampton' },
  { slug: 'newport-news',    label: 'Newport News' },
] as const

export type City = typeof HAMPTON_ROADS_CITIES[number]

// ─── Topic goal type ────────────────────────────────────────────────────────

export interface TopicGoal {
  id: string                 // unique slug, e.g. "cost-to-buy:virginia-beach"
  topicGroup: string         // e.g. "cost-to-buy"
  title: string              // proposed post title
  category: ArticleCategory
  audiences: IdeaAudience[]
  whyItMatters: string       // for the idea-review card
  brief: string              // brief for the writer when approved
  targetKeyword: string
  cityLabel: string          // for display & match
  /** Match if a published post's title or slug contains ALL of these substrings (case-insensitive). */
  matchAllOf: string[]
}

// ─── Goal generators ────────────────────────────────────────────────────────

function costToBuyGoals(): TopicGoal[] {
  return HAMPTON_ROADS_CITIES.map((c) => ({
    id: `cost-to-buy:${c.slug}`,
    topicGroup: 'cost-to-buy',
    title: `What Does It Cost to Buy a Home in ${c.label} in 2026?`,
    category: 'cost-breakdown',
    audiences: ['buyer'],
    whyItMatters: `${c.label} buyers consistently search for total cost of buying — down payment, closing costs, inspection, taxes. This is one of Renick's #1 lift formats.`,
    brief: `Cover all upfront costs to buy in ${c.label}: down payment ranges by loan type (VA/FHA/conventional), closing costs, inspections, appraisal, attorney fees, first-year property tax estimate, escrow/insurance setup. Include a summary table in the first third of the post. Use real local numbers where possible.`,
    targetKeyword: `cost to buy a home in ${c.label.toLowerCase()}`,
    cityLabel: c.label,
    matchAllOf: ['cost', 'buy', c.label],
  }))
}

function costToSellGoals(): TopicGoal[] {
  return HAMPTON_ROADS_CITIES.map((c) => ({
    id: `cost-to-sell:${c.slug}`,
    topicGroup: 'cost-to-sell',
    title: `What Does It Cost to Sell a Home in ${c.label}?`,
    category: 'cost-breakdown',
    audiences: ['seller'],
    whyItMatters: `Sellers in ${c.label} need to know net proceeds. Covers commissions, transfer taxes, prep costs, payoff coordination — searched constantly.`,
    brief: `Cover all costs to sell in ${c.label}: agent commissions (and how the new buyer-rep rules affect this), Virginia grantor tax, prep/staging, repairs, mortgage payoff, prorated taxes. Include a net-proceeds example calculation. Summary table in first third.`,
    targetKeyword: `cost to sell a home in ${c.label.toLowerCase()}`,
    cityLabel: c.label,
    matchAllOf: ['cost', 'sell', c.label],
  }))
}

function propertyTaxBuyerGoals(): TopicGoal[] {
  return HAMPTON_ROADS_CITIES.map((c) => ({
    id: `property-tax-buyers:${c.slug}`,
    topicGroup: 'property-tax-buyers',
    title: `How Do Virginia Property Taxes Work for ${c.label} Home Buyers?`,
    category: 'buying-tips',
    audiences: ['buyer'],
    whyItMatters: `New buyers in ${c.label} routinely underestimate property tax in their monthly housing payment. This is a top recurring search and a credibility-builder.`,
    brief: `Explain Virginia's property tax system from a buyer perspective for ${c.label}: how the tax rate is set, current rate, how assessed value is calculated, when the bill comes, how escrow handles it, what reassessment cycles look like, and the homestead/veteran exemptions buyers should ask about. Real numbers for a typical ${c.label} purchase.`,
    targetKeyword: `${c.label.toLowerCase()} property tax for buyers`,
    cityLabel: c.label,
    matchAllOf: ['property tax', 'buyer', c.label],
  }))
}

function comparisonGoals(): TopicGoal[] {
  // Pre-defined high-value pairs. Each pair generates a buyer + investor variant.
  const pairs: Array<[string, string]> = [
    ['Virginia Beach', 'Chesapeake'],
    ['Virginia Beach', 'Norfolk'],
    ['Chesapeake', 'Suffolk'],
    ['Hampton', 'Newport News'],
    ['Norfolk', 'Chesapeake'],
  ]
  const goals: TopicGoal[] = []
  for (const [a, b] of pairs) {
    for (const audience of ['buyer', 'investor'] as const) {
      const audLabel = audience === 'buyer' ? 'Home Buyers' : 'Investors'
      goals.push({
        id: `vs:${a.toLowerCase().replace(/\s+/g, '-')}:${b.toLowerCase().replace(/\s+/g, '-')}:${audience}`,
        topicGroup: 'city-vs-city',
        title: `${a} vs ${b}: Which Is Better for ${audLabel} in 2026?`,
        category: 'community-spotlight',
        audiences: [audience as IdeaAudience],
        whyItMatters: `Direct head-to-head comparisons drive heavy organic traffic. Buyers/investors actively search "${a} vs ${b}" when narrowing options.`,
        brief: `Comparison post: ${a} vs ${b} for ${audience}s in 2026. Cover median price, price/sqft, taxes, schools (for buyers) or rental yield + cap rate (for investors), commute, growth signals. End with an explicit "Best for ${audLabel}: X" conclusion — don't leave the reader to decide.`,
        targetKeyword: `${a.toLowerCase()} vs ${b.toLowerCase()}`,
        cityLabel: `${a} vs ${b}`,
        matchAllOf: [a, b, 'vs', audience],
      })
    }
  }
  return goals
}

function goodTimeToBuyGoals(): TopicGoal[] {
  return HAMPTON_ROADS_CITIES.map((c) => ({
    id: `good-time-to-buy:${c.slug}`,
    topicGroup: 'good-time-to-buy',
    title: `Is 2026 a Good Time to Buy in ${c.label}?`,
    category: 'buying-tips',
    audiences: ['buyer'],
    whyItMatters: `Indecision content. ${c.label} buyers search this monthly. Forces a clear stance using current market data.`,
    brief: `Take a clear stance on whether 2026 is a good time to buy in ${c.label}. Use current data: median price trend, days on market, inventory, mortgage rate environment, local job/military growth signals. Address both sides honestly. End with a "Who should buy now / who should wait" segmentation.`,
    targetKeyword: `is now a good time to buy a home in ${c.label.toLowerCase()}`,
    cityLabel: c.label,
    matchAllOf: ['good time', 'buy', c.label],
  }))
}

function afterOfferAcceptedGoal(): TopicGoal {
  return {
    id: 'after-offer:virginia',
    topicGroup: 'after-offer',
    title: `What Happens After Your Offer Is Accepted in Virginia?`,
    category: 'buying-tips',
    audiences: ['buyer'],
    whyItMatters: `First-time buyers in every Hampton Roads city need this — covers ratification through closing. Funnel-bottom content with strong "agent who explained this clearly" credibility.`,
    brief: `Step-by-step timeline from offer acceptance to closing day in Virginia: ratified contract → earnest money deposit → home inspection window → appraisal → loan underwriting → title work → final walkthrough → closing. Cover Virginia-specific items (attorney closing, transfer taxes, contingency periods). Numbered steps, what each step means, who does it, typical timing.`,
    targetKeyword: `what happens after offer accepted virginia`,
    cityLabel: 'Virginia',
    matchAllOf: ['offer', 'accepted'],
  }
}

function floodZoneBuyerGoals(): TopicGoal[] {
  // Cities with meaningful flood exposure
  const floodCities = HAMPTON_ROADS_CITIES.filter((c) =>
    ['hampton-roads', 'virginia-beach', 'norfolk', 'hampton', 'newport-news'].includes(c.slug)
  )
  return floodCities.map((c) => ({
    id: `flood-zones-buyers:${c.slug}`,
    topicGroup: 'flood-zones-buyers',
    title: `What Do Flood Zones Mean for Home Buyers in ${c.label}?`,
    category: 'flood-and-risk',
    audiences: ['buyer'],
    whyItMatters: `${c.label} has serious flood exposure. Renick's flood/insurance posts are his top-lift category. Buyer-angle is currently uncovered.`,
    brief: `Buyer-focused guide to flood zones in ${c.label}: how to look up a flood zone for any address, what each zone (X, AE, VE, etc.) means for monthly cost, FEMA elevation certificates, how flood insurance changes after closing, how to factor flood risk into offers, and questions every ${c.label} buyer should ask before going under contract.`,
    targetKeyword: `${c.label.toLowerCase()} flood zone buyers guide`,
    cityLabel: c.label,
    matchAllOf: ['flood', 'buyer', c.label],
  }))
}

// ─── New generators (adapted from Renick winning posts) ─────────────────────

function closingCostsBuyerGoals(): TopicGoal[] {
  return HAMPTON_ROADS_CITIES.map((c) => ({
    id: `closing-costs-buyer:${c.slug}`,
    topicGroup: 'closing-costs-buyer',
    title: `What Are the Closing Costs for Home Buyers in ${c.label}?`,
    category: 'cost-breakdown',
    audiences: ['buyer'],
    whyItMatters: `One of Renick's top-performing formats (+1356% lift). ${c.label} buyers consistently search for closing cost totals before making an offer — lender fees, title, escrow, prepaid items. A detailed local breakdown builds trust and generates early-funnel leads.`,
    brief: `Break down every closing cost a buyer pays in ${c.label}: lender origination fees, title insurance (owner + lender), title search, settlement/attorney fee, appraisal, home inspection, prepaid homeowners insurance, prepaid property taxes, HOA setup fees (if applicable), VA funding fee or FHA MIP if applicable. Include a sample closing cost table for a $400K and $600K purchase. Note what can be negotiated via seller concessions.`,
    targetKeyword: `closing costs for home buyers in ${c.label.toLowerCase()}`,
    cityLabel: c.label,
    matchAllOf: ['closing costs', 'buyer', c.label],
  }))
}

function closingCostsSellerGoals(): TopicGoal[] {
  return HAMPTON_ROADS_CITIES.map((c) => ({
    id: `closing-costs-seller:${c.slug}`,
    topicGroup: 'closing-costs-seller',
    title: `How Much Are Closing Costs for Home Sellers in ${c.label}?`,
    category: 'cost-breakdown',
    audiences: ['seller'],
    whyItMatters: `Renick's #1 format category by lift (+2547%). Sellers in ${c.label} need a clear net-proceeds picture before listing. This is the entry-point search that turns into listing appointments.`,
    brief: `Cover every closing cost a seller pays in ${c.label}: agent commissions (and how post-NAR-settlement buyer-rep agreements work), Virginia grantor tax, attorney/settlement fee, title insurance, recording fees, HOA disclosure/transfer fee, prorated property taxes, any required repairs from inspection. Include a net-proceeds example for a $500K sale. Note the difference between "costs" and "concessions offered to buyer."`,
    targetKeyword: `closing costs for home sellers in ${c.label.toLowerCase()}`,
    cityLabel: c.label,
    matchAllOf: ['closing costs', 'seller', c.label],
  }))
}

function homeStageToSellGoals(): TopicGoal[] {
  return HAMPTON_ROADS_CITIES.map((c) => ({
    id: `home-staging:${c.slug}`,
    topicGroup: 'home-staging',
    title: `How Do You Stage a ${c.label} Home to Sell Faster?`,
    category: 'selling-tips',
    audiences: ['seller'],
    whyItMatters: `Renick's highest individual-post lift format (+2900%). Sellers actively search staging tips before listing. Positions Barry as the agent who helps sellers maximize value, not just list and hope.`,
    brief: `Practical staging guide for ${c.label} sellers: declutter and depersonalize priorities, curb appeal quick wins (pressure wash, paint front door, mulch), interior staging room by room (entry, living room, kitchen, primary bedroom, bathrooms), what to do with occupied furniture vs. vacant staging, photography prep, and what NOT to over-invest in before listing. Include a "Day before photos" checklist. Keep advice grounded in what ${c.label} buyers actually notice.`,
    targetKeyword: `how to stage a home in ${c.label.toLowerCase()} to sell`,
    cityLabel: c.label,
    matchAllOf: ['stage', 'sell', c.label],
  }))
}

function marketOutlookGoals(): TopicGoal[] {
  return HAMPTON_ROADS_CITIES.map((c) => ({
    id: `market-outlook:${c.slug}`,
    topicGroup: 'market-outlook',
    title: `What's the 2026 Housing Market Outlook for ${c.label}?`,
    category: 'market-update',
    audiences: ['buyer', 'seller'],
    whyItMatters: `Renick's market outlook posts hit +1400%. Buyers and sellers both search this before acting. Sets Barry as the go-to local market authority and drives search intent at the top of the decision funnel.`,
    brief: `Cover the current ${c.label} market conditions and 2026 outlook: median home prices (current and trend), inventory levels (months of supply), days on market, list-to-sale price ratio, mortgage rate impact on buyer demand, local military/employment drivers (mention specific bases or employers), any new development or infrastructure projects affecting values. End with a clear verdict: is 2026 a buyer's market, seller's market, or neutral? Include a "What this means if you're buying" and "What this means if you're selling" section.`,
    targetKeyword: `${c.label.toLowerCase()} housing market outlook 2026`,
    cityLabel: c.label,
    matchAllOf: ['outlook', '2026', c.label],
  }))
}

function risksOfWaitingGoals(): TopicGoal[] {
  return HAMPTON_ROADS_CITIES.map((c) => ({
    id: `risks-of-waiting:${c.slug}`,
    topicGroup: 'risks-of-waiting',
    title: `What Are the Real Risks of Waiting to Buy in ${c.label}?`,
    category: 'buying-tips',
    audiences: ['buyer'],
    whyItMatters: `Renick's version hit +500%. Fence-sitters search this constantly. A concrete, data-driven answer to "should I wait?" positions Barry as an honest advisor rather than a pushy agent, and converts hesitant leads.`,
    brief: `Address the "I'll wait until rates drop / prices fall" objection head-on for ${c.label}. Cover: what historical price appreciation in ${c.label} looks like (data-driven), how the cost of waiting one year compounds across a typical mortgage, local inventory dynamics and whether waiting means less choice, the lock-in dilemma (when you can refinance, when you can't), who should legitimately wait vs. who is losing equity by waiting. Be balanced and honest — include "valid reasons to wait" alongside the risks.`,
    targetKeyword: `risks of waiting to buy a home in ${c.label.toLowerCase()}`,
    cityLabel: c.label,
    matchAllOf: ['risk', 'wait', 'buy', c.label],
  }))
}

function relocateCostGoals(): TopicGoal[] {
  const relocateCities = HAMPTON_ROADS_CITIES.filter((c) =>
    ['hampton-roads', 'virginia-beach', 'chesapeake'].includes(c.slug)
  )
  return relocateCities.map((c) => ({
    id: `relocation-cost:${c.slug}`,
    topicGroup: 'relocation-cost',
    title: `What Does It Really Cost to Relocate to ${c.label}?`,
    category: 'cost-breakdown',
    audiences: ['buyer'],
    whyItMatters: `Renick's relocation cost posts hit +429%. Hampton Roads is a major military relocation hub — PCS orders, DITY moves, BAH rates. This topic captures both military and civilian relocators searching total move costs before committing.`,
    brief: `Full relocation cost breakdown for someone moving to ${c.label}: moving company estimates (local vs. long-distance), storage costs, temporary housing (30-60 day range), VA home loan vs. conventional for relocators, BAH rates for ${c.label} (if military-focused), realtor timeline from PCS orders to keys, state income tax comparison vs. high-tax states, cost of living index vs. national average, first-year homeownership costs to budget for. Frame as both a military PCS guide and a civilian relocation guide.`,
    targetKeyword: `cost to relocate to ${c.label.toLowerCase()}`,
    cityLabel: c.label,
    matchAllOf: ['relocat', 'cost', c.label],
  }))
}

function buyingVsRentingGoals(): TopicGoal[] {
  return HAMPTON_ROADS_CITIES.map((c) => ({
    id: `buy-vs-rent:${c.slug}`,
    topicGroup: 'buy-vs-rent',
    title: `Is Buying or Renting in ${c.label} Smarter in 2026?`,
    category: 'buying-tips',
    audiences: ['buyer'],
    whyItMatters: `High evergreen search volume. Fence-sitters run this calculation constantly. A real answer with current ${c.label} numbers — rent costs, purchase prices, break-even horizon — outperforms vague "it depends" blog posts and drives direct inquiries.`,
    brief: `Run a real buy vs. rent calculation for ${c.label} in 2026: current median rent for a 3BR, current median purchase price for a 3BR, estimated monthly PITI at current rates, break-even point in years (factoring appreciation and rent increases), equity build over 5 and 10 years, scenarios where renting wins (short time horizon, waiting for relocation orders, high-cost market), scenarios where buying wins (long-term plans, equity capture, stable income). Include a simple comparison table. Give a clear recommendation for the average ${c.label} resident.`,
    targetKeyword: `buying vs renting in ${c.label.toLowerCase()} 2026`,
    cityLabel: c.label,
    matchAllOf: ['buy', 'rent', c.label],
  }))
}

// ─── One-off Virginia / Hampton Roads goals ─────────────────────────────────

function virginiaTransactionGoals(): TopicGoal[] {
  return [
    {
      id: 'home-inspection-report:virginia',
      topicGroup: 'home-inspection-report',
      title: 'How Do You Read a Virginia Home Inspection Report?',
      category: 'buying-tips',
      audiences: ['buyer'],
      whyItMatters: `Renick's equivalent hit +1507%. First-time buyers are terrified of inspection reports. A clear guide demystifying what the inspector flags, what matters vs. what's cosmetic, and how to negotiate repairs turns a scary document into a confident closing.`,
      brief: `Walk a buyer through a Virginia home inspection report: what's covered (structure, roof, HVAC, plumbing, electrical, foundation, insulation), how inspectors rate issues (safety hazard vs. deferred maintenance vs. informational), which items are red flags that could kill a deal vs. normal wear-and-tear, how to use the report to negotiate seller repairs or price reductions, Virginia-specific items (radon testing, septic inspection, chimney inspection, termite/wood-destroying insect inspection). Include a sample "negotiation priority list" format.`,
      targetKeyword: 'how to read a home inspection report virginia',
      cityLabel: 'Virginia',
      matchAllOf: ['home inspection', 'report'],
    },
    {
      id: 'seller-disclosures:virginia',
      topicGroup: 'seller-disclosures',
      title: 'What Must Virginia Home Sellers Disclose to Buyers?',
      category: 'selling-tips',
      audiences: ['seller'],
      whyItMatters: `Renick's version hit +297%. Seller disclosure is one of the most anxiety-producing parts of listing — sellers don't know what they legally must reveal vs. what they can stay silent about. This builds trust and drives listing consultations.`,
      brief: `Explain Virginia's residential property disclosure law: what sellers must disclose (material defects, known issues, HOA details, lead paint for pre-1978 homes), what Virginia's "buyer beware" provisions mean, the Virginia Residential Property Disclosure Act and what the standard form covers, common mistakes sellers make (over-disclosing, under-disclosing, not updating after new damage), how disclosures affect buyer inspection contingencies. Include a "What you must disclose / What you don't have to disclose" table.`,
      targetKeyword: 'what must virginia home sellers disclose',
      cityLabel: 'Virginia',
      matchAllOf: ['disclose', 'seller', 'virginia'],
    },
    {
      id: 'appraisal-buyers:virginia',
      topicGroup: 'appraisal-buyers',
      title: 'What Do Hampton Roads Home Buyers Need to Know About Appraisals?',
      category: 'buying-tips',
      audiences: ['buyer'],
      whyItMatters: `Renick's version hit +900%. Buyers routinely confuse appraisal with inspection, don't understand how appraisal gaps work, and don't know their options if the appraisal comes in low. This is a high-anxiety topic that drives early-stage buyer engagement.`,
      brief: `Explain the appraisal process for Hampton Roads buyers: what appraisers look for, how the appraised value affects your loan (LTV ratio, loan amount caps), what happens when appraisal = purchase price vs. when it comes in low, buyer's options on a low appraisal (renegotiate, appraisal gap clause, walk away, challenge), who orders and pays for the appraisal, VA appraisal (NPVP) specifics — a major topic for military buyers in Hampton Roads, how military bases affect comparable values. Include a timeline of when appraisal happens in the contract process.`,
      targetKeyword: 'home appraisal for buyers hampton roads virginia',
      cityLabel: 'Hampton Roads',
      matchAllOf: ['appraisal', 'buyer'],
    },
    {
      id: 'low-appraisal:virginia',
      topicGroup: 'low-appraisal',
      title: 'What Happens If the Appraisal Comes In Low in Virginia?',
      category: 'buying-tips',
      audiences: ['buyer'],
      whyItMatters: `Renick's version hit +535%. Low appraisals are one of the most common deal-killers and one of the least understood scenarios. A clear guide on the buyer's real options turns a panicked situation into a solvable one.`,
      brief: `Walk through every option a Virginia buyer has when the appraisal comes in below purchase price: renegotiate price with seller (how to frame the ask), pay the gap out of pocket (appraisal gap coverage clause), challenge the appraisal (reconsideration of value process — how it works, what evidence to provide), walk away using appraisal contingency. Explain what happens with the earnest money in each scenario under Virginia contract law. Note VA loan appraisal-specific rules (VA minimum property requirements, Tidewater initiative).`,
      targetKeyword: 'appraisal came in low virginia what to do',
      cityLabel: 'Virginia',
      matchAllOf: ['appraisal', 'low'],
    },
    {
      id: 'contingencies:virginia',
      topicGroup: 'contingencies',
      title: 'What Are Contingencies in a Virginia Real Estate Offer?',
      category: 'buying-tips',
      audiences: ['buyer'],
      whyItMatters: `Renick's version hit +606%. Buyers don't fully understand what contingencies protect them from or how waiving them affects risk. Understanding this is the difference between a confident buyer and a paralyzed one.`,
      brief: `Explain every major contingency in a Virginia residential real estate contract: financing contingency (what triggers it, how long it lasts), home inspection contingency (repair request process, buyer's right to cancel), appraisal contingency (how it interacts with financing contingency), home sale contingency (when to use, when sellers reject it), title contingency. Explain what waiving contingencies means in competitive markets — and the real risks. Cover the Virginia Regional Sales Contract (REIN standard form) specifically and how each contingency deadline works.`,
      targetKeyword: 'contingencies in a virginia real estate offer',
      cityLabel: 'Virginia',
      matchAllOf: ['contingencies', 'virginia'],
    },
    {
      id: 'seller-concessions:virginia',
      topicGroup: 'seller-concessions',
      title: 'How Do Seller Concessions Work in Hampton Roads Real Estate?',
      category: 'buying-tips',
      audiences: ['buyer', 'seller'],
      whyItMatters: `Renick's version hit +581%. Both buyers and sellers search this, especially in a market where affordability is tight. Explaining concessions well positions Barry as a negotiation expert on both sides.`,
      brief: `Explain seller concessions in Hampton Roads: what they are (seller pays a portion of buyer's closing costs or prepaid items), why sellers offer them (attract buyers, close deals in a slow market), VA loan limits on seller concessions (4% rule — important for the military-heavy Hampton Roads market), conventional and FHA limits, how to structure a concession in an offer (gross-up purchase price strategy), when asking for concessions is smart vs. risky in the current market, and how Barry negotiates these for his clients.`,
      targetKeyword: 'seller concessions hampton roads virginia',
      cityLabel: 'Hampton Roads',
      matchAllOf: ['seller concessions', 'hampton roads'],
    },
    {
      id: 'earnest-money:virginia',
      topicGroup: 'earnest-money',
      title: 'How Does Earnest Money Work in Virginia Real Estate?',
      category: 'buying-tips',
      audiences: ['buyer'],
      whyItMatters: `Renick's version hit +118%. First-time buyers are confused about earnest money — how much, when it's at risk, how to protect it. A clear guide reduces anxiety and builds confidence in the process.`,
      brief: `Cover earnest money for Virginia buyers: typical amounts in Hampton Roads (% of purchase price or flat amount), who holds it and where (escrow with settlement company or broker — not seller), when you can get it back (within contingency periods), when you lose it (default after contingencies are removed), how it's applied at closing, the difference between earnest money and down payment, what "at-risk" earnest means in a competitive offer. Use a timeline showing when each contingency deadline affects the earnest money.`,
      targetKeyword: 'how does earnest money work virginia',
      cityLabel: 'Virginia',
      matchAllOf: ['earnest money', 'virginia'],
    },
    {
      id: 'seller-net-sheet:virginia',
      topicGroup: 'seller-net-sheet',
      title: 'What Is a Seller Net Sheet in Virginia Real Estate?',
      category: 'selling-tips',
      audiences: ['seller'],
      whyItMatters: `Renick's version hit +99%. Every seller's first question is "what will I walk away with?" A clear explanation of the net sheet builds trust before a listing appointment and positions Barry as the transparent, numbers-first agent.`,
      brief: `Explain what a seller net sheet is and how to read one in Virginia: what it calculates (gross sale price minus all costs = net proceeds), every line item included (commission, grantor tax, title insurance, attorney fee, payoff amount, prorated taxes, HOA fees, any seller concessions), how to use it to compare listing price scenarios, why the net sheet is an estimate (not a guarantee), how the final settlement statement (HUD-1 equivalent) differs from the estimate, and how Barry prepares a net sheet at every listing presentation for Hampton Roads sellers.`,
      targetKeyword: 'seller net sheet virginia real estate',
      cityLabel: 'Virginia',
      matchAllOf: ['seller net sheet', 'virginia'],
    },
    {
      id: 'real-estate-commissions:virginia',
      topicGroup: 'real-estate-commissions',
      title: 'What Do Sellers Pay in Virginia Real Estate Commissions in 2026?',
      category: 'selling-tips',
      audiences: ['seller'],
      whyItMatters: `Renick's Florida equivalent hit +641% and is his highest absolute-traffic winner. Post-NAR settlement, commission structure changed significantly — sellers need clarity on what they actually owe and to whom. This is a top listing-appointment driver.`,
      brief: `Explain how real estate commissions work in Virginia post-NAR settlement (August 2024 changes): sellers no longer automatically pay buyer-agent compensation through the MLS, how buyer-rep agreements work now, what the new "decoupled" commission model means for sellers in Hampton Roads, typical listing fee ranges, how commission is negotiated (and what you get at different price points), the difference between discount brokers and full-service, and how seller concessions can be used to help buyers cover their agent fees. Be transparent and fair — this post should serve as a pre-listing consultation primer.`,
      targetKeyword: 'virginia real estate commission for sellers 2026',
      cityLabel: 'Virginia',
      matchAllOf: ['commission', 'seller', 'virginia'],
    },
    {
      id: 'key-contract-clauses:virginia',
      topicGroup: 'key-contract-clauses',
      title: 'What Key Clauses Are in a Virginia Real Estate Contract?',
      category: 'buying-tips',
      audiences: ['buyer', 'seller'],
      whyItMatters: `Renick's version hit +400% with 403 seconds average engagement — readers are reading every word. Buyers and sellers both want to understand what they're signing before they sign it.`,
      brief: `Walk through the Virginia Regional Sales Contract (used in Hampton Roads/REIN MLS) clause by clause: purchase price and earnest money, financing terms and contingency, inspection contingency and repair request limits, appraisal contingency, possession date and seller rent-back, property condition at closing, HOA addendum, well/septic addendum if applicable, flood zone disclosure, lead paint addendum, and closing cost allocation. Explain each in plain English — what it means if breached, what's negotiable, and what Barry watches for when reviewing contracts with clients.`,
      targetKeyword: 'virginia real estate contract clauses explained',
      cityLabel: 'Virginia',
      matchAllOf: ['contract', 'clauses', 'virginia'],
    },
    {
      id: 'mortgage-15-vs-30:hampton-roads',
      topicGroup: 'mortgage-15-vs-30',
      title: 'Buying a Home in Hampton Roads: 15-Year or 30-Year Mortgage?',
      category: 'financing',
      audiences: ['buyer'],
      whyItMatters: `Renick's version hit +1400%. It's one of the most-searched mortgage questions and most agents never answer it with real numbers. Positions Barry as a financially savvy advisor, not just a home finder.`,
      brief: `Run a real side-by-side comparison for a Hampton Roads buyer: take a $400K home with 5% down and show monthly payment, total interest paid, and equity after 5/10/20 years at current rates for 15-year vs. 30-year. Cover who the 15-year makes sense for (high income, close to retirement, aggressive equity goals), who the 30-year makes sense for (first-time buyers, military with potential PCS in 3-5 years, investment mindset wanting cash flow), and the VA loan angle — which term is most popular for VA loans and why. Include a "What Barry recommends" section based on common buyer profiles he sees in Hampton Roads.`,
      targetKeyword: '15 year vs 30 year mortgage hampton roads virginia',
      cityLabel: 'Hampton Roads',
      matchAllOf: ['15-year', '30-year', 'mortgage'],
    },
    {
      id: 'rate-buydown:2026',
      topicGroup: 'rate-buydown',
      title: 'Should You Buy Down Your Mortgage Rate in 2026?',
      category: 'financing',
      audiences: ['buyer'],
      whyItMatters: `Renick's version hit +336% engagement (highest in the dataset). With elevated rates, buyers are actively evaluating whether paying points makes sense. A real break-even calculation is invaluable.`,
      brief: `Explain mortgage rate buydowns for Hampton Roads buyers in 2026: how points work (1 point = 1% of loan = ~0.25% rate reduction, varies by lender), how to calculate the break-even month (cost of points ÷ monthly savings), permanent buydowns vs. temporary 2-1 buydowns (what sellers often offer as a concession), when buying points makes sense (planning to stay 7+ years, interest rate environment), when it doesn't (PCS likely in 2-3 years, better to keep cash for repairs/improvements), how to ask a seller to contribute to a buydown. Use a real example with current Hampton Roads median price and 2026 rate environment.`,
      targetKeyword: 'should you buy down your mortgage rate 2026',
      cityLabel: 'Hampton Roads',
      matchAllOf: ['buy down', 'mortgage rate'],
    },
    {
      id: 'assumable-mortgage:virginia',
      topicGroup: 'assumable-mortgage',
      title: 'How Do Assumable Mortgages Work in Hampton Roads?',
      category: 'financing',
      audiences: ['buyer', 'seller'],
      whyItMatters: `VA assumable loans are a massive advantage in Hampton Roads — with hundreds of thousands of active-duty and veteran homeowners, there are more assumable VA loans here than almost anywhere in the country. This is a high-differentiation topic for the market.`,
      brief: `Explain assumable mortgages for Hampton Roads buyers and sellers: what loan types are assumable (VA, FHA, USDA — not conventional), why a 3% VA assumable loan is enormously valuable in a 6.5%+ rate environment, how the assumption process works (lender qualification, entitlement restoration for the seller, timeline), the risks for the seller (entitlement tied up until buyer pays off loan or refi's), how to find assumable listings in Hampton Roads, what to offer a seller to compensate for their low rate. Include real examples showing the monthly payment difference.`,
      targetKeyword: 'assumable mortgages hampton roads virginia',
      cityLabel: 'Hampton Roads',
      matchAllOf: ['assumable', 'mortgage'],
    },
    {
      id: 'how-long-to-sell:hampton-roads',
      topicGroup: 'how-long-to-sell',
      title: 'How Long Does It Take to Sell a Home in Hampton Roads?',
      category: 'selling-tips',
      audiences: ['seller'],
      whyItMatters: `Renick's version hit +253%. Sellers planning their timeline always search this first. A detailed local answer with current days-on-market data by city builds credibility and sets realistic expectations.`,
      brief: `Give realistic timelines for selling a home in Hampton Roads in 2026: current average days on market by city (Virginia Beach, Chesapeake, Norfolk, etc.), how price range affects days on market (entry-level sells faster, luxury takes longer), the full seller timeline from "decide to sell" to closing day (pre-listing prep 2-4 weeks, on-market average, under contract to closing 30-45 days), what slows down closings in Hampton Roads (VA loan appraisals, military relocation logistics, attorney scheduling), how pricing affects timeline, and what Barry does to reduce time on market for his listings.`,
      targetKeyword: 'how long to sell a home in hampton roads virginia',
      cityLabel: 'Hampton Roads',
      matchAllOf: ['long', 'sell', 'hampton roads'],
    },
    {
      id: 'best-time-to-sell:hampton-roads',
      topicGroup: 'best-time-to-sell',
      title: 'When Is the Best Time to Sell a Home in Hampton Roads?',
      category: 'selling-tips',
      audiences: ['seller'],
      whyItMatters: `Renick's version hit +59%. High-volume search, low competition. Sellers plan listings months in advance — this is the top-of-funnel question that starts the listing conversation with Barry.`,
      brief: `Cover the seasonal patterns for home sales in Hampton Roads: spring (March-June) is peak season driven by PCS orders (military cycle unique to Hampton Roads — explain how PCS orders release in spring), summer demand from military relocators, fall market, and winter slowdown. Include data on list-to-sale price ratio and days on market by season if available. Address the unique Hampton Roads factor: military PCS cycles mean there's a second strong buying window in late summer/early fall that most other markets don't have. End with: "What's the best month to list?" based on Barry's experience.`,
      targetKeyword: 'best time to sell a home in hampton roads',
      cityLabel: 'Hampton Roads',
      matchAllOf: ['best time', 'sell', 'hampton roads'],
    },
    {
      id: 'sell-or-rent:hampton-roads',
      topicGroup: 'sell-or-rent',
      title: 'Should You Sell or Rent Your Hampton Roads Home?',
      category: 'selling-tips',
      audiences: ['seller', 'homeowner'],
      whyItMatters: `Renick's version hit +59%. Military homeowners in Hampton Roads face this exact decision constantly at PCS time. "Should I sell or keep it as a rental?" is one of the most common questions Barry gets from departing military clients.`,
      brief: `Help Hampton Roads homeowners decide between selling and renting, with a focus on the military PCS scenario: current rental rates by city (what a 3BR rents for in Virginia Beach, Chesapeake, Norfolk), cap rate potential, property management costs, long-distance landlord challenges, what happens if the market appreciates vs. depreciates while they're away, tax implications of converting primary residence to rental (capital gains exclusion clock, depreciation), and when selling makes more sense (equity needs for next purchase, debt-to-income for next VA loan). Include a decision tree.`,
      targetKeyword: 'should i sell or rent my home hampton roads',
      cityLabel: 'Hampton Roads',
      matchAllOf: ['sell', 'rent', 'hampton roads'],
    },
    {
      id: 'repairs-after-inspection:virginia',
      topicGroup: 'repairs-after-inspection',
      title: 'How Do You Handle Repairs After a Home Inspection in Virginia?',
      category: 'buying-tips',
      audiences: ['buyer', 'seller'],
      whyItMatters: `Renick's version hit +194%. The negotiation after the inspection is where most deals fall apart or get rescued. A clear guide on how Virginia buyers make repair requests — and what sellers should and shouldn't agree to — is essential for both sides.`,
      brief: `Walk through the repair negotiation process in Virginia: how the inspection repair request works under the Virginia Regional Sales Contract (what language to use, how to frame requests), what buyers can ask for vs. what sellers can refuse, the three seller responses (repair, credit, price reduction — and when each makes sense), which inspection items are worth negotiating hard vs. accepting, how to handle major vs. minor repairs, what happens when parties can't agree (contract cancellation rights, return of earnest money), and best practices Barry uses to keep deals together through inspection negotiations.`,
      targetKeyword: 'repairs after home inspection virginia',
      cityLabel: 'Virginia',
      matchAllOf: ['repairs', 'inspection', 'virginia'],
    },
    {
      id: 'waive-inspection:virginia',
      topicGroup: 'waive-inspection',
      title: 'Should You Waive the Home Inspection in Virginia?',
      category: 'buying-tips',
      audiences: ['buyer'],
      whyItMatters: `Renick's version hit +253%. In competitive markets, buyers are sometimes pressured to waive inspections. This is a high-stakes decision that most buyers are uncomfortable making without guidance.`,
      brief: `Honest guide to waiving home inspections in Virginia: what you're actually giving up (not just peace of mind — the legal right to cancel based on inspection findings), when waiving might make competitive sense (new construction with full warranty, estate sales, extreme seller's market), alternatives to fully waiving (information-only inspection, shortened inspection window, as-is with inspection right), what Virginia law does and doesn't protect buyers on, and the real-world stories of what goes wrong when buyers waive. End with Barry's honest professional recommendation.`,
      targetKeyword: 'should you waive home inspection in virginia',
      cityLabel: 'Virginia',
      matchAllOf: ['waive', 'inspection', 'virginia'],
    },
    {
      id: 'buyer-back-out:virginia',
      topicGroup: 'buyer-back-out',
      title: 'Can a Buyer Back Out of a Real Estate Contract in Virginia?',
      category: 'buying-tips',
      audiences: ['buyer'],
      whyItMatters: `Renick's equivalent is his #3 highest-traffic post overall (3.53 PV/day, +71% after refresh). Buyers research their rights before making offers. This is a high-urgency, late-stage search.`,
      brief: `Explain Virginia buyer cancellation rights: yes, buyers can back out — but when, how, and with what consequences. Cover: during due diligence (before inspection deadline, financing contingency, appraisal contingency), how to properly cancel to get earnest money back, what happens to earnest money if you cancel without a valid contingency, what "default" means under Virginia contract law, seller remedies when buyer backs out (keep earnest money, sue for specific performance — rare but real), and the one scenario where buyers can always cancel (right of rescission on some loan types). Use a "safe exit" timeline that shows when each cancellation right expires.`,
      targetKeyword: 'can a buyer back out of real estate contract in virginia',
      cityLabel: 'Virginia',
      matchAllOf: ['buyer', 'back out', 'virginia'],
    },
    {
      id: 'closing-appointment:virginia',
      topicGroup: 'closing-appointment',
      title: 'What Happens at a Virginia Real Estate Closing?',
      category: 'buying-tips',
      audiences: ['buyer', 'seller'],
      whyItMatters: `First-time buyers and sellers search this before every closing. A comprehensive guide demystifies the most intimidating day in the transaction and reduces anxiety-driven delays.`,
      brief: `Walk through a Virginia real estate closing step by step: who attends (buyer, seller, settlement attorney — Virginia is an attorney-closing state), what documents buyers sign (note, deed of trust, ALTA settlement statement, title insurance, loan disclosures), what sellers sign (deed, settlement statement), how funds are transferred (wire or certified check, lender funding timeline), the ALTA statement line by line, what "gap period" means in Virginia title law, keys and possession logistics, when the deed records (same day or next day depending on county), and what to bring. Include a "Day before closing checklist."`,
      targetKeyword: 'what happens at closing in virginia real estate',
      cityLabel: 'Virginia',
      matchAllOf: ['closing', 'appointment', 'virginia'],
    },
    {
      id: 'capital-gains:virginia',
      topicGroup: 'capital-gains',
      title: 'How Does Capital Gains Tax Work When Selling a Home in Virginia?',
      category: 'selling-tips',
      audiences: ['seller', 'homeowner'],
      whyItMatters: `Sellers who have lived in their home 2-5+ years often have substantial gains and are panicked about taxes. Clear guidance here is a pre-listing credibility builder, especially for military sellers who may have interrupted occupancy.`,
      brief: `Explain federal capital gains rules for Virginia home sellers: the $250K/$500K primary residence exclusion, the 2-of-5-year ownership and use test, what counts as "improvements" to your cost basis, short-term vs. long-term capital gains tax rates, Virginia state capital gains treatment (Virginia taxes capital gains as ordinary income — no preferential rate), and the military exception (Service Members Civil Relief Act extends the 5-year window for those on qualified extended duty). Include a simple calculation example for a military family who bought in 2019, moved out for 2 years on orders, and is selling in 2026.`,
      targetKeyword: 'capital gains tax selling home virginia',
      cityLabel: 'Virginia',
      matchAllOf: ['capital gains', 'virginia'],
    },
    {
      id: 'hoa-fees:hampton-roads',
      topicGroup: 'hoa-fees',
      title: 'How Much Are HOA Fees in Hampton Roads Neighborhoods?',
      category: 'buying-tips',
      audiences: ['buyer'],
      whyItMatters: `Buyers in Virginia Beach/Chesapeake routinely underestimate HOA fees when calculating affordability. HOA dues that add $300-600/month to a payment are a surprise that kills deals. A transparent city-by-city guide prevents sticker shock.`,
      brief: `Cover HOA fees across Hampton Roads: what types of communities have HOAs (planned developments, condos, townhomes, some SFR neighborhoods), typical fee ranges by community type in Virginia Beach, Chesapeake, and Norfolk, what HOA fees typically cover (landscaping, common areas, pool, insurance for condos), the Virginia Property Owners Association Act — what documents sellers must provide, buyer's 3-day review and cancellation right, condo resale packages and what to look for (reserve fund health, pending assessments, rental restrictions), and how to factor HOA fees into your buying budget.`,
      targetKeyword: 'HOA fees hampton roads virginia beach',
      cityLabel: 'Hampton Roads',
      matchAllOf: ['hoa', 'fees', 'hampton roads'],
    },
    {
      id: 'retirement-communities:hampton-roads',
      topicGroup: 'retirement-communities',
      title: 'What Are the Best Retirement Communities in Hampton Roads?',
      category: 'lifestyle',
      audiences: ['buyer'],
      whyItMatters: `Renick's equivalent hit +2018%. Hampton Roads has a massive veteran retiree population and attracts out-of-state retirees for the mild climate, oceanfront access, and VA/military benefits. This is a high-volume search with strong buyer intent.`,
      brief: `Cover the best retirement options in Hampton Roads: active adult (55+) communities in Virginia Beach (e.g., areas near the Oceanfront, Kempsville, Great Neck), Chesapeake (Greenbrier, Great Bridge, South Chesapeake), and Suffolk (newer 55+ developments with lower price points), continuing care retirement communities (CCRCs) for those planning for future care needs, independent living communities, VA benefits that make Hampton Roads especially attractive for veteran retirees (BAH for disabled veterans, VA medical center access at Naval Medical Center Portsmouth and Hampton VA), proximity to military retiree resources (commissary, exchange, space-A travel). Include a comparison of cost by area.`,
      targetKeyword: 'best retirement communities hampton roads virginia beach',
      cityLabel: 'Hampton Roads',
      matchAllOf: ['retirement', 'communities', 'hampton roads'],
    },
    {
      id: 'cost-of-living:hampton-roads',
      topicGroup: 'cost-of-living',
      title: 'Is the Cost of Living in Hampton Roads Worth It?',
      category: 'lifestyle',
      audiences: ['buyer'],
      whyItMatters: `Renick's version hit +400%. Out-of-state relocation buyers always run this calculation. Hampton Roads competes for relocators from high-cost metros (DC, NYC, Northern Virginia). A real cost-of-living comparison positions it favorably.`,
      brief: `Give an honest cost-of-living breakdown for Hampton Roads: housing (median prices and rents vs. national average and vs. Northern Virginia/DC corridor), Virginia income taxes and no-tax on military retirement pay, property tax rates by city, groceries and utilities (Hampton Roads runs slightly above national average due to coastal geography), health insurance and healthcare costs, commute costs (Norfolk is among the worst for traffic — be honest), what you get vs. what you give up vs. Northern Virginia or a comparable coastal metro. Include a "Hampton Roads vs. Northern Virginia" comparison table — a common relocation comparison.`,
      targetKeyword: 'cost of living hampton roads virginia worth it',
      cityLabel: 'Hampton Roads',
      matchAllOf: ['cost of living', 'hampton roads'],
    },
    {
      id: 'waterfront-property-cost:hampton-roads',
      topicGroup: 'waterfront-property-cost',
      title: 'What Does It Cost to Buy Waterfront Property in Hampton Roads?',
      category: 'waterfront-living',
      audiences: ['buyer', 'investor'],
      whyItMatters: `Hampton Roads has more waterfront property than almost any metro in the US — Chesapeake Bay, Atlantic Ocean, dozens of rivers, canals, and tidal creeks. This is a top search for both local move-up buyers and out-of-state buyers. Renick's waterfront cost posts were among his top performers.`,
      brief: `Break down waterfront property pricing in Hampton Roads by water type: oceanfront Virginia Beach (highly premium, starting $1M+), bay-front and Chesapeake Bay access properties, canal homes in Kempsville, Great Neck, and Chesapeake (entry-level waterfront), river-front properties in Norfolk, Suffolk, and Isle of Wight County, lake communities. Explain what adds premium (deep water vs. shallow, south-facing, rip-rap vs. bulkhead, dock vs. no dock, FEMA flood zone designation). Include a price range table by water type and city. Note the importance of a tidal survey and flood insurance estimate before making an offer.`,
      targetKeyword: 'cost of waterfront property hampton roads virginia',
      cityLabel: 'Hampton Roads',
      matchAllOf: ['waterfront', 'cost', 'hampton roads'],
    },
    {
      id: 'waterfront-insurance:hampton-roads',
      topicGroup: 'waterfront-insurance',
      title: 'How Much Does Property Insurance Cost for Hampton Roads Waterfront Homes?',
      category: 'waterfront-living',
      audiences: ['buyer'],
      whyItMatters: `Renick's waterfront insurance post hit +1507% and +429%. Insurance is the #1 surprise cost for Hampton Roads waterfront buyers — flood insurance premiums have doubled in many areas post-FEMA Risk Rating 2.0. This is a critical pre-purchase education topic.`,
      brief: `Cover insurance costs for Hampton Roads waterfront buyers: FEMA flood insurance under the NFIP (what it covers, current premium ranges for AE and VE zones in Virginia Beach, Norfolk, and Hampton), the impact of FEMA's Risk Rating 2.0 (2021 overhaul — many Hampton Roads properties saw large premium increases), private flood insurance alternatives and when they're cheaper, wind and hail coverage (Hampton Roads is in a hurricane-exposure zone — what wind insurance adds to premiums), standard homeowners insurance rates for waterfront vs. non-waterfront, elevation certificate and how it can dramatically reduce flood insurance costs, and what to ask a seller before buying waterfront: how much are they currently paying and when were rates last increased?`,
      targetKeyword: 'waterfront home insurance cost hampton roads virginia',
      cityLabel: 'Hampton Roads',
      matchAllOf: ['insurance', 'waterfront', 'hampton roads'],
    },
    {
      id: 'dock-permits:hampton-roads',
      topicGroup: 'dock-permits',
      title: 'What Permits Do You Need for a Dock or Pier in Hampton Roads?',
      category: 'waterfront-living',
      audiences: ['buyer', 'homeowner'],
      whyItMatters: `Hampton Roads waterfront buyers frequently ask whether they can add a dock, improve an existing one, or replace a failing bulkhead. Dock and permit questions come up in nearly every waterfront transaction and most agents can't answer them. This is a high-value niche post.`,
      brief: `Cover dock and pier permitting in Hampton Roads: Virginia Marine Resources Commission (VMRC) permit requirements for new docks and piers, Army Corps of Engineers Section 10/404 permits, local Chesapeake Bay Preservation Act requirements (100-foot Resource Protection Area setbacks), the difference between a private pier vs. shared community dock (common in canal communities), typical permit timelines (VMRC can take 60-120 days), what constitutes "repair/replace in-kind" (doesn't always need a full permit) vs. new construction, bulkhead repair and replacement requirements, and questions every waterfront buyer should ask before closing: is there an existing dock permit? Is the bulkhead in good condition? Are there any outstanding violations?`,
      targetKeyword: 'dock pier permit hampton roads virginia',
      cityLabel: 'Hampton Roads',
      matchAllOf: ['dock', 'permit', 'hampton roads'],
    },
    {
      id: 'investment-properties:hampton-roads',
      topicGroup: 'investment-properties',
      title: 'What Are the Best Investment Properties in Hampton Roads?',
      category: 'investment',
      audiences: ['investor'],
      whyItMatters: `Renick's version hit +112%. Hampton Roads has a unique investment profile: stable military tenant base, tourism-driven short-term rental demand (Virginia Beach Oceanfront), and below-average home prices vs. rent rates that produce positive cash flow in the right neighborhoods.`,
      brief: `Cover investment property options in Hampton Roads: long-term rental neighborhoods with best cap rates (Norfolk near ODU/NSU, parts of Hampton near Langley AFB/Hampton University, inner Chesapeake), military tenant market (reliable but lease terms tied to PCS orders — pros and cons), short-term rental zones in Virginia Beach (Oceanfront resort district allows STRs — explain zoning rules), duplex/small multifamily availability and price ranges, the case for buying near military installations (stable vacancy rates, BAH-backed rents), expected rent-to-price ratios by area, property management costs in Hampton Roads, and what Barry looks for when evaluating investment properties for clients.`,
      targetKeyword: 'best investment properties hampton roads virginia',
      cityLabel: 'Hampton Roads',
      matchAllOf: ['investment', 'properties', 'hampton roads'],
    },
    {
      id: 'what-buyers-need-to-know:hampton-roads',
      topicGroup: 'what-buyers-need-to-know',
      title: 'What Do Hampton Roads Home Buyers Need to Know in 2026?',
      category: 'buying-tips',
      audiences: ['buyer'],
      whyItMatters: `Renick's equivalent hit +429%. This is the "ultimate buyer guide" format — broad enough to capture all buyer searches, deep enough to genuinely help. Serves as a hub piece linking to all of Barry's other buyer content.`,
      brief: `Comprehensive 2026 buyer guide for Hampton Roads: current market conditions (rates, inventory, price trends), the VA loan advantage in this military-heavy market (no down payment, no PMI, assumable — explain all three), pre-approval process and why it matters more in Hampton Roads than elsewhere (fast-moving inventory in $300-500K range), how to compete without waiving contingencies, neighborhood selection considerations (flood zone, commute, school districts, HOA), what to budget beyond the purchase price (inspection, closing costs, moving, first-year repairs), how the military PCS timeline affects home searches, and a "10 steps to buying in Hampton Roads" checklist. Position Barry's team as the guide through all of it.`,
      targetKeyword: 'hampton roads home buyer guide 2026',
      cityLabel: 'Hampton Roads',
      matchAllOf: ['buyers', 'need to know', 'hampton roads'],
    },
    {
      id: 'sell-home-fast:hampton-roads',
      topicGroup: 'sell-home-fast',
      title: 'How Do You Sell a Hampton Roads Home Fast and Profitably?',
      category: 'selling-tips',
      audiences: ['seller'],
      whyItMatters: `Renick's equivalent was among his top new-post performers. Sellers who need to move on a PCS timeline, divorce, or estate situation search this urgently. The combination of "fast" and "profitably" captures both urgency and concern about leaving money on the table.`,
      brief: `Practical guide to selling quickly in Hampton Roads without sacrificing price: pre-listing prep that compresses time (staging, professional photos, pre-inspection to clear known issues), pricing strategy for fast sale (how to find the "just under market" price that triggers multiple offers), the 72-hour launch strategy (coming soon → on-market), handling multiple offers quickly, contingency management to speed up the contract timeline, how to coordinate a fast sale with a simultaneous purchase, working the military PCS timeline (April-July is peak demand from military buyers — how to align listing with this window), and what Barry's team does specifically to accelerate listings in Hampton Roads.`,
      targetKeyword: 'how to sell hampton roads home fast profitably',
      cityLabel: 'Hampton Roads',
      matchAllOf: ['sell', 'fast', 'hampton roads'],
    },
  ]
}

// ─── Full registry ──────────────────────────────────────────────────────────

export const REQUIRED_TOPICS: TopicGoal[] = [
  // Original evergreen templates
  ...costToBuyGoals(),
  ...costToSellGoals(),
  ...propertyTaxBuyerGoals(),
  ...comparisonGoals(),
  ...goodTimeToBuyGoals(),
  afterOfferAcceptedGoal(),
  ...floodZoneBuyerGoals(),
  // Renick-validated winning formats (adapted for Hampton Roads)
  ...closingCostsBuyerGoals(),
  ...closingCostsSellerGoals(),
  ...homeStageToSellGoals(),
  ...marketOutlookGoals(),
  ...risksOfWaitingGoals(),
  ...relocateCostGoals(),
  ...buyingVsRentingGoals(),
  // Virginia / Hampton Roads one-off evergreen goals
  ...virginiaTransactionGoals(),
]

// ─── Match logic ────────────────────────────────────────────────────────────

/** Returns true if a Sanity post covers this goal (title OR slug contains all match strings). */
export function postMatchesGoal(
  post: { title: string; slug: string },
  goal: TopicGoal,
): boolean {
  let haystack = `${post.title} ${post.slug}`.toLowerCase()

  // Disambiguate: when matching "Hampton" alone, strip "hampton roads" first so
  // a Hampton Roads post doesn't false-match the city of Hampton.
  if (goal.matchAllOf.some((s) => s.toLowerCase() === 'hampton') &&
      !goal.matchAllOf.some((s) => s.toLowerCase() === 'hampton roads')) {
    haystack = haystack.replace(/hampton[\s-]+roads/g, '___')
  }

  return goal.matchAllOf.every((needle) => haystack.includes(needle.toLowerCase()))
}
