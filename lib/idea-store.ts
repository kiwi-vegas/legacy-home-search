/**
 * lib/idea-store.ts
 *
 * Unified Redis store for IdeaCandidate objects.
 *
 * Both pipelines (daily research + Renick) write here.
 * The review page and digest email read from here.
 *
 * Redis keys:
 *   lhs:idea:{id}              — JSON blob, 14-day TTL
 *   lhs:ideas:queue            — sorted set: score → id (pending ideas only)
 *   lhs:ideas:breaking         — list of breaking idea IDs (48h TTL each)
 *   lhs:covered:topics         — set of slugified topic strings (no TTL)
 */

import { Redis } from '@upstash/redis'
import type { IdeaCandidate, IdeaStatus } from './types'

const IDEA_TTL   = 14 * 24 * 60 * 60  // 14 days
const BREAKING_TTL = 48 * 60 * 60     // 48 hours
const QUEUE_KEY    = 'lhs:ideas:queue'
const BREAKING_KEY = 'lhs:ideas:breaking'
const COVERED_KEY  = 'lhs:covered:topics'

function getRedis(): Redis {
  const url   = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) throw new Error('Missing UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN')
  return new Redis({ url, token })
}

function ideaKey(id: string) { return `lhs:idea:${id}` }

// ─── Write ────────────────────────────────────────────────────────────────────

export async function saveIdea(idea: IdeaCandidate): Promise<void> {
  const redis = getRedis()

  await redis.set(ideaKey(idea.id), JSON.stringify(idea), { ex: IDEA_TTL })

  // Only pending ideas go into the sorted queue
  if (idea.status === 'pending') {
    await redis.zadd(QUEUE_KEY, { score: idea.score.total, member: idea.id })
  }

  // Breaking ideas get an extra fast-access slot
  if (idea.urgency === 'breaking') {
    await redis.set(`lhs:idea:breaking:${idea.id}`, idea.id, { ex: BREAKING_TTL })
    await redis.lpush(BREAKING_KEY, idea.id)
    await redis.expire(BREAKING_KEY, BREAKING_TTL)
  }
}

// ─── Read ─────────────────────────────────────────────────────────────────────

export async function getIdea(id: string): Promise<IdeaCandidate | null> {
  const redis = getRedis()
  const raw = await redis.get<string>(ideaKey(id))
  if (!raw) return null
  return typeof raw === 'string' ? JSON.parse(raw) : raw
}

/**
 * Returns all pending ideas sorted by score descending.
 * Cleans up expired members from the sorted set on the fly.
 */
export async function getPendingIdeas(): Promise<IdeaCandidate[]> {
  const redis = getRedis()

  // Get all IDs sorted by score descending (highest first)
  const ids = await redis.zrange<string[]>(QUEUE_KEY, 0, -1, { rev: true })
  if (!ids || ids.length === 0) return []

  const ideas: IdeaCandidate[] = []
  const expired: string[] = []

  for (const id of ids) {
    const idea = await getIdea(id)
    if (!idea) {
      expired.push(id)
      continue
    }
    // Only include pending ideas (may have been approved/skipped since being queued)
    if (idea.status === 'pending') {
      ideas.push(idea)
    } else {
      expired.push(id)
    }
  }

  // Clean up stale members
  if (expired.length > 0) {
    await redis.zrem(QUEUE_KEY, ...expired)
  }

  return ideas
}

/**
 * Returns all ideas regardless of status — for the full admin view.
 */
export async function getAllIdeas(): Promise<IdeaCandidate[]> {
  const redis = getRedis()
  const ids = await redis.zrange<string[]>(QUEUE_KEY, 0, -1, { rev: true })
  if (!ids || ids.length === 0) return []

  const ideas: IdeaCandidate[] = []
  for (const id of ids) {
    const idea = await getIdea(id)
    if (idea) ideas.push(idea)
  }
  return ideas
}

export async function getBreakingIdeas(): Promise<IdeaCandidate[]> {
  const redis = getRedis()
  const ids = await redis.lrange<string>(BREAKING_KEY, 0, -1)
  if (!ids || ids.length === 0) return []

  const ideas: IdeaCandidate[] = []
  for (const id of ids) {
    const idea = await getIdea(id)
    if (idea && idea.urgency === 'breaking') ideas.push(idea)
  }
  return ideas
}

// ─── Update status ────────────────────────────────────────────────────────────

export async function updateIdeaStatus(id: string, status: IdeaStatus): Promise<void> {
  const redis = getRedis()
  const idea = await getIdea(id)
  if (!idea) return

  const updated: IdeaCandidate = { ...idea, status, reviewedAt: new Date().toISOString() }
  await redis.set(ideaKey(id), JSON.stringify(updated), { ex: IDEA_TTL })

  // Remove from pending queue if no longer pending
  if (status !== 'pending') {
    await redis.zrem(QUEUE_KEY, id)
  }
}

// ─── Covered topics (novelty tracking) ───────────────────────────────────────

/**
 * Records a topic as covered so future ideas on the same topic get penalized.
 * Call this when a post is published.
 * @param topic — slugified topic string, e.g. "flood-zone-norfolk" or "closing-costs-virginia-beach"
 */
export async function addCoveredTopic(topic: string): Promise<void> {
  const redis = getRedis()
  await redis.sadd(COVERED_KEY, topic.toLowerCase().trim())
}

export async function getCoveredTopics(): Promise<Set<string>> {
  const redis = getRedis()
  const topics = await redis.smembers<string[]>(COVERED_KEY)
  return new Set(topics ?? [])
}

// ─── Week ID helper ───────────────────────────────────────────────────────────

export function buildWeekId(date?: Date): string {
  const d = date ?? new Date()
  return d.toISOString().slice(0, 10) // YYYY-MM-DD
}
