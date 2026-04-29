/**
 * Blotato API client
 *
 * Base URL: https://backend.blotato.com/v2
 * Auth:     blotato-api-key: {key}
 *
 * Phase 1: Account IDs are hardcoded per-client in env vars.
 * Phase 2+: swap account ID resolvers to read from Sanity clientConfig doc.
 *
 * Env vars required:
 *   BLOTATO_API_KEY                — API key
 *   BLOTATO_FACEBOOK_ACCOUNT_ID    — Blotato account ID for Facebook (29353)
 *   BLOTATO_YOUTUBE_ACCOUNT_ID     — Blotato account ID for YouTube (34912)
 *   BLOTATO_TIKTOK_ACCOUNT_ID      — Blotato account ID for TikTok (39905)
 *   BLOTATO_FACEBOOK_PAGE_ID       — Facebook Page ID (1101893253009079)
 */

const BASE_URL = 'https://backend.blotato.com/v2'

function getHeaders(): Record<string, string> {
  const apiKey = process.env.BLOTATO_API_KEY ?? process.env.BLOTATO_KEY
  if (!apiKey) throw new Error('BLOTATO_API_KEY env var is not set')
  return {
    'blotato-api-key': apiKey,
    'Content-Type': 'application/json',
  }
}

function getFacebookAccountId(): string {
  // Support both new and legacy env var name
  const id = process.env.BLOTATO_FACEBOOK_ACCOUNT_ID ?? process.env.BLOTATO_ACCOUNT_ID
  if (!id) throw new Error('BLOTATO_FACEBOOK_ACCOUNT_ID env var is not set')
  return id
}

function getYouTubeAccountId(): string {
  const id = process.env.BLOTATO_YOUTUBE_ACCOUNT_ID
  if (!id) throw new Error('BLOTATO_YOUTUBE_ACCOUNT_ID env var is not set')
  return id
}

function getTikTokAccountId(): string {
  const id = process.env.BLOTATO_TIKTOK_ACCOUNT_ID
  if (!id) throw new Error('BLOTATO_TIKTOK_ACCOUNT_ID env var is not set')
  return id
}

function getPageId(): string {
  const id = process.env.BLOTATO_FACEBOOK_PAGE_ID
  if (!id) throw new Error('BLOTATO_FACEBOOK_PAGE_ID env var is not set')
  return id
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type BlotatoPublishResult = {
  postSubmissionId: string
}

export type BlotatoPostStatus = {
  status: 'pending' | 'published' | 'failed'
  postUrl?: string
  errorMessage?: string
}

// ─── Publish ──────────────────────────────────────────────────────────────────

export async function publishToFacebook(
  text: string,
  imageUrl: string,
): Promise<BlotatoPublishResult> {
  const accountId = getFacebookAccountId()
  const pageId = getPageId()

  const res = await fetch(`${BASE_URL}/posts`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      post: {
        accountId,
        content: {
          text,
          mediaUrls: [imageUrl],
          platform: 'facebook',
        },
        target: {
          targetType: 'facebook',
          pageId,
        },
      },
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Blotato Facebook publish failed (${res.status}): ${body}`)
  }

  const data = await res.json()

  if (!data.postSubmissionId) {
    throw new Error(`Blotato response missing postSubmissionId: ${JSON.stringify(data)}`)
  }

  return { postSubmissionId: String(data.postSubmissionId) }
}

export async function publishToYouTube(
  title: string,
  description: string,
  videoUrl: string,
): Promise<BlotatoPublishResult> {
  const accountId = getYouTubeAccountId()

  const res = await fetch(`${BASE_URL}/posts`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      post: {
        accountId,
        content: {
          text: description,
          mediaUrls: [videoUrl],
          platform: 'youtube',
        },
        target: {
          targetType: 'youtube',
          title,
          privacyStatus: 'public',
          shouldNotifySubscribers: true,
        },
      },
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Blotato YouTube publish failed (${res.status}): ${body}`)
  }

  const data = await res.json()

  if (!data.postSubmissionId) {
    throw new Error(`Blotato YouTube response missing postSubmissionId: ${JSON.stringify(data)}`)
  }

  return { postSubmissionId: String(data.postSubmissionId) }
}

export async function publishToTikTok(
  caption: string,
  videoUrl: string,
): Promise<BlotatoPublishResult> {
  const accountId = getTikTokAccountId()

  const res = await fetch(`${BASE_URL}/posts`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      post: {
        accountId,
        content: {
          text: caption,
          mediaUrls: [videoUrl],
          platform: 'tiktok',
        },
        target: {
          targetType: 'tiktok',
          privacyLevel: 'PUBLIC_TO_EVERYONE',
          disabledComments: false,
          disabledDuet: false,
          disabledStitch: false,
          isBrandedContent: false,
          isYourBrand: false,
          isAiGenerated: false,
        },
      },
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Blotato TikTok publish failed (${res.status}): ${body}`)
  }

  const data = await res.json()

  if (!data.postSubmissionId) {
    throw new Error(`Blotato TikTok response missing postSubmissionId: ${JSON.stringify(data)}`)
  }

  return { postSubmissionId: String(data.postSubmissionId) }
}

// ─── Poll status ──────────────────────────────────────────────────────────────

export async function getPostStatus(postSubmissionId: string): Promise<BlotatoPostStatus> {
  const res = await fetch(`${BASE_URL}/posts/${postSubmissionId}`, {
    method: 'GET',
    headers: getHeaders(),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Blotato status check failed (${res.status}): ${body}`)
  }

  const data = await res.json()

  return {
    status: data.status ?? 'pending',
    postUrl: data.postUrl ?? data.url ?? undefined,
    errorMessage: data.errorMessage ?? data.error ?? undefined,
  }
}

// ─── Account/page lookup (future multi-client use) ───────────────────────────

export async function getConnectedAccounts(): Promise<Array<{ id: string; platform: string; fullname: string }>> {
  const res = await fetch(`${BASE_URL}/users/me/accounts`, {
    method: 'GET',
    headers: getHeaders(),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Blotato getConnectedAccounts failed (${res.status}): ${body}`)
  }

  const data = await res.json()
  return data.items ?? data
}

export async function getFacebookSubaccounts(
  accountId: string,
): Promise<Array<{ id: string; name: string; accountId: string }>> {
  const res = await fetch(`${BASE_URL}/users/me/accounts/${accountId}/subaccounts`, {
    method: 'GET',
    headers: getHeaders(),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Blotato getSubaccounts failed (${res.status}): ${body}`)
  }

  const data = await res.json()
  return data.items ?? data
}
