# Legacy Home Search — Project Rules

## What This Project Is
A branded real estate website for a new client. Built on the same Next.js + Sanity CMS stack as chris-nevada-next, but with a light modern design (white/cream backgrounds, Inter font, blue accent color) rather than the dark luxury style.

## Key Facts
- **Project name**: legacy-home-search
- **Sanity project ID**: `2nr7n3lm`
- **Sanity dataset**: `production`
- **Design theme**: Light modern — white/cream backgrounds, `#2563eb` blue accent, clean typography
- **Tech stack**: Next.js 16, Sanity CMS, Anthropic Claude, Vercel Cron, Upstash Redis, Resend email

## Sanity Configuration
All Sanity reads use project ID `2nr7n3lm` (not `r3saenct` which is the Chris Nevada project).

- `sanity/client.ts` — read client (CDN)
- `lib/sanity-write.ts` — write client (Editor token)
- `sanity.config.ts` — Studio config, title: "Legacy Home Search"

## Design System
CSS variables defined in `app/globals.css`:
- `--accent: #2563eb` (blue, not gold)
- `--off-white: #f8f7f4`
- `--text: #1a1a1a`
- Font: Inter (Google Fonts)
- Maps: See `MAPS.md` for all Mapbox configuration (style, pitch, slots, city coordinates)

## Community Pages
The `COMMUNITY_PAGES` array in `lib/assistant-tools.ts` is currently empty (`[]`). Add entries as community pages are built.

## Blog Pipeline
Automated daily blog pipeline via Vercel Cron. Full details in `BLOG_PIPELINE.md`.
- 6:00 AM PT: researches Virginia Beach / Hampton Roads articles only, email digest sent
- Operator picks 1–5 articles at `/admin/blog-picker/[date]?secret=ADMIN_SECRET`
- Claude writes posts, Gemini generates custom hero images (DALL-E fallback), posts published to Sanity
- Live at `/blog` within 60 seconds (ISR revalidation)

## Market Reports Pipeline
Monthly PDF-upload pipeline that turns Altos Research PDFs into full market reports. Full details in `MARKET_REPORTS.md`.
- Barry uploads Altos PDF at `/admin/market-reports/upload?secret=ADMIN_SECRET`
- Claude reads the PDF natively and writes a 5-section report in Barry's voice
- Cover images use **DALL-E 3** (YouTube/financial illustration style — different from blog post covers which use Gemini)
- Draft saved to Sanity → Barry reviews and publishes → live at `/market-reports/[slug]`
- Reports also appear in `/blog` listing and community pages show "Latest Market Report" card

## AI Content Assistant
Available at `/admin/assistant` (password-protected). Same architecture as chris-nevada-next. Update `COMMUNITY_PAGES` in `lib/assistant-tools.ts` as pages are added.

## Current Status (April 2026)
- Full homepage live: hero with tab switcher, Barry bio, Altos market trends, interactive map, testimonials, contact
- `/communities` landing page with interactive HamptonRoadsMap (all 6 cities) and card grid
- Blog pipeline active — daily posts at `/blog`
- Market reports pipeline active — PDF upload at `/admin/market-reports/upload`
- All Mapbox maps updated to Standard style (3D buildings, POI, roads)
- Domain: `legacyhometeamlpt.com` → Vercel (GoDaddy A record + CNAME configured)
- Mobile-optimized: hero tabs, Barry photo layout, contact form, buttons

## What's Next
- Build out 6 individual community pages (`/virginia-beach`, `/chesapeake`, etc.)
- Add community pages to `COMMUNITY_PAGES` in `lib/assistant-tools.ts`
- Add team member profiles at `/team`
- YLOPO integration (when client provides domain)

## Environment Variables
See `.env.local.example` for full list. All same as chris-nevada-next except:
- `NEXT_PUBLIC_SANITY_PROJECT_ID=2nr7n3lm` (different Sanity project)

## Maintenance Instructions
After every significant change, update this file to reflect:
- New features or components added
- Decisions made and why
- Current status and what's next
- Any new conventions established
