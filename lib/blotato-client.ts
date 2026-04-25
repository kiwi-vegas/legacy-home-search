/**
 * Blotato API client
 *
 * Base URL: https://backend.blotato.com/v2
 * Auth:     blotato-api-key: {key}  (NOT Authorization: Bearer)
 * Docs:     https://help.blotato.com/api/start
 *
 * Phase 1: Account ID and Page ID are hardcoded per-client in env vars.
 * Phase 2+: swap getAccountId() / getPageId() to read from Sanity clientConfig doc
 * without changing any publish code below.
 *
 * Env vars required:
 *   BLOTATO_KEY                  — API key (in .env.local)
 *   BLOTATO_ACCOUNT_ID           — Facebook connected account ID (27245 for Legacy Home Team)
 *   BLOTATO_FACEBOOK_PAGE_ID     — Facebook Page ID (1101893253009079 = "Legacy Home Team LPT")
 */

const BASE_URL = 'https://backend.blotato.com/v2'

function getHeaders(): Record<string, string> {
  const apiKey = process.env.BLOTATO_KEY
  if (!apiKey) throw new Error('BLOTATO_KEY env var is not set')
  return {
    'blotato-api-key': apiKey,
    'Content-Type': 'application/json',
  }
}

function getAccountId(): string {
  const id = process.env.BLOTATO_ACCOUNT_ID
  if (!id) throw new Error('BLOTATO_ACCOUNT_ID env var is not set')
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
  const accountId = getAccountId()
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
    throw new Error(`Blotato publish failed (${res.status}): ${body}`)
  }

  const data = await res.json()

  if (!data.postSubmissionId) {
    throw new Error(`Blotato response missing postSubmissionId: ${JSON.stringify(data)}`)
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
