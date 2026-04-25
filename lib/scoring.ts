/**
 * lib/scoring.ts
 *
 * Deterministic scoring helpers for the idea engine.
 * The LLM scoring dimensions (localRelevance, formatFit, audienceValue, seoPotential)
 * are computed inside the Claude batch call in research.ts and renick-pipeline.ts.
 * This module handles the deterministic dimensions and final assembly.
 *
 * Scoring dimensions (100 pts total):
 *   localRelevance    0–25  (LLM)
 *   timeliness        0–20  (deterministic — from publishedDate)
 *   formatFit         0–15  (LLM)
 *   audienceValue     0–15  (LLM)
 *   sourceCredibility 0–10  (deterministic — from domain)
 *   novelty           0–10  (deterministic — from covered topics)
 *   seoPotential      0–5   (LLM)
 */

import { sourceCredibilityScore, sourceBonus, isDisqualified } from './source-rules'
import type { IdeaScore, IdeaUrgency } from './types'

// ─── Timeliness ───────────────────────────────────────────────────────────────

/**
 * Score 0–20 based on how recently the source was published.
 * Also returns the urgency classification.
 */
export function computeTimeliness(publishedDate?: string): { score: number; urgency: IdeaUrgency } {
  if (!publishedDate) return { score: 8, urgency: 'evergreen' }

  const published = new Date(publishedDate)
  const now = new Date()
  const hoursDiff = (now.getTime() - published.getTime()) / (1000 * 60 * 60)

  if (hoursDiff < 6)   return { score: 20, urgency: 'breaking' }
  if (hoursDiff < 24)  return { score: 18, urgency: 'breaking' }
  if (hoursDiff < 48)  return { score: 16, urgency: 'timely' }
  if (hoursDiff < 72)  return { score: 14, urgency: 'timely' }
  if (hoursDiff < 168) return { score: 11, urgency: 'timely' }   // within 1 week
  if (hoursDiff < 336) return { score: 8,  urgency: 'evergreen' } // within 2 weeks
  if (hoursDiff < 720) return { score: 5,  urgency: 'evergreen' } // within 1 month
  return { score: 2, urgency: 'evergreen' }
}

// ─── Source credibility ───────────────────────────────────────────────────────

/**
 * Score 0–10 based on the primary source domain.
 * Caps at 10 regardless of bonus.
 */
export function computeSourceCredibility(domains: string[]): number {
  if (domains.length === 0) return 4

  // Use the highest-credibility domain in the set
  const scores = domains.map((d) => sourceCredibilityScore(d))
  return Math.max(...scores)
}

/**
 * Checks if ALL primary source domains are disqualified.
 * If so, the idea should be dropped entirely.
 */
export function shouldDisqualify(domains: string[]): boolean {
  if (domains.length === 0) return false
  return domains.every((d) => isDisqualified(d))
}

// ─── Novelty ─────────────────────────────────────────────────────────────────

/**
 * Score 0–10 based on how different this topic is from what we've already published.
 * Simple keyword overlap check against the covered topics set.
 */
export function computeNovelty(title: string, coveredTopics: Set<string>): number {
  if (coveredTopics.size === 0) return 10

  const words = title.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 3)

  // Check how many covered topics share significant keyword overlap
  let maxOverlap = 0
  for (const topic of coveredTopics) {
    const topicWords = topic.split(/[-\s]+/).filter((w) => w.length > 3)
    const overlap = words.filter((w) => topicWords.includes(w)).length
    const overlapRatio = overlap / Math.min(words.length, topicWords.length)
    if (overlapRatio > maxOverlap) maxOverlap = overlapRatio
  }

  if (maxOverlap > 0.7) return 1   // near duplicate
  if (maxOverlap > 0.5) return 3   // significant overlap
  if (maxOverlap > 0.3) return 6   // some overlap, different angle
  if (maxOverlap > 0.1) return 8   // loosely related
  return 10                         // fresh topic
}

// ─── Final assembly ───────────────────────────────────────────────────────────

export interface LLMDimensions {
  localRelevance: number   // 0–25
  formatFit: number        // 0–15
  audienceValue: number    // 0–15
  seoPotential: number     // 0–5
}

export function assembleScore(
  llm: LLMDimensions,
  timeliness: number,
  sourceCredibility: number,
  novelty: number,
  sourceDomains: string[],
): IdeaScore {
  // Apply source bonus (caps individual dimension, not total)
  const bestBonus = sourceDomains.length > 0
    ? Math.max(...sourceDomains.map((d) => sourceBonus(d)))
    : 0

  const localRelevance   = Math.min(25, llm.localRelevance)
  const timelinessScore  = Math.min(20, timeliness)
  const formatFitScore   = Math.min(15, llm.formatFit + (bestBonus > 3 ? 1 : 0))
  const audienceScore    = Math.min(15, llm.audienceValue)
  const credScore        = Math.min(10, sourceCredibility)
  const noveltyScore     = Math.min(10, novelty)
  const seoScore         = Math.min(5,  llm.seoPotential)

  const total = localRelevance + timelinessScore + formatFitScore + audienceScore + credScore + noveltyScore + seoScore

  return {
    total,
    localRelevance,
    timeliness:        timelinessScore,
    formatFit:         formatFitScore,
    audienceValue:     audienceScore,
    sourceCredibility: credScore,
    novelty:           noveltyScore,
    seoPotential:      seoScore,
  }
}

// ─── Renick pattern scoring (deterministic, no LLM needed) ───────────────────

/**
 * Scores a Renick content pattern idea.
 * Renick patterns have already been quality-filtered by Claude Opus.
 * Format fit is derived from the measured traffic lift percentage.
 */
export function scoreRenickPattern(params: {
  avgLiftPct: number
  cityTarget: string
  targetKeyword: string
  coveredTopics: Set<string>
  translatedTitle: string
}): IdeaScore {
  const { avgLiftPct, cityTarget, targetKeyword, coveredTopics, translatedTitle } = params

  // Local relevance: Renick patterns are always translated to Hampton Roads
  const localRelevance = cityTarget.toLowerCase().includes('virginia beach') ||
    cityTarget.toLowerCase().includes('norfolk') ? 22 : 18

  // Timeliness: patterns are mostly evergreen strategy
  const timeliness = 10

  // Format fit: derived from Renick lift percentage
  const formatFit = Math.min(15, Math.round(2 + avgLiftPct / 150))

  // Audience value: Renick patterns target buyers/sellers directly
  const audienceValue = 12

  // Source credibility: Renick effectiveness dashboard = high signal
  const sourceCredibility = 8

  // Novelty: check against covered topics
  const novelty = computeNovelty(translatedTitle, coveredTopics)

  // SEO potential: patterns always have a targetKeyword
  const seoPotential = targetKeyword ? 4 : 2

  const total = localRelevance + timeliness + formatFit + audienceValue + sourceCredibility + novelty + seoPotential

  return {
    total,
    localRelevance,
    timeliness,
    formatFit,
    audienceValue,
    sourceCredibility,
    novelty,
    seoPotential,
  }
}

// ─── Threshold ────────────────────────────────────────────────────────────────

/** Ideas below this score are dropped before reaching the review queue. */
export const SCORE_THRESHOLD = 55

/** Ideas at or above this score are flagged as top picks in the review UI. */
export const TOP_PICK_THRESHOLD = 75

/** Ideas at or above this score with urgency='breaking' trigger an immediate alert. */
export const BREAKING_ALERT_THRESHOLD = 85
