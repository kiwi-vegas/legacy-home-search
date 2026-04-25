# Content Machine — Editorial Operating System

## Overview

The Content Machine is the downstream workflow that takes an approved blog article and turns it into a published post on the website and Facebook Page. It is designed to be simple for a virtual assistant to operate, with no knowledge of API keys or platform technicalities required.

## Workflow Phases

```
Research → Approval → [CONTENT MACHINE STARTS HERE]
                            ↓
                    media_pending (VA queue)
                            ↓
                    VA adds thumbnail + edits social copy
                            ↓
                    media_ready
                            ↓
                    VA clicks Publish
                            ↓
                    published (website live + Facebook posted)
```

## Status Model

| Status | Meaning | Visible on website? |
|--------|---------|-------------------|
| `media_pending` | Approved; VA needs to add thumbnail | No |
| `media_ready` | Thumbnail saved; ready for VA to publish | No |
| `publish_pending` | Publish triggered, not yet confirmed | No |
| `publishing` | Blotato call in progress | No |
| `published` | Live on website + Facebook | Yes |
| `publish_failed` | Blotato call failed; retry available | No |

**Legacy status field**: Older posts use `status: 'published'` or `status: 'pending_thumbnail'`. Those are handled by a backwards-compatible GROQ filter and remain unaffected.

## Responsibilities

| Role | Responsibility |
|------|---------------|
| **Client (Barry)** | Reviews and approves article ideas from the daily/weekly pipeline |
| **VA** | Adds thumbnail, reviews social copy, clicks Publish |
| **System** | Writes blog posts, queues them, generates thumbnail prompts, posts to Facebook via Blotato, tracks status |

## Pages

| Page | URL | Who uses it |
|------|-----|-------------|
| VA Queue | `/admin/va-queue?secret=...` | VA — list of posts to process |
| VA Editor | `/admin/va-queue/[postId]?secret=...` | VA — thumbnail builder + publish |
| Legacy Upload | `/admin/thumbnail-review?secret=...` | Admin — fallback upload tool |

## Data Storage

- **Sanity CMS** — all workflow state lives on the `blogPost` document (`workflowStatus`, Blotato tracking fields)
- **Redis** — upstream draft staging only (7-day TTL, cleared once published)
- **Sanity CDN** — all thumbnails and images
- **No separate database** — Sanity is the system of record

## Future Extensibility

The content item model is designed around `blogPost` for Phase 1. Future phases can add:
- `videoPost` document type with the same `workflowStatus` field
- Additional Blotato platforms (Instagram, LinkedIn) via the same `publishToFacebook` pattern
- Multi-client config via a Sanity `clientConfig` document
- Automated thumbnail generation (remove VA step once quality is consistent)
