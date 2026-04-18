# Legacy Home Search — Blog Pipeline

## Overview

Two complementary content pipelines feed the `/blog` listing page:

1. **Daily blog pipeline** — automated research, operator picks articles, Claude writes posts with AI hero images, published to Sanity CMS
2. **Monthly market reports pipeline** — Barry uploads Altos Research PDFs, Claude reads and writes full reports, published automatically to Sanity. Full details in `MARKET_REPORTS.md`.

Both appear together in the `/blog` listing, merged and sorted by date. A category filter bar at the top lets readers filter by type.

**Market:** Virginia Beach, Chesapeake, Norfolk, Suffolk, Hampton, Newport News (Hampton Roads, VA)
**Blog page title:** Hampton Roads Real Estate Blog
**Sanity project ID:** `2nr7n3lm`
**Production URL:** `https://legacy-home-search.vercel.app`

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
  virginia-beach/     ← 4 photos (any JPG/JPEG/PNG/WEBP, any filename)
  chesapeake/         ← 5 photos
  norfolk/            ← 5 photos
  suffolk/            ← 5 photos
  hampton/            ← 5 photos
  newport-news/       ← 5 photos
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
| `BARRY_EMAIL` | `barry@yourfriendlyagent.net` — monthly Altos upload reminder |
| `ADMIN_SECRET` | Auth for blog picker, publish API, and market report admin pages |
| `ADMIN_PIN` | Short memorable password for the `/upload` gateway (falls back to `ADMIN_SECRET`) |
| `CRON_SECRET` | Auth for Vercel cron jobs |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | `2nr7n3lm` |
| `NEXT_PUBLIC_APP_URL` | `https://legacy-home-search.vercel.app` |
| `UNSPLASH_ACCESS_KEY` | Optional — Unsplash fallback images |

**IMPORTANT:** Always use `printf` (not `echo`) when setting env vars via Vercel CLI — `echo` adds a trailing newline that corrupts the value and causes Unauthorized errors:
```bash
printf 'your-value' | npx vercel env add VAR_NAME production
```

---

## Manual Testing

### Trigger research manually (POST):
```bash
curl -X POST https://legacy-home-search.vercel.app/api/cron/research \
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

---

## Blog Post Hero Image Display

The hero image at the top of each blog post (`app/(site)/blog/[slug]/page.tsx`) uses:
- `objectFit: 'cover'` — fills the 420px hero container
- `objectPosition: 'top'` — **anchors the top of the image** so community name text and graphic elements (which sit in the upper portion) are always fully visible. The bottom of the scene is clipped by the container, which is fine.
- Sanity delivers the image at full width (`width(1920)`) without a height crop — preserves the full 16:9 ratio before display.

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

### Market Reports Pipeline
| File | Purpose |
|---|---|
| `app/upload/page.tsx` | `/upload` gateway — password form with 7-day session cookie |
| `app/admin/market-reports/upload/page.tsx` | Drag-and-drop multi-PDF upload form with per-file status + recent reports list |
| `app/api/market-reports/auto-publish/route.ts` | PDF → Claude → DALL-E cover → Sanity (published immediately, city detected from filename) |
| `app/api/market-reports/recent/route.ts` | Returns last 10 reports for admin display |
| `app/(site)/market-reports/page.tsx` | Public market reports listing |
| `app/(site)/market-reports/[slug]/page.tsx` | Individual report page |
| `app/api/cron/market-reports/route.ts` | 1st of month: sends Barry upload reminder + missing-reports safety check |

### Cron Schedule (`vercel.json`)
| Schedule | Route | What it does |
|---|---|---|
| `0 13 * * *` (6 AM PT daily) | `/api/cron/research` | Daily blog research + digest email |
| `0 14 1 * *` (7 AM PT, 1st of month) | `/api/cron/market-reports` | Sends Barry the monthly Altos upload reminder; checks for missing reports |
