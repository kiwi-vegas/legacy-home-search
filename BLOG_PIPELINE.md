# Legacy Home Search — Blog Pipeline

## Overview

A fully automated daily blog pipeline that researches Virginia Beach and Hampton Roads real estate news, lets the operator pick articles to publish, then writes full posts with AI-generated cover images and publishes them to Sanity CMS.

**Market:** Virginia Beach, Chesapeake, Norfolk, Suffolk, Hampton, Newport News (Hampton Roads, VA)
**Sanity project ID:** `2nr7n3lm`
**Production URL:** `https://legacy-home-search.vercel.app`

---

## Daily Flow

```
6:00 AM PT (Vercel Cron)
  └─ /api/cron/research
       ├─ Tavily searches 8 rotating queries (Hampton Roads focused)
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

**ALL articles must be about Virginia, Virginia Beach, Hampton Roads, or directly relevant Virginia law/policy.**
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

**Step 1 — Claude builds the prompt**
Claude Sonnet analyzes the article's title, `whyItMatters`, and category, then writes a cinematic image prompt using Hampton Roads visual anchors and a desire loop for the article's category. Returns ONLY the prompt, 5–8 sentences.

**Hampton Roads visual anchors:**
- Virginia Beach oceanfront at golden hour — warmth, lifestyle, aspiration
- Chesapeake Bay with tidal marshes — depth, permanence, natural wealth
- Norfolk waterfront skyline at dusk — economic momentum, urban energy
- Colonial or craftsman homes on tree-lined streets — community, stability, roots
- Port of Virginia cranes — economic scale, growth, jobs
- Naval vessels in the distance — military community, Hampton Roads identity
- Aerial neighborhoods — scale, growth, investment opportunity

**Step 2 — Gemini generates the image** — `gemini-3-pro-image-preview`, 16:9, base64 PNG inline

**Step 3 — Upload to Sanity CDN** — stored as `google-ai-cover-{timestamp}.png`

### Fallback Chain (if Gemini fails)

4. **Imagen 4.0** (`imagen-4.0-generate-001`) — same prompt, 16:9
5. **Gemini 2.5 Flash Image** (`gemini-2.5-flash-image`)
6. **DALL-E 3** (requires `OPENAI_API_KEY`) — 1792×1024 HD
7. **OG image** scraped from the source article URL
8. **Unsplash API** (requires `UNSPLASH_ACCESS_KEY`) — category-matched query
9. **Fallback image pool** — pre-curated Unsplash URLs per category, deterministic pick by article URL hash

---

## Article Selection Rules

- **Volume**: Research fetches up to 30 articles per day, scores top 10 for display
- **Flexibility**: Operator can select 1–5 articles per day
- **No repeats**: Articles skipped twice are permanently filtered (Redis `article_shown_counts`)
- **Rotation**: 8 queries per day, rotating through 25 topic queries so all buckets get covered

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
| `GOOGLE_API_KEY` | Gemini/Imagen image generation (primary) |
| `OPENAI_API_KEY` | DALL-E 3 image generation (fallback) |
| `TAVILY_API_KEY` | Article research searches |
| `UPSTASH_REDIS_REST_URL` | Article storage (48hr TTL) |
| `UPSTASH_REDIS_REST_TOKEN` | Redis auth |
| `RESEND_API_KEY` | Digest email delivery |
| `FROM_EMAIL` | Sender address |
| `OPERATOR_EMAIL` | Digest recipient |
| `ADMIN_SECRET` | Auth for blog picker and publish API |
| `CRON_SECRET` | Auth for Vercel cron job |
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
GET /api/articles/2026-03-24?secret=YOUR_ADMIN_SECRET
```

---

## Key Files

| File | Purpose |
|---|---|
| `lib/research.ts` | Tavily searches + Claude scoring — Hampton Roads queries only |
| `lib/writer.ts` | Claude writes blog post as Legacy Home Search professional |
| `lib/image-gen-gemini.ts` | Gemini image generation — Hampton Roads visual anchors |
| `lib/image-gen.ts` | DALL-E 3 fallback |
| `lib/images.ts` | Orchestrates full image fallback chain |
| `lib/email.ts` | Digest email HTML + Resend delivery |
| `lib/store.ts` | Upstash Redis read/write |
| `lib/sanity-write.ts` | Publishes post to Sanity CMS |
| `app/api/cron/research/route.ts` | Cron endpoint |
| `app/api/blog/publish/route.ts` | Publish endpoint (1–5 articles) |
| `app/admin/blog-picker/[date]/page.tsx` | Operator selection UI |
| `vercel.json` | Cron schedule (6:00 AM PT daily) |
