/**
 * lib/learnings.ts
 *
 * Manages the LEARNINGS.md file in the GitHub repo — the living source of truth
 * that makes the pipeline smarter every week.
 *
 * Responsibilities:
 *  1. Read LEARNINGS.md from GitHub (for use as context during post generation)
 *  2. Generate a new weekly learnings entry (via Claude Opus)
 *  3. Prepend the new entry and commit the updated file back to GitHub
 */

import Anthropic from '@anthropic-ai/sdk'
import type { ContentPattern, RenickDashboardData } from './renick-pipeline'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const GITHUB_REPO = 'kiwi-vegas/legacy-home-search'
const LEARNINGS_FILE = 'LEARNINGS.md'

// ─────────────────────────────────────────────
// GitHub file read/write helpers
// ─────────────────────────────────────────────

async function getGitHubFile(
  path: string
): Promise<{ content: string; sha: string } | null> {
  const token = process.env.GITHUB_TOKEN
  if (!token) return null

  const res = await fetch(
    `https://api.github.com/repos/${GITHUB_REPO}/contents/${path}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    }
  )

  if (res.status === 404) return null
  if (!res.ok) throw new Error(`GitHub GET ${path} failed: ${res.status}`)

  const data = await res.json()
  const content = Buffer.from(data.content, 'base64').toString('utf8')
  return { content, sha: data.sha }
}

async function commitGitHubFile(
  path: string,
  content: string,
  message: string,
  sha?: string
): Promise<void> {
  const token = process.env.GITHUB_TOKEN
  if (!token) throw new Error('GITHUB_TOKEN not set')

  const body: Record<string, unknown> = {
    message,
    content: Buffer.from(content).toString('base64'),
    branch: 'main',
  }
  if (sha) body.sha = sha

  const res = await fetch(
    `https://api.github.com/repos/${GITHUB_REPO}/contents/${path}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  )

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`GitHub commit ${path} failed: ${res.status} — ${err}`)
  }
}

// ─────────────────────────────────────────────
// Public: Read LEARNINGS.md
// ─────────────────────────────────────────────

export async function readLearnings(): Promise<string> {
  const file = await getGitHubFile(LEARNINGS_FILE)
  return file?.content ?? ''
}

// ─────────────────────────────────────────────
// Public: Generate + Commit Weekly Learnings Entry
// ─────────────────────────────────────────────

interface WeeklyLearningsInput {
  weekId: string
  renickDashboard: RenickDashboardData
  patterns: ContentPattern[]
  approvalDecisions: Record<string, 'approve' | 'skip'>
  publishedTitles: string[]
  skippedTitles: string[]
  ga4Data?: GA4PostData[]
}

interface GA4PostData {
  title: string
  slug: string
  pageviews7d: number
  avgTimeOnPage: string
  organicSessions: number
}

export async function generateAndCommitLearnings(
  input: WeeklyLearningsInput
): Promise<void> {
  const { weekId, renickDashboard, patterns, approvalDecisions, publishedTitles, skippedTitles, ga4Data } = input

  const approvedCount = Object.values(approvalDecisions).filter((v) => v === 'approve').length
  const totalCount = Object.values(approvalDecisions).length

  // Build the raw data summary for Claude
  const dataSummary = `
WEEK: ${weekId}

RENICK TOP POSTS (Source signals this week):
${renickDashboard.topPosts
  .slice(0, 10)
  .map((p, i) => `${i + 1}. "${p.title}" — +${p.liftPct}% lift (${p.status})`)
  .join('\n')}

PATTERNS SELECTED FOR TRANSLATION:
${patterns.map((p, i) => `${i + 1}. [${p.type}] "${p.exampleRenickTitle}" → "${p.translatedTitle}" (target: ${p.targetKeyword})`).join('\n')}

BARRY'S APPROVAL DECISIONS:
- Approved (${approvedCount}): ${publishedTitles.join(', ') || 'none'}
- Skipped (${totalCount - approvedCount}): ${skippedTitles.join(', ') || 'none'}
- Approval rate: ${approvedCount}/${totalCount}

${
  ga4Data && ga4Data.length > 0
    ? `GA4 PERFORMANCE (last 7 days — posts published last week):
${ga4Data.map((p) => `- "${p.title}": ${p.pageviews7d} pageviews, ${p.avgTimeOnPage} avg time, ${p.organicSessions} organic sessions`).join('\n')}`
    : 'GA4 DATA: Not yet available for posts published this week (check next week).'
}
`

  // Claude Opus writes the learnings entry
  const response = await anthropic.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 2000,
    messages: [
      {
        role: 'user',
        content: `You are maintaining LEARNINGS.md — the evolving intelligence file for the Renick → Jenkins blog content pipeline.

Based on this week's data, write a new weekly learnings entry in this EXACT markdown format:

---

## Weekly Learnings Entry — ${weekId}

### This Week's Renick Top Performers (Source Signals)
| Rank | Renick Post Title | % Lift | Pattern Type |
|---|---|---|---|
[fill in top 5 from data below]

### Translated Posts Generated This Week
| Post Title | Target Keyword | Category | Approved? |
|---|---|---|---|
[fill in all generated posts and whether Barry approved them]

### Translation Decisions Made
[2-4 bullet points about why specific patterns were chosen and any notable translation choices]

### Barry's Approval Signals
- Approved: [list]
- Skipped: [list]
- Approval rate this week: [X/Y]
- Signal: [1-2 sentences interpreting what Barry's approvals/skips tell us about his preferences]

### Post-Publish Performance
[If GA4 data available, show table. Otherwise: "Posts published this week — performance data will appear in next week's entry."]

### Learnings & Rules Updates
[4-6 bullet points — be specific and actionable. Note patterns that are working, patterns to de-prioritize based on skips, Hampton Roads-specific insights, data availability notes, etc.]

### Instructions for Next Week's Generation
[3-5 specific directives in imperative form, e.g. "Generate at least 1 flood zone post targeting Virginia Beach neighborhoods" or "De-prioritize seller commission posts — Barry has skipped 2 in a row". These get read by the post generation system next Tuesday.]

---

Write the entry based on this data:
${dataSummary}

Return ONLY the markdown entry (starting with ---), nothing else.`,
      },
    ],
  })

  const newEntry = (response.content[0] as { type: string; text: string }).text.trim()

  // Read current LEARNINGS.md
  const existing = await getGitHubFile(LEARNINGS_FILE)
  const currentContent = existing?.content ?? buildInitialLearningsHeader()

  // Prepend new entry (newest first so Claude reads it immediately)
  const updatedContent = insertAfterHeader(currentContent, newEntry)

  // Commit to GitHub
  await commitGitHubFile(
    LEARNINGS_FILE,
    updatedContent,
    `learnings: weekly update — ${weekId}`,
    existing?.sha
  )
}

function buildInitialLearningsHeader(): string {
  return `# Legacy Home Search — Content Intelligence Log

This file is automatically maintained by the Renick → Jenkins blog pipeline.
It records weekly learnings, approval signals, and performance data to improve future content generation.

**How it works:**
- Every Tuesday: The pipeline generates Hampton Roads posts inspired by Renick's top performers
- Every Wednesday: This file is updated with learnings from the week
- Every Tuesday (next week): Claude reads this entire file before generating new posts — the pipeline gets smarter each week

**Signal hierarchy:**
1. Barry's approval/skip decisions (immediate signal)
2. GA4 organic sessions in 7 days (performance signal, lags by 1 week)
3. Renick dashboard % lift (pattern signal, updated weekly)

---

`
}

function insertAfterHeader(currentContent: string, newEntry: string): string {
  // Find the first --- separator after the header and insert after it
  const headerEndIdx = currentContent.indexOf('\n---\n\n')
  if (headerEndIdx === -1) {
    // No separator found — just prepend
    return currentContent + '\n\n' + newEntry
  }

  const afterHeader = headerEndIdx + '\n---\n\n'.length
  return (
    currentContent.slice(0, afterHeader) +
    newEntry +
    '\n\n' +
    currentContent.slice(afterHeader)
  )
}

// ─────────────────────────────────────────────
// Public: Commit BLOG_PIPELINE.md update
// (adds the "Self-Improving Loop" section if not present)
// ─────────────────────────────────────────────

export async function ensureBlogPipelineHasLoopSection(): Promise<void> {
  const file = await getGitHubFile('BLOG_PIPELINE.md')
  if (!file) return
  if (file.content.includes('## Renick → Jenkins Self-Improving Loop')) return

  const addition = `

---

## Renick → Jenkins Self-Improving Loop

The pipeline includes a weekly self-improving content loop that translates top-performing posts from
Mike Renick's Sarasota real estate blog into Hampton Roads equivalents for Barry Jenkins.

**How it works:**
1. Every Tuesday at 8:05 AM PT — reads Renick's dashboard, extracts winning content patterns
2. Translates patterns to Hampton Roads equivalents with current local data
3. Generates 5 full blog posts following this file's writing rules
4. Sends Barry an approval email — one-click approve/skip per post
5. Approved posts publish to Sanity immediately (same pipeline as manual publish)
6. Every Wednesday — updates \`LEARNINGS.md\` with that week's patterns, approval signals, and GA4 data

**Source of truth files:**
- \`BLOG_PIPELINE.md\` (this file) — writing rules, voice, structure, categories
- \`LEARNINGS.md\` — evolving intelligence log, weekly patterns, Barry's approval signals, performance data
- \`THUMBNAIL.md\` — thumbnail pipeline (runs automatically on approval, same as manual posts)

**Key routes:**
- \`/api/cron/renick-pipeline\` — Tuesday 8:05 AM PT cron
- \`/api/cron/learnings-update\` — Wednesday 7:00 AM PT cron
- \`/api/blog/approve\` — Barry's one-click approval endpoint (linked from approval email)
`

  await commitGitHubFile(
    'BLOG_PIPELINE.md',
    file.content + addition,
    'docs: add Renick → Jenkins self-improving loop section',
    file.sha
  )
}
