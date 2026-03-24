# Legacy Home Search — Blog Pipeline

## Overview

A fully automated daily blog pipeline that researches Las Vegas real estate news, lets the operator pick articles to publish, then writes full posts with AI-generated cover images and publishes them to Sanity CMS.

---

## Daily Flow

```
6:00 AM PT (Vercel Cron)
  └─ /api/cron/research
       ├─ Tavily searches 8 rotating queries (Las Vegas focused)
       ├─ Claude Opus scores & categorizes top 10 articles
       ├─ Stores results in Upstash Redis (48hr TTL)
       └─ Sends digest email to operator

Operator opens email
  └─ Clicks "Pick Articles to Publish →"
       └─ /admin/blog-picker/[date]?secret=ADMIN_SECRET
            ├─ Shows up to 10 articles with scores and summaries
            ├─ Operator selects 1–5 articles (flexible)
            └─ Clicks "Publish X Posts →"

                 └─ /api/blog/publish (POST)
                      ├─ For each selected article (in parallel):
                      │    ├─ Claude Sonnet writes full blog post
                      │    └─ Gemini 2.0 Flash generates cover image
                      │         (fallback: DALL-E 3 → OG image → Unsplash → pool)
                      ├─ Images uploaded to Sanity CDN
                      ├─ Posts published to Sanity CMS
                      └─ Live at /blog within 60 seconds (ISR revalidation)
```

---

## Research Priorities

Articles are scored 1–10. Claude gives extra weight to these high-value topics:

### 1. Las Vegas Property Values & Investment
- Home price forecasts and appreciation trends
- Rental market returns and investment property outlook
- Henderson, Summerlin, North Las Vegas neighborhood comparisons
- What market conditions mean for current homeowners and buyers

### 2. Nevada Law Changes Affecting Homeowners
- Property tax changes and exemptions
- HOA regulation updates
- Zoning and land use changes
- Tenant/landlord law updates
- Any legislation affecting real estate transactions

### 3. Major Development Projects (Economic Growth Signals)
- Billion-dollar stadium, arena, or district developments
- Tech campuses, data centers, corporate HQ relocations
- New master-planned communities (Summerlin, Henderson expansions)
- Infrastructure projects that increase neighborhood desirability
- Job-creating projects signaling long-term demand

### 4. Celebrity & High-Profile Moves to Las Vegas
- Celebrities, athletes, or executives buying Las Vegas real estate
- High-profile relocations signaling lifestyle appeal
- Luxury real estate transactions that reflect market confidence

### 5. Major Corporate Investments
- Large employers building facilities in Nevada (Tesla-scale news)
- Fortune 500 companies relocating to Las Vegas
- Manufacturing, logistics, or tech companies expanding in Clark County
- Any investment that signals economic growth and housing demand

---

## Image Generation Pipeline

### Primary: Google Gemini 2.0 Flash (requires `GOOGLE_API_KEY`)

1. **Claude builds the prompt** — Analyzes the article's headline, `whyItMatters`, and category. Writes a hyper-specific, cinematic image prompt with Las Vegas context (desert light, Red Rock Canyon, Summerlin neighborhoods, mountain backdrops, blue Nevada sky).

2. **Gemini generates the image** — Model: `gemini-2.0-flash-exp-image-generation`. Returns base64 PNG inline.

3. **Upload to Sanity CDN** — Buffer uploaded as `gemini-cover-{timestamp}.png`.

### Fallback Chain (if Gemini fails)

4. **DALL-E 3** (requires `OPENAI_API_KEY`) — Same Claude-written prompt, 1792×1024 HD quality.
5. **OG image** from the source article URL (scraped via cheerio).
6. **Unsplash API** (requires `UNSPLASH_ACCESS_KEY`) — Category-matched query.
7. **Fallback image pool** — Pre-curated Unsplash URLs per category, deterministically picked by article URL hash (ensures variety across same-day posts).

---

## Article Selection Rules

- **Volume**: Research fetches up to 30 articles per day, scores top 10 for display.
- **Flexibility**: Operator can select 1–5 articles per day (no minimum of 3).
- **No repeats**: Articles skipped twice without being selected are permanently filtered out of future research results (`recordShownArticles` → Redis `article_shown_counts`).
- **Rotation**: 8 queries run per day, rotating through 25 topic queries so all priority areas get covered regularly.

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

Each post is written by Claude Sonnet 4.6 as a Las Vegas real estate professional at Legacy Home Search. Voice is:
- Knowledgeable and approachable, never salesy
- Ties national or Nevada news back to the local Las Vegas / Henderson / Summerlin market
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
| `ANTHROPIC_API_KEY` | Claude Sonnet (writing) + Claude Opus (scoring) |
| `GOOGLE_API_KEY` | Gemini 2.0 Flash image generation (primary) |
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
| `NEXT_PUBLIC_APP_URL` | Production URL (for picker link in email) |
| `UNSPLASH_ACCESS_KEY` | Optional — Unsplash fallback images |

---

## Manual Testing

### Trigger research manually (POST):
```bash
curl -X POST https://your-domain.com/api/cron/research \
  -H "Content-Type: application/json" \
  -d '{"secret": "YOUR_ADMIN_SECRET"}'
```

### Publish specific articles manually:
```bash
curl -X POST https://your-domain.com/api/blog/publish \
  -H "Content-Type: application/json" \
  -d '{
    "secret": "YOUR_ADMIN_SECRET",
    "date": "2026-03-24",
    "articleIds": ["article_0", "article_2", "article_5"]
  }'
```

### Access article list for a date:
```
GET /api/articles/2026-03-24?secret=YOUR_ADMIN_SECRET
```

---

## Key Files

| File | Purpose |
|---|---|
| `lib/research.ts` | Tavily searches + Claude scoring, Las Vegas queries |
| `lib/writer.ts` | Claude writes blog post from article |
| `lib/image-gen-gemini.ts` | Gemini image generation (primary) |
| `lib/image-gen.ts` | DALL-E 3 image generation (fallback) |
| `lib/images.ts` | Orchestrates image fallback chain |
| `lib/email.ts` | Digest email HTML + Resend delivery |
| `lib/store.ts` | Upstash Redis read/write |
| `lib/sanity-write.ts` | Publishes post to Sanity CMS |
| `app/api/cron/research/route.ts` | Cron endpoint |
| `app/api/blog/publish/route.ts` | Publish endpoint (1–5 articles) |
| `app/admin/blog-picker/[date]/page.tsx` | Operator selection UI |
| `vercel.json` | Cron schedule (6:00 AM PT daily) |
