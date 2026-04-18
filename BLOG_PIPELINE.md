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

**URL:** `/admin/thumbnail-review?secret=ADMIN_SECRET`

A card-based UI showing every blog post that is **missing a cover image**. Each card supports:

### Per-card actions

**Generate AI Thumbnail**
1. Click **Generate Thumbnail** — calls `POST /api/blog/generate-thumbnail`
2. Gemini generates a 16:9 image using the 3-layer thumbnail psychology (see Image Generation Pipeline below)
3. Thumbnail preview appears on the card (~30–60 seconds)
4. Click **✓ Approve & Apply** — saves to Sanity and goes live immediately
5. Click **✕ Reject** — shows feedback textarea
   - Type feedback (e.g., "More blue tones, Chesapeake waterfront, no arrow graphics")
   - Click **Regenerate with Feedback** (or ⌘↵) — feedback is injected into the image prompt
   - Repeat until satisfied, then Approve & Apply

**Upload Your Own Image**
1. Click **Upload Your Own** (from idle state) — opens file picker
2. Select any image file — uploads directly to Sanity CDN via `POST /api/blog/upload-thumbnail`
3. Your image appears as the preview
4. Approve & Apply to set it live, or click **↑ Replace with your own** to swap it again

### Batch generation
The **Generate All N Missing** button at the top runs AI generation for all idle cards sequentially (one at a time to avoid API rate limits). Each card transitions through generating → review states as it completes.

### How feedback is injected
The `feedback` text is appended to the `whyItMatters` field of the `ScoredArticle` passed to Gemini's prompt builder:
```
REVISION FEEDBACK: {feedback}. Please adjust the image concept to address this specific feedback.
```
This ensures Gemini incorporates the specific feedback without overriding the category/community context.

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

### Primary: Gemini 3 Pro Image Preview (requires `GOOGLE_API_KEY`)

Every hero image is built using **3-step thumbnail psychology**:

1. **Visual Stun Gun** — The image stops the scroll. Would someone slow their thumb for this?
2. **Title Value Hunt** — After stopping, the reader scans the headline. The image makes it feel MORE urgent and relevant.
3. **Visual Validation** — The reader returns to the image to confirm the article is worth reading.

**Step 1 — Pick community background photo (if available)**
`getRandomCommunityPhoto()` in `lib/image-gen-gemini.ts` checks `public/community-photos/[city-slug]/` for any image files (JPG, JPEG, PNG, WEBP). If photos exist for that community, one is selected at random and passed to Gemini as the background. If no photos exist, Gemini generates the background from scratch.

**Step 2 — Claude builds the 3-layer prompt**
Claude Sonnet analyzes the article's title, `whyItMatters`, and category, then writes a prompt covering:
- **Layer 1** — Background scene: if a real photo was picked, instructs Gemini to enhance it with cinematic color grading (golden hour warmth, deeper sky, vibrancy) without altering the scene. If no photo, instructs Gemini to generate a Hampton Roads scene from the visual anchors below.
- **Layer 2** — Text overlay (required): community name in large script/serif lettering in the upper portion; 3–5 word hook text below it in bold sans-serif
- **Layer 3** — Graphic elements (required): category-specific icons — arrows, dollar signs, charts for market-update; checkmarks/stars for buying-tips; etc.

**Hampton Roads visual anchors (used when no background photo is provided):**
- Virginia Beach oceanfront at golden hour — warmth, lifestyle, aspiration
- Chesapeake Bay with tidal marshes — depth, permanence, natural wealth
- Norfolk waterfront skyline at dusk — economic momentum, urban energy
- Colonial or craftsman homes on tree-lined streets — community, stability, roots
- Port of Virginia cranes — economic scale, growth, jobs
- Naval vessels in the distance — military community, Hampton Roads identity
- Aerial neighborhoods — scale, growth, investment opportunity

**Step 3 — Gemini generates the image**
`gemini-3-pro-image-preview`, 16:9. When a background photo is provided, it is passed as an inline image alongside the prompt so Gemini uses it as the photographic base and composites text/graphics on top. Output: base64 PNG.

**Step 4 — Upload to Sanity CDN** — stored as `google-ai-cover-{timestamp}.png`

### Fallback Chain (if Gemini fails)

5. **Imagen 4.0** (`imagen-4.0-generate-001`) — text prompt only (no image input), 16:9
6. **Gemini 2.5 Flash Image** (`gemini-2.5-flash-image`) — same multimodal input as primary
7. **DALL-E 3** (requires `OPENAI_API_KEY`) — 1792×1024 HD
8. **OG image** scraped from the source article URL
9. **Unsplash API** (requires `UNSPLASH_ACCESS_KEY`) — category-matched query
10. **Fallback image pool** — pre-curated Unsplash URLs per category, deterministic pick by article URL hash

---

## Community Photo Pools

Curated landmark photos are stored in `public/community-photos/[city-slug]/` and used as the background layer for thumbnails. This ensures each community has a distinctive, real-world look instead of AI-generated scenes that can look similar across cities.

### Folder structure
```
public/community-photos/
  virginia-beach/     ← photos (any JPG/JPEG/PNG/WEBP, any filename)
  chesapeake/         ← 5 cinematic photos
  norfolk/            ← 5 cinematic photos
  suffolk/            ← 5 cinematic photos
  hampton/            ← 5 cinematic photos
  newport-news/       ← 5 cinematic photos
```

### How to add or replace photos
1. Drop any JPG, JPEG, PNG, or WEBP file into the community's folder — no fixed naming required
2. Push to main and Vercel redeploys automatically
3. The pipeline picks a random file from the folder at generation time

### Photo preparation guidelines
- **Crop**: 16:9 landscape, 1920×1080 minimum (2560×1440 ideal)
- **Composition**: Scene anchored in lower 60–70% of frame — leave upper area (sky, open space) clear for text overlay
- **Lighting**: Golden hour or blue hour preferred — warm, vibrant, not flat/overcast
- **Color**: Bump warmth/temperature slightly, increase vibrance (not full saturation)
- **Upper area**: If busy, apply a graduated filter to darken the top 30–40% so text reads clearly over it
- **Vignette**: Gentle darkened edges help focus the eye inward

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
