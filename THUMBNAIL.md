# Legacy Home Search — Thumbnail Pipeline

## Goal
Every blog post gets a YouTube-style thumbnail featuring Barry Jenkins.
Target aesthetic: top-tier YouTube thumbnails — massive text, Barry large and prominent on the right,
vibrant community background, graphic accents. Think MrBeast, Mark Rober, viral real estate channels.
NOT a stock photo. NOT a subtle design. Maximum visual impact.

---

## Reference Style

Look at the best YouTube thumbnails:
- **Text is HUGE** — individual words are 15–25% of image height, not captions
- **Mixed font sizing** — key words (prices, percentages, "SHOCKING") are even bigger
- **Text effects** — thick black stroke outline, bright yellow/white fill, hard drop shadow
- **Barry is close and large** — cropped from chest/waist up so his face dominates the right side
- **Background is atmospheric** — slightly darkened at edges, light rays or bokeh glow behind Barry
- **Graphic accents** — colored stripe behind text, arrow pointing at headline, neon edge on Barry
- **High contrast** — dark background pops against bright text; or vice versa
- **Color palette** — yellow + white + black is the gold standard; red for urgency, green for money

---

## Pipeline

```
Article title + category
  └─ detectCommunity()    → Virginia Beach / Chesapeake / Norfolk / Suffolk / Hampton / Newport News
  └─ detectMood()         → shocked / exciting-positive / investment / negative / selling / buying / community / neutral
  └─ getBarryPhoto()      → public/Barry-AI.jpg (ALWAYS — this is non-negotiable)
  └─ getRandomCommunityPhoto(community) → public/community-photos/[slug]/ (picks random file)

GPT-4o vision (buildPromptWithGPT4o)
  └─ Sees: Barry's photo + community bg photo + article headline + mood
  └─ Writes: images.edit() prompt specifying exact visual design treatment
  └─ Key instruction: KEEP Barry 100% unchanged, only edit background + add text/graphics

gpt-image-1 images.edit()
  └─ Barry's photo is the BASE — his face is real, always
  └─ Edits background, adds massive text overlays, adds graphic accents
  └─ Size: 1536×1024 (16:9)
  └─ Fallback: images.generate() text-only if edit fails

Sanity CDN
  └─ Uploaded as openai-cover-{timestamp}.png
  └─ Returned as Sanity image reference
```

---

## Key Design Principles for the Prompt

### Text treatment (most important)
The GPT-4o instruction must specify all of the following for text:
- **MASSIVE scale** — at least 15–20% of image height per line
- **Heavy/condensed font** — bold, Impact-style, no thin or elegant fonts
- **Layered effects** — bright yellow OR white fill + thick black stroke (5–8px) + hard drop shadow
- **Word-level sizing** — key words (numbers, adjectives) can be even larger than surrounding text
- **Positioned LEFT** — text block fills the left 40–50% of the frame, top to bottom
- **Color contrast** — alternating yellow and white lines, or gradient fills on key words

### Barry's placement
- **Cropped from chest/waist up** — NOT full body. His face should be large.
- **Right side of frame** — positioned in the right 40–50%
- **UNCHANGED** — face, expression, glasses, beard, hair, suit must be 100% identical to source
- **Edge lighting or glow** — subtle halo/rim light behind Barry so he separates from background
- **Never alter the person** — the ONLY changes are to the background and overlay elements

### Background
- **Replace the office scene** with the community setting (described from the bg photo)
- **Slightly darkened** — especially behind text, so text pops
- **Atmospheric** — bokeh blur, light rays, or cinematic color grade
- **Mood-appropriate**: excited = warm golden; negative = cooler/darker; investment = premium warm

### Graphic accents (at least 1)
- Colored stripe or semi-transparent box behind part of the text
- Arrow graphic pointing at the headline
- Bold colored banner or badge (e.g., "2026", "BREAKING", "$300K+")
- Neon or bright edge highlight around Barry

---

## Mood System

Mood is detected from article title + category keywords. It shapes text color, background atmosphere, and accent colors — NOT Barry's expression (his photo is always the same).

| Mood | Trigger keywords | Text/accent style |
|---|---|---|
| `shocked` | record, skyrocket, surge, shocking, historic | Red/yellow text, urgent atmosphere |
| `exciting-positive` | rising, boom, appreciation, hot market | Yellow text, bright warm scene |
| `investment` | invest, ROI, equity, profit, cash flow | Gold/white text, premium feel |
| `negative` | falling, declining, challenges, affordability | White/blue text, cooler tones |
| `selling` | sell, list your home, top dollar | Green/white text, action-oriented |
| `buying` | buy, first-time, guide, tips for | Blue/white text, welcoming |
| `community` | neighborhood, living in, best place | Warm orange/white, local pride |
| `neutral` | (default) | Bold white + yellow, clean |

---

## Community Photo Pools

Real landmark photos are stored in `public/community-photos/[city-slug]/`.
GPT-4o sees both Barry's photo AND the community background photo, so it can describe the scene in vivid detail when writing the edit prompt — even though `images.edit()` only accepts one input image.

### Folder structure
```
public/community-photos/
  virginia-beach/     ← add photos here (any JPG/JPEG/PNG/WEBP)
  chesapeake/         ← 5 cinematic photos (Chesapeake1_cinematic.jpeg … Chesapeake5_cinematic.jpeg)
  norfolk/            ← 5 cinematic photos (Norfolk1__cinematic.jpeg … )
  suffolk/            ← 5 cinematic photos
  hampton/            ← 5 cinematic photos
  newport-news/       ← 5 cinematic photos
```

### Photo preparation guidelines
- **Crop**: 16:9 landscape, 1920×1080 minimum
- **Composition**: Scene anchored in lower 60–70%; leave upper area (sky) clear for text
- **Lighting**: Golden hour or blue hour preferred
- **Color**: Slightly warm/vibrant — not flat or overcast

---

## Key Files

| File | Purpose |
|---|---|
| `lib/image-gen-openai.ts` | Full OpenAI thumbnail pipeline — Barry detection, GPT-4o prompt writing, gpt-image-1 edit |
| `lib/images.ts` | Orchestrates fallback chain (OpenAI primary → Gemini → OG scrape → Unsplash → fallback pool) |
| `app/api/blog/generate-thumbnail/route.ts` | API route — `maxDuration: 300` to handle 60–120s generation time |
| `app/admin/thumbnail-review/page.tsx` | Card UI — generate / upload / approve / reject per post |
| `public/Barry-AI.jpg` | Barry's base photo — used in every thumbnail, never substituted |
| `public/community-photos/` | Community background photo pools |

---

## Admin Workflow

**URL:** `/admin/thumbnail-review?secret=ADMIN_SECRET`

1. Posts with missing thumbnails appear as cards
2. Click **Generate Thumbnail** — calls `POST /api/blog/generate-thumbnail` (~60–120 seconds)
3. Preview appears — click **✓ Approve & Apply** to go live, or **✕ Reject**
4. On reject: type feedback (e.g. "Make text bigger", "Use Chesapeake waterfront") → **Regenerate with Feedback**
5. Feedback is injected into the `whyItMatters` field and flows into the GPT-4o prompt
6. To regenerate existing thumbnails: add `&showAll=1` to the URL
7. **Generate All N Missing** button runs batch generation sequentially

---

## Iterating on Quality

This is an active iteration area. When thumbnails aren't good enough:

1. **Test article**: Use "Best Neighborhoods for First-Time Buyers in Virginia Beach" (buying-tips category → `happy` mood → blue/white text)
2. **Regenerate** on the thumbnail review page with `&showAll=1`
3. **Evaluate against the reference** — is Barry's face real? Is the text massive enough? Does it look like a YouTube thumbnail?
4. **Update `buildPromptWithGPT4o`** in `lib/image-gen-openai.ts` — that's where the design instructions live
5. **Update this file** to document what worked and what didn't

### What's been tried

| Approach | Result | Status |
|---|---|---|
| Gemini 3 Pro (primary) | Good community scenes, small text, no Barry | Replaced as primary |
| OpenAI Responses API + both photos as `input_image` | Generated a completely different person | Abandoned |
| `images.edit()` asking to change Barry's expression | Distorted Barry's face | Abandoned |
| `images.edit()` keeping Barry unchanged, edit background + text only | **Current approach** | Active |

### Known limitations
- `images.edit()` can sometimes produce text that's smaller or less dramatic than described
- Barry's expression is always the same (warm smile from the base photo) — can't change it without distortion
- If results are consistently weak, consider pre-generating backgrounds separately and compositing Barry via `sharp`

---

## Future Improvements

- [ ] Generate multiple thumbnail variations per article (3 options, operator picks)
- [ ] Pre-cut Barry PNG with transparent background + composite via `sharp` for guaranteed placement
- [ ] Add multiple Barry expression photos for different moods (requires new photos)
- [ ] A/B test thumbnail styles via GA4 — which styles get more clicks?
