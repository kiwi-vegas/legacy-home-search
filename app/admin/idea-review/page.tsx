'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { IdeaCandidate, IdeaScore } from '@/lib/types'
import { AdminWorkflowNav } from '@/components/AdminWorkflowNav'

// ─── Constants ───────────────────────────────────────────────────────────────

const TOP_PICK_THRESHOLD = 75
const SCORE_THRESHOLD    = 55

const AUDIENCE_LABELS: Record<string, string> = {
  buyer:     'Buyer',
  seller:    'Seller',
  homeowner: 'Homeowner',
  investor:  'Investor',
  local:     'Local',
}

const AUDIENCE_COLORS: Record<string, string> = {
  buyer:     '#2563eb',
  seller:    '#0891b2',
  homeowner: '#7c3aed',
  investor:  '#d97706',
  local:     '#16a34a',
}

const CATEGORY_LABELS: Record<string, string> = {
  'market-update':        'Market Update',
  'buying-tips':          'Buying Tips',
  'selling-tips':         'Selling Tips',
  'community-spotlight':  'Community',
  'investment':           'Investment',
  'news':                 'News',
  'cost-breakdown':       'Cost Breakdown',
  'flood-and-risk':       'Flood & Risk',
}

const SOURCE_ICONS: Record<string, string> = {
  'Local News':         '📰',
  'Local Government':   '🏛️',
  'State Government':   '🏛️',
  'Federal Government': '🇺🇸',
  'Military / Defense': '🎖️',
  'National Outlet':    '📡',
  'Market Data':        '📊',
  'RE Association':     '🏠',
  'Effectiveness Dashboard': '📈',
  'Real Estate Site':   '🌐',
  'Web':                '🌐',
}

// ─── Types ────────────────────────────────────────────────────────────────────

type CardState =
  | { phase: 'idle' }
  | { phase: 'writing' }
  | { phase: 'done'; title: string; vaUrl: string }
  | { phase: 'error'; message: string }

// ─── Score ring ───────────────────────────────────────────────────────────────

function ScoreRing({ score, size = 52 }: { score: number; size?: number }) {
  const r = (size - 8) / 2
  const circ = 2 * Math.PI * r
  const fill = (score / 100) * circ
  const color = score >= TOP_PICK_THRESHOLD ? '#16a34a' : score >= SCORE_THRESHOLD ? '#2563eb' : '#94a3b8'

  return (
    <svg width={size} height={size} style={{ flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={4} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={4}
        strokeDasharray={`${fill} ${circ - fill}`}
        strokeDashoffset={circ / 4}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text x={size / 2} y={size / 2 + 1} textAnchor="middle" dominantBaseline="middle"
        style={{ fontSize: 12, fontWeight: 700, fill: color, fontFamily: 'Inter, sans-serif' }}>
        {score}
      </text>
    </svg>
  )
}

// ─── Score breakdown tooltip content ─────────────────────────────────────────

function ScoreBreakdown({ s }: { s: IdeaScore }) {
  const rows: [string, number, number][] = [
    ['Local relevance', s.localRelevance, 25],
    ['Timeliness',      s.timeliness,     20],
    ['Format fit',      s.formatFit,      15],
    ['Audience value',  s.audienceValue,  15],
    ['Source cred.',    s.sourceCredibility, 10],
    ['Novelty',         s.novelty,        10],
    ['SEO potential',   s.seoPotential,   5],
  ]
  return (
    <div style={{ fontSize: 11, color: '#475569' }}>
      {rows.map(([label, val, max]) => (
        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
          <span style={{ width: 90, flexShrink: 0 }}>{label}</span>
          <div style={{ flex: 1, background: '#e2e8f0', borderRadius: 99, height: 4 }}>
            <div style={{ width: `${(val / max) * 100}%`, background: '#2563eb', borderRadius: 99, height: 4 }} />
          </div>
          <span style={{ width: 28, textAlign: 'right', fontWeight: 600, color: '#1a1a1a' }}>{val}/{max}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Idea card ────────────────────────────────────────────────────────────────

function IdeaCard({ idea, secret, onAction }: {
  idea: IdeaCandidate
  secret: string
  onAction: (id: string, action: 'approved' | 'skipped' | 'deferred') => void
}) {
  const [state, setState] = useState<CardState>({ phase: 'idle' })
  const [showScore, setShowScore] = useState(false)

  const isTopPick = idea.score.total >= TOP_PICK_THRESHOLD

  async function handleApprove() {
    setState({ phase: 'writing' })
    try {
      const res = await fetch(`/api/content/ideas/approve?secret=${encodeURIComponent(secret)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ideaId: idea.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Writing failed')
      setState({ phase: 'done', title: data.title, vaUrl: `${data.vaQueueUrl}?secret=${encodeURIComponent(secret)}` })
      onAction(idea.id, 'approved')
    } catch (err) {
      setState({ phase: 'error', message: err instanceof Error ? err.message : 'Failed' })
    }
  }

  async function handleSkip() {
    await fetch(`/api/content/ideas/skip?secret=${encodeURIComponent(secret)}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ideaId: idea.id }),
    })
    onAction(idea.id, 'skipped')
  }

  async function handleDefer() {
    await fetch(`/api/content/ideas/defer?secret=${encodeURIComponent(secret)}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ideaId: idea.id }),
    })
    onAction(idea.id, 'deferred')
  }

  const urgencyBadge = idea.urgency === 'breaking'
    ? <span style={{ background: '#fef2f2', color: '#dc2626', fontWeight: 700, fontSize: 10, padding: '2px 8px', borderRadius: 99, letterSpacing: '0.08em' }}>⚡ BREAKING</span>
    : idea.urgency === 'timely'
    ? <span style={{ background: '#fefce8', color: '#ca8a04', fontWeight: 700, fontSize: 10, padding: '2px 8px', borderRadius: 99, letterSpacing: '0.08em' }}>⏱ TIMELY</span>
    : null

  return (
    <div style={{
      background: '#fff',
      border: `1px solid ${isTopPick ? '#86efac' : '#e2e8f0'}`,
      borderLeft: `4px solid ${isTopPick ? '#16a34a' : '#2563eb'}`,
      borderRadius: 12, padding: 20, marginBottom: 14,
    }}>

      {/* Success state */}
      {state.phase === 'done' && (
        <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, padding: 14, marginBottom: 12 }}>
          <div style={{ fontWeight: 700, color: '#166534', marginBottom: 4 }}>✓ Post written and queued</div>
          <div style={{ fontSize: 13, color: '#166534', marginBottom: 8 }}>{state.title}</div>
          <a href={state.vaUrl} style={{ fontSize: 13, color: '#166534', fontWeight: 600 }}>
            Open in VA Editor →
          </a>
        </div>
      )}

      {/* Error state */}
      {state.phase === 'error' && (
        <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 13, color: '#991b1b' }}>
          {state.message}
          <button onClick={() => setState({ phase: 'idle' })} style={{ marginLeft: 8, cursor: 'pointer', textDecoration: 'underline', background: 'none', border: 'none', color: '#991b1b', fontSize: 12 }}>Retry</button>
        </div>
      )}

      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>

        {/* Score ring */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowScore(!showScore)}
            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
            title="Click for score breakdown"
          >
            <ScoreRing score={idea.score.total} />
          </button>
          {showScore && (
            <div style={{
              position: 'absolute', top: 60, left: 0, zIndex: 10,
              background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8,
              padding: 12, width: 220, boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            }}>
              <ScoreBreakdown s={idea.score} />
            </div>
          )}
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* Header row */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginBottom: 8 }}>
            {isTopPick && (
              <span style={{ background: '#f0fdf4', color: '#166534', fontWeight: 700, fontSize: 10, padding: '2px 8px', borderRadius: 99, letterSpacing: '0.08em' }}>
                ★ TOP PICK
              </span>
            )}
            {urgencyBadge}
            <span style={{ background: '#f1f5f9', color: '#475569', fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 99 }}>
              {idea.contentType}
            </span>
            <span style={{ background: '#eff6ff', color: '#2563eb', fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 99 }}>
              {CATEGORY_LABELS[idea.category] ?? idea.category}
            </span>
            {idea.renickLift && (
              <span style={{ background: '#fefce8', color: '#92400e', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99 }}>
                📈 {idea.renickLift} lift
              </span>
            )}
          </div>

          {/* Title */}
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a', margin: '0 0 6px', lineHeight: 1.4 }}>
            {idea.title}
          </h3>

          {/* Angle */}
          <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.6, margin: '0 0 8px' }}>
            {idea.angle}
          </p>

          {/* Why it matters */}
          <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6, margin: '0 0 12px', fontStyle: 'italic' }}>
            {idea.whyItMatters}
          </p>

          {/* Audience + source row */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginBottom: 14 }}>
            {idea.audiences.map((a) => (
              <span key={a} style={{
                fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 99,
                background: `${AUDIENCE_COLORS[a]}18`, color: AUDIENCE_COLORS[a],
                border: `1px solid ${AUDIENCE_COLORS[a]}40`,
              }}>
                {AUDIENCE_LABELS[a]}
              </span>
            ))}
            <span style={{ color: '#cbd5e1', fontSize: 11 }}>·</span>
            {idea.sourceLabels.map((label, i) => (
              <span key={i} style={{ fontSize: 11, color: '#64748b' }}>
                {SOURCE_ICONS[label] ?? '🌐'} {label}
                {idea.sourceDomains[i] && (
                  <span style={{ color: '#94a3b8' }}> · {idea.sourceDomains[i]}</span>
                )}
              </span>
            ))}
            {idea.renickTitle && (
              <>
                <span style={{ color: '#cbd5e1', fontSize: 11 }}>·</span>
                <span style={{ fontSize: 11, color: '#94a3b8' }}>
                  Based on: "{idea.renickTitle}"
                </span>
              </>
            )}
          </div>

          {/* Actions */}
          {state.phase === 'idle' && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={handleApprove}
                style={{
                  padding: '8px 20px', background: '#1E3A5F', color: '#fff',
                  border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                }}
              >
                ✓ Approve & Write Post
              </button>
              <button
                onClick={handleDefer}
                style={{
                  padding: '8px 16px', background: 'none', color: '#475569',
                  border: '1px solid #e2e8f0', borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                }}
              >
                ↓ Defer
              </button>
              <button
                onClick={handleSkip}
                style={{
                  padding: '8px 16px', background: 'none', color: '#94a3b8',
                  border: '1px solid #e2e8f0', borderRadius: 7, fontSize: 13, cursor: 'pointer',
                }}
              >
                Skip
              </button>
            </div>
          )}

          {state.phase === 'writing' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#2563eb', fontWeight: 600 }}>
              <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⏳</span>
              Writing post… this takes about 20 seconds
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function IdeaReviewPage() {
  const secret = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('secret') ?? ''
    : ''

  const [ideas, setIdeas] = useState<IdeaCandidate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  const [generating, setGenerating] = useState(false)
  const [generateResult, setGenerateResult] = useState<number | null>(null)
  const [generateError, setGenerateError] = useState('')

  useEffect(() => {
    if (!secret) { setError('Unauthorized'); setLoading(false); return }
    fetch(`/api/content/ideas?secret=${encodeURIComponent(secret)}`)
      .then((r) => r.ok ? r.json() : Promise.reject('Unauthorized'))
      .then((data) => setIdeas(data))
      .catch(() => setError('Failed to load ideas'))
      .finally(() => setLoading(false))
  }, [secret])

  async function handleGenerate() {
    setGenerating(true)
    setGenerateResult(null)
    setGenerateError('')
    try {
      const res = await fetch(`/api/content/ideas/generate?secret=${encodeURIComponent(secret)}`, {
        method: 'POST',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Generation failed')
      setGenerateResult(data.count)
      const r2 = await fetch(`/api/content/ideas?secret=${encodeURIComponent(secret)}`)
      if (r2.ok) setIdeas(await r2.json())
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : 'Generation failed')
    } finally {
      setGenerating(false)
    }
  }

  function handleAction(id: string, action: 'approved' | 'skipped' | 'deferred') {
    if (action === 'skipped' || action === 'deferred') {
      setDismissed((prev) => new Set([...prev, id]))
    }
    // approved cards stay visible (showing success state)
  }

  const visibleIdeas = ideas.filter((i) => !dismissed.has(i.id))
  const topPicks     = visibleIdeas.filter((i) => i.score.total >= TOP_PICK_THRESHOLD)
  const strongIdeas  = visibleIdeas.filter((i) => i.score.total >= SCORE_THRESHOLD && i.score.total < TOP_PICK_THRESHOLD)
  const allClear     = !loading && !error && visibleIdeas.length === 0

  return (
    <div style={{ minHeight: '100vh', background: '#f8f7f4', fontFamily: 'Inter, sans-serif' }}>

      <AdminWorkflowNav current="ideas" secret={secret} />

      {/* Toolbar */}
      <div style={{
        background: '#fff', borderBottom: '1px solid #e2e8f0',
        padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <h1 style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a', margin: 0 }}>
          Content Idea Review
        </h1>
        {!loading && !error && (
          <span style={{ fontSize: 12, background: '#f1f5f9', color: '#64748b', borderRadius: 99, padding: '2px 10px', fontWeight: 600 }}>
            {visibleIdeas.length} pending
          </span>
        )}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          {generateError && (
            <span style={{ fontSize: 12, color: '#dc2626' }}>{generateError}</span>
          )}
          {generateResult !== null && !generating && (
            <span style={{ fontSize: 12, color: '#16a34a', fontWeight: 600 }}>
              ✓ {generateResult === 0 ? 'No new ideas found' : `${generateResult} new idea${generateResult === 1 ? '' : 's'} added`}
            </span>
          )}
          <button
            onClick={handleGenerate}
            disabled={generating}
            style={{
              padding: '7px 16px',
              background: generating ? '#f1f5f9' : '#1E3A5F',
              color: generating ? '#94a3b8' : '#fff',
              border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 600,
              cursor: generating ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            {generating ? '⏳ Searching Hampton Roads news…' : '↻ Generate More Ideas'}
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 24px' }}>

        {loading && (
          <p style={{ color: '#64748b', textAlign: 'center', padding: 40 }}>Loading ideas…</p>
        )}

        {error && (
          <p style={{ color: '#dc2626', textAlign: 'center', padding: 40 }}>{error}</p>
        )}

        {allClear && (
          <div style={{ textAlign: 'center', padding: '80px 24px' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#1a1a1a', marginBottom: 8 }}>All caught up</div>
            <div style={{ fontSize: 14, color: '#64748b' }}>
              No pending ideas right now. New ones arrive daily at 6 AM and weekly on Tuesdays.
            </div>
          </div>
        )}

        {/* Top Picks */}
        {topPicks.length > 0 && (
          <section style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <h2 style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#166534', margin: 0 }}>
                ★ Top Picks
              </h2>
              <span style={{ fontSize: 12, color: '#86efac', fontWeight: 600 }}>Score ≥{TOP_PICK_THRESHOLD}</span>
            </div>
            {topPicks.map((idea) => (
              <IdeaCard key={idea.id} idea={idea} secret={secret} onAction={handleAction} />
            ))}
          </section>
        )}

        {/* Strong Ideas */}
        {strongIdeas.length > 0 && (
          <section style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <h2 style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#2563eb', margin: 0 }}>
                Strong Ideas
              </h2>
              <span style={{ fontSize: 12, color: '#93c5fd', fontWeight: 600 }}>Score {SCORE_THRESHOLD}–{TOP_PICK_THRESHOLD - 1}</span>
            </div>
            {strongIdeas.map((idea) => (
              <IdeaCard key={idea.id} idea={idea} secret={secret} onAction={handleAction} />
            ))}
          </section>
        )}

      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
