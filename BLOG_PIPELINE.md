# Legacy Home Search — Blog Pipeline

> **Global pipeline architecture, thumbnail psychology system, image models, and setup instructions** are documented in the shared source of truth:
> `/Users/kiwi/Desktop/Cowork/Branded Sites/KEY MD FILES/BLOG_PIPELINE_GLOBAL.md`
>
> This file contains only Legacy Home Search–specific configuration.

---

## Market

Virginia Beach, Chesapeake, Norfolk, Suffolk, Hampton, Newport News (Hampton Roads, VA)

**Sanity project ID:** `2nr7n3lm`
**Production URL:** `https://legacy-home-search.vercel.app`

---

## Research Priorities

Articles are scored 1–10. Claude gives extra weight to these high-value topics:

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

## Image Visual Anchors (Hampton Roads)

Used in `lib/image-gen-gemini.ts` when Claude builds the image prompt:

- Virginia Beach oceanfront at golden hour — warmth, lifestyle, aspiration
- Chesapeake Bay with tidal marshes — depth, permanence, natural wealth
- Norfolk waterfront skyline at dusk — economic momentum, urban energy
- Colonial or craftsman homes on tree-lined streets — community, stability, roots
- Port of Virginia cranes — economic scale, growth, jobs
- Naval vessels in the distance — military community, discipline, Hampton Roads identity
- Aerial neighborhoods — scale, growth, investment opportunity

---

## Blog Post Persona

Each post is written by Claude Sonnet 4.6 as a Virginia Beach real estate professional at **Legacy Home Search**. Voice is:
- Knowledgeable and approachable, never salesy
- Ties national or Virginia news back to the local Hampton Roads / Virginia Beach market
- Always includes a "## What This Means For You" section with 3–4 bullet points

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
| `lib/research.ts` | Tavily searches + Claude scoring, Hampton Roads queries |
| `lib/writer.ts` | Claude writes blog post as Legacy Home Search professional |
| `lib/image-gen-gemini.ts` | Gemini image generation (Hampton Roads visual anchors) |
| `lib/image-gen.ts` | DALL-E 3 fallback |
| `lib/images.ts` | Orchestrates image fallback chain |
| `lib/email.ts` | Digest email HTML + Resend delivery |
| `lib/store.ts` | Upstash Redis read/write |
| `lib/sanity-write.ts` | Publishes post to Sanity CMS |
| `app/api/cron/research/route.ts` | Cron endpoint |
| `app/api/blog/publish/route.ts` | Publish endpoint (1–5 articles) |
| `app/admin/blog-picker/[date]/page.tsx` | Operator selection UI |
| `vercel.json` | Cron schedule (6:00 AM PT daily) |
