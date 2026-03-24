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
- Map style: `mapbox://styles/mapbox/light-v11` (not dark-v11)

## Community Pages
The `COMMUNITY_PAGES` array in `lib/assistant-tools.ts` is currently empty (`[]`). Add entries as community pages are built.

## Blog Pipeline
Automated daily blog pipeline via Vercel Cron. Full details in `BLOG_PIPELINE.md`.
- 6:00 AM PT: researches Virginia Beach / Hampton Roads articles only, email digest sent
- Operator picks 1–5 articles at `/admin/blog-picker/[date]?secret=ADMIN_SECRET`
- Claude writes posts, Gemini generates custom hero images (DALL-E fallback), posts published to Sanity
- Live at `/blog` within 60 seconds (ISR revalidation)

## AI Content Assistant
Available at `/admin/assistant` (password-protected). Same architecture as chris-nevada-next. Update `COMMUNITY_PAGES` in `lib/assistant-tools.ts` as pages are added.

## Current Status (March 2026)
- Scaffold complete, all infrastructure in place
- Placeholder homepage deployed ("Coming Soon")
- No community pages yet — add as client provides content
- No YLOPO integration yet — add when client provides YLOPO domain

## What's Next
- Get client details (contact info, branding, YLOPO domain if applicable)
- Add real content to homepage
- Build community/neighborhood pages
- Add team member profiles
- Configure all env vars in Vercel
- Add community pages to `COMMUNITY_PAGES` in assistant-tools.ts

## Environment Variables
See `.env.local.example` for full list. All same as chris-nevada-next except:
- `NEXT_PUBLIC_SANITY_PROJECT_ID=2nr7n3lm` (different Sanity project)

## Maintenance Instructions
After every significant change, update this file to reflect:
- New features or components added
- Decisions made and why
- Current status and what's next
- Any new conventions established
