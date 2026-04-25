# Publishing Workflow — Blotato Integration

## Overview

After the VA marks a post ready and clicks Publish, the system:
1. Sets `workflowStatus: 'publishing'` on the Sanity doc
2. Generates social copy (Claude Haiku) if not already written
3. Calls Blotato to post to the Legacy Home Team Facebook Page
4. Stores the `postSubmissionId` returned by Blotato
5. Sets `workflowStatus: 'published'` on Sanity (website goes live)
6. Polls Blotato every 10 seconds until status resolves
7. Stores `blotatoPublishStatus`, `blotatoPublishedAt`, and `facebookPostUrl` on the Sanity doc

## Environment Variables

```env
BLOTATO_API=<api-key>                          # Already in .env.local
BLOTATO_ACCOUNT_ID=27245                        # Legacy Home Team Facebook account
BLOTATO_FACEBOOK_PAGE_ID=1101893253009079       # Legacy Home Team Facebook Page
```

## Blotato API Flow

```
POST /v1/posts
Authorization: Bearer {BLOTATO_API}
{
  accountId: "27245",
  pageId: "1101893253009079",
  content: {
    text: "<social copy>\n\nhttps://legacyhomesearch.com/blog/<slug>",
    imageUrl: "<Sanity CDN image URL at 1200px>"
  }
}

→ { postSubmissionId: "abc123" }
  stored on blogPost.blotatoPostSubmissionId

→ Poll: GET /v1/posts/abc123
  until status: "published" | "failed"
  → stored on blogPost.blotatoPublishStatus
  → facebookPostUrl stored on blogPost.facebookPostUrl
```

## Polling

The VA editor polls `/api/content/blotato-status` every 10 seconds after publish.
Polling stops on `published`, `failed`, or after 30 attempts (~5 minutes).
The final status is always written to Sanity regardless of whether the VA is still on the page.

## Failure Handling

If Blotato returns an error:
- `workflowStatus` is set to `publish_failed`
- VA can retry by clicking Publish again on the same post
- Error message is shown inline in the editor

## Future Multi-Client Support

Phase 1 uses hardcoded account/page IDs in env vars.
Phase 2 will replace these with a Sanity `clientConfig` document per client:
- `blotatoApiKey`
- `facebookAccountId`
- `facebookPageId`

The `lib/blotato-client.ts` module's `getAccountId()` and `getPageId()` functions
are the only places to update when switching from env vars to Sanity config.

## API Routes

| Route | Purpose |
|-------|---------|
| `POST /api/content/publish?secret=...` | Trigger publish for a post |
| `GET /api/content/blotato-status?secret=...&postSubmissionId=...&postId=...` | Poll Blotato status |
