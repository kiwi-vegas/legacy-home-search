/**
 * Coverage system for required evergreen topics.
 *
 * Compares published Sanity posts against the REQUIRED_TOPICS registry,
 * identifies gaps, and seeds them as IdeaCandidates in the Redis idea queue
 * so they appear on /admin/idea-review for approval.
 *
 * Designed to be safe to re-run — never seeds a goal that's already either:
 *   (a) covered by a published post, or
 *   (b) already pending in the idea queue
 */

import { createClient } from '@sanity/client'
import { saveIdea, getAllIdeas, buildWeekId } from './idea-store'
import { REQUIRED_TOPICS, postMatchesGoal, type TopicGoal } from './required-topics'
import type { IdeaCandidate } from './types'

function getSanityRead() {
  return createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? '2nr7n3lm',
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production',
    apiVersion: '2024-01-01',
    useCdn: false,
    token: process.env.SANITY_WRITE_TOKEN,
  })
}

// ─── Coverage check ─────────────────────────────────────────────────────────

export interface CoverageReport {
  total: number
  covered: TopicGoal[]
  missing: TopicGoal[]
  alreadyQueued: TopicGoal[]   // missing but already in idea queue
  toSeed: TopicGoal[]          // missing AND not in queue — these get seeded
}

export async function checkCoverage(): Promise<CoverageReport> {
  const sanity = getSanityRead()

  // Pull all blogPost titles + slugs (any status — we treat it as covered if it exists in Sanity)
  const posts = await sanity.fetch<Array<{ title: string; slug: string }>>(
    `*[_type == "blogPost"]{ title, "slug": slug.current }`,
  )

  // Pull all queued idea titles to avoid double-seeding
  const queuedIdeas = await getAllIdeas()
  const queuedTitles = new Set(queuedIdeas.map((i) => i.title.toLowerCase().trim()))

  const covered: TopicGoal[] = []
  const missing: TopicGoal[] = []
  const alreadyQueued: TopicGoal[] = []
  const toSeed: TopicGoal[] = []

  for (const goal of REQUIRED_TOPICS) {
    const isCovered = posts.some((p) => postMatchesGoal(p, goal))
    if (isCovered) {
      covered.push(goal)
      continue
    }
    missing.push(goal)
    if (queuedTitles.has(goal.title.toLowerCase().trim())) {
      alreadyQueued.push(goal)
    } else {
      toSeed.push(goal)
    }
  }

  return {
    total: REQUIRED_TOPICS.length,
    covered,
    missing,
    alreadyQueued,
    toSeed,
  }
}

// ─── Seed missing topics into the idea queue ─────────────────────────────────

function makeId(): string {
  return Math.random().toString(36).slice(2, 14)
}

function goalToIdea(goal: TopicGoal): IdeaCandidate {
  return {
    id: `req:${goal.id}:${Date.now().toString(36)}`,
    weekId: buildWeekId(),
    source: 'internal',

    title: goal.title,
    angle: goal.brief.split('.').slice(0, 2).join('.') + '.',
    whyItMatters: goal.whyItMatters,
    category: goal.category,
    audiences: goal.audiences,
    contentType: 'Required Evergreen',
    urgency: 'evergreen',

    // Score: high but below daily breaking news. ~70 puts these mid-pack.
    // Operator can prioritize via the idea-review page.
    score: {
      total: 70,
      localRelevance: 22,    // city/region-targeted
      timeliness: 8,         // evergreen
      formatFit: 14,         // these formats are proven winners
      audienceValue: 14,
      sourceCredibility: 7,
      novelty: 0,            // 0 because it's a duplicate of a template, but still valuable
      seoPotential: 5,       // primary keyword targeting
    },

    sourceUrls: [],
    sourceDomains: [],
    sourceLabels: ['Required Evergreen'],

    researchData: goal.brief,
    targetKeyword: goal.targetKeyword,
    cityTarget: goal.cityLabel,

    status: 'pending',
    createdAt: new Date().toISOString(),
  }
}

export interface SeedResult {
  seededCount: number
  alreadyQueuedCount: number
  coveredCount: number
  totalGoals: number
  seededTitles: string[]
}

export async function seedMissingTopics(): Promise<SeedResult> {
  const report = await checkCoverage()
  const seededTitles: string[] = []

  for (const goal of report.toSeed) {
    const idea = goalToIdea(goal)
    // Add a tiny score offset by goal.id hash so duplicates don't collide on the sorted set
    idea.score.total += (goal.id.charCodeAt(0) % 10) / 10
    await saveIdea(idea)
    seededTitles.push(goal.title)
  }

  return {
    seededCount: report.toSeed.length,
    alreadyQueuedCount: report.alreadyQueued.length,
    coveredCount: report.covered.length,
    totalGoals: report.total,
    seededTitles,
  }
}
