import { Redis } from '@upstash/redis'
import type { StoredArticles } from './types'

function getRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) throw new Error('Missing UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN')
  return new Redis({ url, token })
}

const TTL_SECONDS = 48 * 60 * 60 // 48 hours
const SHOWN_COUNTS_KEY = 'article_shown_counts'
const MAX_SHOWN = 2 // skip after being presented this many times without being picked

export async function storeArticles(date: string, data: StoredArticles): Promise<void> {
  const redis = getRedis()
  await redis.set(`articles:${date}`, JSON.stringify(data), { ex: TTL_SECONDS })
}

export async function loadArticles(date: string): Promise<StoredArticles | null> {
  const redis = getRedis()
  const raw = await redis.get<string>(`articles:${date}`)
  if (!raw) return null
  return typeof raw === 'string' ? JSON.parse(raw) : raw
}

/**
 * Increment the "shown but not picked" counter for each URL.
 * Called after publish to mark the articles the operator skipped.
 */
export async function recordShownArticles(urls: string[]): Promise<void> {
  if (urls.length === 0) return
  const redis = getRedis()
  await Promise.all(urls.map((url) => redis.hincrby(SHOWN_COUNTS_KEY, url, 1)))
}

/**
 * Returns the set of URLs that have been shown >= MAX_SHOWN times without being picked.
 * These should be excluded from future research results.
 */
export async function getSkippedUrls(): Promise<Set<string>> {
  const redis = getRedis()
  const counts = await redis.hgetall<Record<string, number>>(SHOWN_COUNTS_KEY)
  if (!counts) return new Set()
  return new Set(
    Object.entries(counts)
      .filter(([, count]) => Number(count) >= MAX_SHOWN)
      .map(([url]) => url)
  )
}
