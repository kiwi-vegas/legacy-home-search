# Legacy Home Search — Blog Pipeline

## Overview

Two complementary content pipelines feed the `/blog` listing page:

1. **Daily blog pipeline** — automated research, operator picks articles, Claude writes posts with AI hero images, published to Sanity CMS
2. **Monthly market reports pipeline** — Barry uploads Altos Research PDFs, Claude reads and writes full reports, published automatically to Sanity. Full details in `MARKET_REPORTS.md`.

Both appear together in the `/blog` listing, merged and sorted by date. A category filter bar at the top lets readers filter by type.

**Market:** Virginia Beach, Chesapeake, Norfolk, Suffolk, Hampton, Newport News (Hampton Roads, VA)
**Blog page title:** Hampton Roads Real Estate Blog
**Sanity project ID:** `2nr7n3lm`
**Production URL:** `https://legacyhometeamlpt.com`

---

## Admin Pages

All admin pages are secret-gated via `?secret=ADMIN_SECRET`. Never share these URLs publicly.

| Page | URL | Purpose |
|---|---|---|
| Blog Picker | `/admin/blog-picker/[date]?secret=…` | Operator selects which researched articles to publish |
| Blog Dashboard | `/admin/blog-dashboard?secret=…` | Effectiveness dashboard — post stats, category breakdown, GA4 KPIs |
| Thumbnail Review | `/admin/thumbnail-review?secret=…` | Generate/upload/approve hero thumbnails for posts missing cover images |

---

## Blog Effectiveness Dashboard

**URL:** `/admin/blog-dashboard?secret=ADMIN_SECRET`

A single-page dashboard showing the health and performance of the blog content operation. Split into two data sources:

### Sanity Data (live, always populated)
- **Total posts published** — running count of all blog posts in Sanity
- **Posting frequency** — calculated posts/week based on publish history
- **Category breakdown** — count per category (Market Update, Buying Tips, Selling Tips, etc.)
- **Full post table** — every post with title, category, publish date, and days since published

### GA4 Traffic KPIs (populated once GA4 accumulates data)
GA4 measurement ID is injected site-wide. The dashboard displays these metric cards:
- Organic sessions (last 30 days)
- Total blog pageviews (last 30 days)
- Avg. time on page
- Top 5 posts by pageviews

Until enough data exists, metric cards show `—`. View live traffic at **analytics.google.com** (property `NEXT_PUBLIC_GA_MEASUREMENT_ID`).

**To add live GA4 API data:** Create a Google service account, grant it Viewer access to the GA4 property, and add `GA4_PROPERTY_ID` + `GA4_SERVICE_ACCOUNT_JSON` env vars. Then update the dashboard to call the GA4 Data API.

### Industry Benchmark Table
The dashboard includes a static benchmark reference table comparing the operation against industry standards:

| Metric | Industry Avg | Good | Excellent |
|---|---|---|---|
| Posts/week | 1–2 | 3–4 | 5+ |
| Avg. time on page | 1:30 | 2:30 | 4:00+ |
| Organic sessions (30d) | 500 | 2,000 | 5,000+ |
| Email CTR | 2% | 5% | 10%+ |

---

## Thumbnail Review & Management

See **[THUMBNAIL.md](./THUMBNAIL.md)** for the full thumbnail pipeline — design goals, prompt strategy, mood system, community photos, admin workflow, and iteration history.

**URL:** `/admin/thumbnail-review?secret=ADMIN_SECRET`

---

## GA4 Tracking

GA4 is loaded globally in `app/layout.tsx` via Next.js `<Script>` tags with `strategy="afterInteractive"`.

```tsx
{process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
  <>
    <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
    <Script id="ga4-init" strategy="afterInteractive">
      {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}
        gtag('js',new Date());gtag('config','${GA_ID}');`}
    </Script>
  </>
)}
```

Setting `NEXT_PUBLIC_GA_MEASUREMENT_ID` in `.env.local` (and in Vercel environment variables) activates tracking. Leaving it unset disables GA entirely — no tracking on localhost.

**To set up GA4 for a new client:**
1. Create a GA4 property at analytics.google.com
2. Copy the Measurement ID (format: `G-XXXXXXXXXX`)
3. Add `NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX` to Vercel environment variables
4. Redeploy — tracking is live immediately

---

## Community Listings on Blog Posts

Every blog post automatically shows a **live MLS listings section** at the bottom of the page, below the post body and CTA, powered by YLOPO's results widget.

### Community detection
`detectCommunities(title, slug)` in `app/(site)/blog/[slug]/page.tsx` scans the post title and slug for community keywords:

| Keyword match | Widget shown |
|---|---|
| "virginia beach" or "virginia-beach" | Virginia Beach listings |
| "chesapeake" | Chesapeake listings |
| "norfolk" | Norfolk listings |
| "hampton" (but NOT "hampton roads") | Hampton listings |
| "newport news" or "newport-news" | Newport News listings |
| "suffolk" | Suffolk listings |
| No community detected | Hampton Roads-wide (all 6 cities) |

"Hampton Roads" (space or hyphen) is stripped from the text before the Hampton check to prevent false positives on general market posts.

### Single community
Shows: `View {City} Homes For Sale` heading + 12 MLS listings + `View All {City} Homes →` button.

### Multiple communities (comparison posts)
Shows tabbed interface — one tab per detected community. All widget divs remain in the DOM (hidden via `display: none`); only the active tab's widget is visible. This prevents YLOPO from needing to reinitialize on tab switch.

### YLOPO initialization on blog posts
`YlopoInit.tsx` triggers a `window.location.reload()` on soft navigation to reinitialize YLOPO's script. The blog INDEX page (`/blog`) is excluded from this reload (no widgets there). Individual post pages (`/blog/[slug]`) are NOT excluded and do trigger the reload, ensuring widgets initialize correctly when navigating from the blog listing.

---

## Daily Flow

```
6:00 AM PT (Vercel Cron)
  └─ /api/cron/research
       ├─ Tavily searches 8 queries (3 pinned Virginia Beach + 5 rotating)
       ├─ Claude Opus scores & categorizes top 10 articles
       ├─ Stores results in Upstash Redis (48hr TTL)
       └─ Sends digest email to operator

Operator opens email
  └─ Clicks "Pick Articles to Publish →"
       └─ /admin/blog-picker/[date]?secret=ADMIN_SECRET
            ├─ Shows up to 10 articles with scores and summaries
            ├─ Operator selects 1–5 articles
            └─ Clicks "Publish X Posts →"

                 └─ /api/blog/publish (POST)
                      ├─ For each selected article (in parallel):
                      │    ├─ Claude Sonnet writes full blog post
                      │    └─ Image generation pipeline (see below)
                      ├─ Images uploaded to Sanity CDN
                      ├─ Posts published to Sanity CMS
                      └─ Live at /blog within 60 seconds (ISR revalidation)

After publishing (optional)
  └─ /admin/thumbnail-review?secret=ADMIN_SECRET
       ├─ Review AI-generated thumbnails for each post
       ├─ Reject with feedback → regenerate
       ├─ Or upload your own image
       └─ Approve & Apply → live immediately
```

---

## Market & Research Priorities

**ALL articles must be about Virginia Beach, Chesapeake, Norfolk, Suffolk, Hampton Roads, or directly relevant Virginia law/policy.**
Articles about Las Vegas, California, Texas, Florida, or any other non-Virginia market are scored 1 and dropped.

Claude gives extra weight to these high-value topics:

### 1. Virginia Beach / Hampton Roads Property Values & Investment
- Home price forecasts and appreciation trends across Hampton Roads
- Rental market returns and investment property outlook
- Virginia Beach, Chesapeake, Norfolk, Suffolk neighborhood comparisons
- What market conditions mean for current homeowners and buyers

### 2. Virginia Law Changes Affecting Homeowners
- Property tax changes and exemptions
- HOA regulation updates
- Zoning and land use changes
- Tenant/landlord law updates
- Any Virginia legislation affecting real estate transactions

### 3. Major Development Projects (Economic Growth Signals)
- Port of Virginia expansions and related economic growth
- Military base investments (NAS Oceana, Norfolk Naval Station, Langley AFB)
- Corporate relocations and new employers in Hampton Roads
- Infrastructure and community development projects
- Job-creating projects signaling long-term housing demand

### 4. Military & Defense Sector News
- Base realignment or expansion news affecting housing demand
- PCS (Permanent Change of Station) season trends
- New military commands or units relocating to Hampton Roads
- Defense contractor hiring affecting local economy

### 5. Major Employers Expanding in Hampton Roads
- Large companies building facilities in the region
- Corporate HQ relocations to Virginia Beach or Chesapeake
- Tech, logistics, or manufacturing companies entering the market
- Any investment that signals economic growth and housing demand

---

## Image Generation Pipeline

See **[THUMBNAIL.md](./THUMBNAIL.md)** for the full pipeline — Barry Jenkins thumbnail system, GPT-4o prompt strategy, community photos, and fallback chain.

### Fallback chain summary
1. **OpenAI gpt-image-1** via `images.edit()` — Barry's photo as base, GPT-4o writes the design prompt (primary)
2. **Gemini** — community background scenes (fallback)
3. **OG image** scraped from article URL
4. **Unsplash API** (requires `UNSPLASH_ACCESS_KEY`)
5. **Fallback image pool** — pre-curated Unsplash URLs, deterministic pick by article URL hash

---

## Blog Listing Page (`/blog`)

**Title:** Hampton Roads Real Estate Blog

Both blog posts and market reports are fetched in parallel and merged into a single feed sorted by `publishedAt` descending:
- `getBlogPosts(24)` — regular blog posts
- `getMarketReports(12)` — published market reports

### Category Filter Tabs
Filter tabs appear at the top of the grid. Only tabs with at least one published post are shown. Tabs are server-rendered links using `?category=` URL params — no JavaScript required, URLs are shareable.

| Tab label | Filter value | What it shows |
|---|---|---|
| All | *(none)* | Everything |
| Market Reports | `market-report` | Monthly Altos reports only |
| Market Update | `market-update` | Blog posts in that category |
| Buying Tips | `buying-tips` | Blog posts in that category |
| Selling Tips | `selling-tips` | Blog posts in that category |
| Community Spotlight | `community-spotlight` | Blog posts in that category |
| Investment | `investment` | Blog posts in that category |
| News | `news` | Blog posts in that category |

### Market Report Cards (on `/blog`)
- Badge: **Market Report**
- Title format: `{communityName} Real Estate Market Trends Data, {reportPeriod}`
- Excerpt: first 120 chars of `marketSummary`
- Meta row: `reportPeriod` + `medianListPrice` (in blue)
- Link: `/market-reports/{slug}`

---

## Blog Post Page (`/blog/[slug]`)

### Hero image
The hero image at the top of each post uses:
- `objectFit: 'cover'` — fills the container
- `objectPosition: 'top'` — anchors the top of the image so community name text and graphic elements (which sit in the upper portion) are always fully visible
- `max-height: 48vh` — prevents the image from dominating the viewport on large screens; always stays at or below half the screen height
- Sanity delivers the image at full width (`width(1920)`) without a height crop

### Community listings widget
`BlogCommunityListings` component renders below the post body. See **Community Listings on Blog Posts** section above.

---

## Article Selection Rules

- **Volume**: Research fetches up to 30 articles per day, scores top 10 for display
- **Flexibility**: Operator can select 1–5 articles per day
- **No repeats**: Articles skipped twice are permanently filtered (Redis `article_shown_counts`)
- **Query structure**: 3 Virginia Beach queries are **pinned and run every single day** — guaranteed local content. 5 additional slots rotate through 22 broader Hampton Roads/law/military/development queries for variety.

### Pinned Daily Queries (Virginia Beach — always run)
```
'Virginia Beach real estate market news 2026'
'Virginia Beach home prices sales market update 2026'
'Virginia Beach housing market trends buyers sellers 2026'
```

### Rotating Query Pool (5 slots/day cycle through these)
- Hampton Roads housing market trends / investment / rental returns
- Chesapeake / Norfolk real estate market
- Virginia homeowner/HOA/property tax/zoning law changes
- Hampton Roads major development, port expansion, corporate relocation
- Military relocation / PCS / Naval Station housing
- Virginia Beach new construction, oceanfront/waterfront, neighborhoods, condos, schools, first-time buyers

---

## Article Categories

| Category | Label | Color |
|---|---|---|
| `market-update` | Market Update | Blue `#2563eb` |
| `buying-tips` | Buying Tips | Green `#4CAF50` |
| `selling-tips` | Selling Tips | Sky `#0ea5e9` |
| `community-spotlight` | Community Spotlight | Purple `#9C27B0` |
| `investment` | Investment | Orange `#FF9800` |
| `news` | News | Slate `#607D8B` |

---

## Blog Post Writing

Each post is written by Claude Sonnet 4.6 as a Virginia Beach real estate professional at **Legacy Home Search**. Voice is:
- Knowledgeable and approachable, never salesy
- Ties national or Virginia news back to the local Hampton Roads / Virginia Beach market
- Always includes a "## What This Means For You" section with 3–4 bullet points

Post structure:
1. Rewritten engaging headline
2. Intro paragraph
3. 2–3 body sections with `##` headings
4. `## What This Means For You` (3–4 bullet points)
5. Closing paragraph
6. Source credit (linked)

---

## Environment Variables Required

| Variable | Purpose |
|---|---|
| `ANTHROPIC_API_KEY` | Claude Sonnet (writing + prompt building) + Claude Opus (scoring) |
| `GOOGLE_API_KEY` | Gemini/Imagen image generation (primary, blog posts) |
| `OPENAI_API_KEY` | DALL-E 3 — fallback for blog posts; **primary** for market report covers |
| `TAVILY_API_KEY` | Article research searches |
| `UPSTASH_REDIS_REST_URL` | Article storage (48hr TTL) |
| `UPSTASH_REDIS_REST_TOKEN` | Redis auth |
| `RESEND_API_KEY` | All email delivery (digest, market report ready, monthly reminder) |
| `FROM_EMAIL` | Sender address |
| `OPERATOR_EMAIL` | Blog digest recipient |
| `BARRY_EMAIL` | Agent email — monthly Altos upload reminder |
| `ADMIN_SECRET` | Auth for all admin pages and API routes |
| `ADMIN_PIN` | Short memorable password for the `/upload` gateway (falls back to `ADMIN_SECRET`) |
| `CRON_SECRET` | Auth for Vercel cron jobs |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | Sanity project ID |
| `NEXT_PUBLIC_SANITY_DATASET` | `production` |
| `NEXT_PUBLIC_APP_URL` | Production URL |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | GA4 Measurement ID (format: `G-XXXXXXXXXX`) — activates tracking site-wide and in dashboard |
| `UNSPLASH_ACCESS_KEY` | Optional — Unsplash fallback images |

**IMPORTANT:** Always use `printf` (not `echo`) when setting env vars via Vercel CLI — `echo` adds a trailing newline that corrupts the value and causes Unauthorized errors:
```bash
printf 'your-value' | npx vercel env add VAR_NAME production
```

---

## Manual Testing

### Trigger research manually (POST):
```bash
curl -X POST https://your-domain.com/api/cron/research \
  -H "Content-Type: application/json" \
  -d '{"secret": "YOUR_ADMIN_SECRET"}'
```

### Access article list for a date:
```
GET /api/articles/2026-04-18?secret=YOUR_ADMIN_SECRET
```

### Publish a specific article directly (bypasses Redis pipeline — useful for one-off tests):
```bash
npx tsx --env-file=.env.local scripts/test-publish.ts
```
Edit `scripts/test-publish.ts` to set the article URL, title, category, and `whyItMatters` before running.

### Test thumbnail generation for a post:
```bash
curl -X POST https://your-domain.com/api/blog/generate-thumbnail \
  -H "Content-Type: application/json" \
  -d '{"postId":"SANITY_DOC_ID","title":"Post Title","category":"market-update","excerpt":"...","slug":"post-slug","secret":"YOUR_ADMIN_SECRET"}'
```

---

## Key Files

### Blog Pipeline
| File | Purpose |
|---|---|
| `lib/research.ts` | Tavily searches + Claude scoring — Hampton Roads queries only |
| `lib/writer.ts` | Claude writes blog post as Legacy Home Search professional |
| `lib/image-gen-gemini.ts` | Gemini image generation — Hampton Roads visual anchors (blog posts) |
| `lib/image-gen.ts` | DALL-E 3 fallback for blog post images |
| `lib/image-gen-market-report.ts` | DALL-E 3 image gen for market reports — YouTube/financial illustration style |
| `lib/images.ts` | Orchestrates full image fallback chain |
| `lib/email.ts` | All emails: blog digest, market report ready, monthly Altos reminder |
| `lib/store.ts` | Upstash Redis read/write |
| `lib/sanity-write.ts` | Publishes content to Sanity CMS |
| `app/api/cron/research/route.ts` | Daily blog research cron |
| `app/api/blog/publish/route.ts` | Blog publish endpoint (1–5 articles) |
| `app/admin/blog-picker/[date]/page.tsx` | Operator article selection UI |
| `app/(site)/blog/page.tsx` | Blog listing — merges posts + market reports, category filter tabs |
| `app/(site)/blog/[slug]/page.tsx` | Individual post page — hero, body, community listings widget |

### Admin & Dashboard
| File | Purpose |
|---|---|
| `app/admin/blog-dashboard/page.tsx` | Effectiveness dashboard — Sanity post stats + GA4 KPI cards |
| `app/admin/thumbnail-review/page.tsx` | Card UI to generate, upload, approve/reject thumbnails per post |
| `app/api/blog/dashboard-data/route.ts` | Returns all posts with category counts and recent activity from Sanity |
| `app/api/blog/generate-thumbnail/route.ts` | Calls `fetchAndUploadCoverImage()` with optional feedback; returns `{assetRef, previewUrl}` |
| `app/api/blog/upload-thumbnail/route.ts` | Accepts `multipart/form-data` image upload; stores in Sanity CDN; returns `{assetRef, previewUrl}` |
| `app/api/blog/apply-thumbnail/route.ts` | Patches `coverImage` on a Sanity blog post document |

### Community Listings
| File | Purpose |
|---|---|
| `components/BlogCommunityListings.tsx` | YLOPO widget section rendered at bottom of every blog post; handles single/tabbed/fallback states |
| `components/YlopoInit.tsx` | Triggers page reload on soft navigation to reinitialize YLOPO — excludes `/blog` index but allows `/blog/[slug]` |

### Market Reports Pipeline
| File | Purpose |
|---|---|
| `app/upload/page.tsx` | `/upload` gateway — password form with 7-day session cookie |
| `app/admin/market-reports/upload/page.tsx` | Drag-and-drop multi-PDF upload form with per-file status + recent reports list |
| `app/api/market-reports/auto-publish/route.ts` | PDF → Claude → DALL-E cover → Sanity (published immediately, city detected from filename) |
| `app/api/market-reports/recent/route.ts` | Returns last 10 reports for admin display |
| `app/(site)/market-reports/page.tsx` | Public market reports listing |
| `app/(site)/market-reports/[slug]/page.tsx` | Individual report page |
| `app/api/cron/market-reports/route.ts` | 1st of month: sends agent upload reminder + missing-reports safety check |

### Cron Schedule (`vercel.json`)
| Schedule | Route | What it does |
|---|---|---|
| `0 13 * * *` (6 AM PT daily) | `/api/cron/research` | Daily blog research + digest email |
| `0 14 1 * *` (7 AM PT, 1st of month) | `/api/cron/market-reports` | Sends monthly Altos upload reminder; checks for missing reports |

---

## Enhanced Category Strategy
*Updated based on Renick Blog Effectiveness Dashboard analysis — April 2026*

### Two New Categories

**`cost-breakdown`** — Dedicated cost/fee/price explainer posts. Renick's #1 format by lift (5 of his top 10 posts). Currently buried inside buying-tips/selling-tips. Give it its own lane. Every post must include a summary table in the first third of the post.

Example titles:
- "What Are the Closing Costs for Buyers in Virginia Beach — Full Breakdown"
- "How Much Does a Home Inspection Cost in Hampton Roads in [Year]?"
- "What Are the HOA Fees in Virginia Beach's Top Neighborhoods?"

**`flood-and-risk`** — Flood zone classification, insurance costs, sea level rise, and environmental risk for Hampton Roads. Norfolk is one of the fastest-sinking US cities. Flood insurance can add hundreds/month to buyer costs. Renick's insurance post drove +1829% lift — his single highest. Currently zero coverage in the pipeline.

Example titles:
- "What Flood Zone Is My Home In — How to Check Any Hampton Roads Address"
- "How Much Does Flood Insurance Cost in Virginia Beach? [Year] Rates by Zone"
- "Is Norfolk Sinking? What Sea Level Rise Means for Home Buyers Right Now"

---

### Format Rules (All Categories)

1. **Question-led titles by default.** "What Does It Cost...", "How Do... Work?", "Is X or Y Better?" Only use statement titles when question form is awkward.
2. **Include a real number in the title** whenever possible.
3. **Cost breakdown posts:** Summary table required, placed in the first third of the post.
4. **Comparison posts:** Must end with an explicit "Best For..." conclusion — don't leave the reader to decide.
5. **Process guides:** Numbered steps, not prose. Each step: what happens, who does it, how long.
6. **All market posts:** "What This Means For Hampton Roads Buyers/Sellers" section is non-negotiable.
7. **Military-angle posts:** Specify active duty vs. veterans vs. both. BAH rates, VA loan entitlement, and PCS timelines vary.

---

### Search Query Templates by Category

```
market-update:
  "Hampton Roads home prices [current year]"
  "Virginia Beach housing market inventory [current month year]"
  "Norfolk days on market real estate [current quarter year]"
  "Chesapeake Suffolk home sales data [current year]"

buying-tips:
  "VA loan requirements Virginia Beach [current year]"
  "first time home buyer programs Virginia VHDA [current year]"
  "attorney closing requirement Virginia real estate"
  "BAH rates Norfolk Virginia Beach [current year]"

selling-tips:
  "seller closing costs Virginia [current year]"
  "seller concessions Hampton Roads real estate"
  "home sale timeline Norfolk Chesapeake [current year]"
  "Virginia real estate commission rates [current year]"

community-spotlight:
  "Virginia Beach vs Chesapeake cost of living comparison"
  "best neighborhoods Norfolk military families"
  "Hampton Roads school district ratings [current year]"
  "new development projects Virginia Beach Norfolk [current year]"

investment:
  "Virginia Beach short term rental regulations [current year]"
  "rental property cap rates Norfolk Hampton Roads"
  "Airbnb income Virginia Beach oceanfront [current year]"
  "VA loan house hacking strategy [current year]"

news:
  "Virginia real estate law changes [current year]"
  "Norfolk Virginia Beach zoning news [current year]"
  "HOA regulations Virginia [current year]"
  "FHA VA loan limit changes [current year]"

cost-breakdown:
  "closing costs buyer Virginia Beach [current year]"
  "home inspection cost Hampton Roads [current year]"
  "HOA fees Virginia Beach neighborhoods [current year]"
  "property tax rates Hampton Roads cities comparison"

flood-and-risk:
  "FEMA flood zone Virginia Beach Norfolk map"
  "flood insurance cost Hampton Roads [current year]"
  "elevation certificate Virginia Beach Norfolk"
  "Norfolk sea level rise home values impact [current year]"
```
