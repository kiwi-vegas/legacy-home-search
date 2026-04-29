/**
 * Creates a manually-written blog post and saves it to Sanity as media_pending.
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/create-manual-post.ts
 *
 * Edit the post object below to customize the article. Body uses markdown:
 *   ## h2 / ### h3 / - bullets / [text](url) external links
 * The links auto-render as target="_blank" via the PortableText component.
 */

import { publishBlogPost } from '../lib/sanity-write'
import { markdownToPortableText } from '../lib/portable-text-utils'
import type { BlogPostDraft } from '../lib/types'

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .slice(0, 96)
}

const title = 'Are You Overpaying Property Taxes in Virginia Beach in 2026?'

const excerpt = `Most homeowners in Virginia Beach pay their 2026 property tax bill without ever checking if the city's assessed value of their home is actually accurate. Here's a 2-minute check to see if you're over-assessed — and what to do about it if you are.`

const metaTitle = 'Virginia Beach Property Taxes 2026: Are You Overpaying?'

const metaDescription = `A 2026 step-by-step from a Hampton Roads agent: how to check if your Virginia Beach assessed value is too high — and what to do if it is.`

const body = `Most homeowners in Virginia Beach and across Hampton Roads pay their property tax bill every year without ever stopping to ask: is the city's value of my home actually right? It's an easy step to skip. The bill comes, you pay it, and life moves on.

But here's the thing — assessments aren't always accurate, especially after the run-up in home values we've seen heading into 2026. And if your home is over-assessed, you're paying more in property tax than you should. The good news is that figuring out whether your 2026 assessed value looks reasonable takes about two minutes. Here's how I'd walk a friend through it.

## Step 1: Do a 2-Minute Value Check

Before you do anything formal, you want a quick read on whether your assessed value is in the right ballpark. Here's how:

- Find your assessed value. Look at your property tax bill, or search your address on the [City of Virginia Beach Real Estate Assessor](https://www.vbgov.com/government/departments/real-estate-assessor) site. Other Hampton Roads localities — [City of Norfolk](https://www.norfolk.gov/government/city-departments/real-estate-assessor), [City of Chesapeake](https://www.cityofchesapeake.net/government/city-departments/real-estate-assessor), [City of Suffolk](https://www.suffolkva.us/268/Real-Estate-Assessor), [City of Hampton](https://hampton.gov/207/Real-Estate-Assessor), and [City of Newport News](https://www.nnva.gov/118/Real-Estate-Assessor) — each have their own assessor pages.

- Compare to recent sales. Pull up what similar homes in your neighborhood have actually sold for in the last 6–12 months. If you don't want to dig through MLS records, ask me for a quick comparative market analysis (CMA) — I'll send one over.

- Use a simple rule of thumb. If comparable homes are selling noticeably lower than what the city says your home is worth, that's a strong signal you might be over-assessed. Even a difference of $20,000–$30,000 can mean real money on your tax bill.

- Factor in your home's condition. Mass assessments don't account for whether your home has dated kitchens, an old roof, or deferred maintenance. If your house isn't in line with the assumed condition, the assessed value could be too high.

A quick check like this won't be perfect, but it'll tell you whether it's worth taking a closer look.

## Step 2: Your Options If the Value Looks Off

Let's say you've done the quick check and your assessed value seems too high. Now what?

- Start with a friendly call. You can contact your local assessor's office and ask them to review your assessment. Bring recent sales of comparable homes, photos showing condition issues, or a recent appraisal that supports a lower value. Sometimes that conversation alone resolves it.

- Consider a formal appeal. If the informal review doesn't go your way and you still believe the value is wrong, every Hampton Roads city has an official assessment appeal process. There's usually a specific filing period each year and required forms. Always check your locality's website or call directly for the current rules and deadlines — those vary city to city, and they change.

- Pay your bill on time anyway. Even if you're disputing or appealing your assessment, you still need to pay by the due date. Any reduction comes later as an adjustment or refund. Missing a payment to make a point just creates headaches.

## Step 3: Get a Local Reality Check

If you're not sure whether your assessed value is reasonable — and you don't want to spend hours digging through comps yourself — that's exactly the kind of thing I help with all the time. No pressure, no obligation.

What I'll send you:

- A quick CMA with recent local sales for homes similar to yours.

- A plain-English read on whether it looks like your assessment is in the right range or worth a second look.

If it does seem worth exploring an appeal, you'll have real numbers to back up the conversation. And if everything looks fair, you'll have peace of mind knowing you're not overpaying.

One thing I'll always say: don't wait until the last week of an appeal deadline to ask for help. The earlier you start looking at this, the more options you have.

## Bonus: Other Ways Some Owners Save

While we're on the subject of property taxes, it's worth knowing there are sometimes other savings available beyond just challenging your assessment:

- Basic homeowner tax relief or exemptions for primary residences (where available)

- Programs for qualifying seniors and homeowners with disabilities

- Real estate tax relief for [disabled veterans and surviving spouses](https://www.tax.virginia.gov/disabled-veterans-real-property-tax-exemption), which Virginia offers at the state level

These programs vary by locality and have their own eligibility rules, so the best move is to check directly with your city or county tax office or a qualified tax professional. The goal here is just to make sure you know to ask — a lot of homeowners qualify for things they never apply for.

## Important Note

This article is general information, not legal or tax advice. Property tax rules, deadlines, and forms vary by locality and change over time. Always confirm current procedures and deadlines with your local assessor's office, your city or county tax office, or a qualified tax or legal professional before taking action.

If you're a homeowner in Virginia Beach or anywhere in coastal Virginia and you want a quick, honest look at whether your assessed value seems fair — reach out. It's the kind of thing I'm happy to help my neighbors with.`

async function main() {
  const draft: BlogPostDraft = {
    title,
    slug: slugify(title),
    excerpt,
    category: 'cost-breakdown',
    metaTitle,
    metaDescription,
    body: markdownToPortableText(body),
    sourceUrl: '',
    sourceTitle: '',
  }

  const id = await publishBlogPost(draft)
  console.log(`✓ Created post in Sanity: ${id}`)
  console.log(`  Title: ${title}`)
  console.log(`  Status: media_pending → visible in /admin/va-queue`)
}

main().catch((err) => {
  console.error('Failed:', err)
  process.exit(1)
})
