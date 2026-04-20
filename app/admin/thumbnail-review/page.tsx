'use client'

import { useState, useEffect, useCallback, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'

interface Post {
  _id: string
  title: string
  slug: string
  category: string
  excerpt: string
  hasCoverImage: boolean
}

type CardStatus =
  | 'idle'        // no thumbnail yet
  | 'generating'  // AI is working
  | 'uploading'   // user file being uploaded to Sanity
  | 'review'      // thumbnail ready — awaiting approve or reject
  | 'rejected'    // user rejected — showing feedback input
  | 'applying'    // approved, being saved to Sanity
  | 'applied'     // live on blog

interface CardState {
  status: CardStatus
  assetRef?: string
  previewUrl?: string
  heroBannerAssetRef?: string | null
  feedback?: string
  error?: string
}

const CATEGORY_LABELS: Record<string, string> = {
  'market-update': 'Market Update',
  'buying-tips': 'Buying Tips',
  'selling-tips': 'Selling Tips',
  'community-spotlight': 'Community',
  'investment': 'Investment',
  'news': 'News',
}

const CATEGORY_COLORS: Record<string, string> = {
  'market-update': '#2563eb',
  'buying-tips': '#16a34a',
  'selling-tips': '#9333ea',
  'community-spotlight': '#ea580c',
  'investment': '#0891b2',
  'news': '#64748b',
}

// ─── Individual post card ───────────────────────────────────────────────────

function PostCard({
  post,
  state,
  secret,
  onStateChange,
}: {
  post: Post
  state: CardState
  secret: string
  onStateChange: (id: string, next: CardState) => void
}) {
  const [feedbackText, setFeedbackText] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const catColor = CATEGORY_COLORS[post.category] ?? '#94a3b8'
  const catLabel = CATEGORY_LABELS[post.category] ?? post.category

  const uploadFile = useCallback(async (file: File) => {
    onStateChange(post._id, { status: 'uploading' })
    try {
      const fd = new FormData()
      fd.append('secret', secret)
      fd.append('file', file)
      const res = await fetch('/api/blog/upload-thumbnail', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok || !data.assetRef) {
        onStateChange(post._id, { status: 'idle', error: data.error ?? 'Upload failed' })
        return
      }
      onStateChange(post._id, { status: 'review', assetRef: data.assetRef, previewUrl: data.previewUrl })
    } catch {
      onStateChange(post._id, { status: 'idle', error: 'Upload failed — try again' })
    }
  }, [post._id, secret, onStateChange])

  const generate = useCallback(async (feedback?: string) => {
    onStateChange(post._id, { status: 'generating' })
    try {
      const res = await fetch('/api/blog/generate-thumbnail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId: post._id,
          title: post.title,
          category: post.category,
          excerpt: post.excerpt,
          slug: post.slug,
          secret,
          feedback: feedback || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.assetRef) {
        onStateChange(post._id, { status: 'idle', error: data.error ?? 'Generation failed' })
        return
      }
      onStateChange(post._id, {
        status: 'review',
        assetRef: data.assetRef,
        previewUrl: data.previewUrl,
        heroBannerAssetRef: data.heroBannerAssetRef ?? null,
      })
    } catch {
      onStateChange(post._id, { status: 'idle', error: 'Network error — try again' })
    }
  }, [post, secret, onStateChange])

  const approve = useCallback(async () => {
    if (!state.assetRef) return
    onStateChange(post._id, { ...state, status: 'applying' })
    try {
      const res = await fetch('/api/blog/apply-thumbnail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: post._id, assetRef: state.assetRef, heroBannerAssetRef: state.heroBannerAssetRef ?? null, secret }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        onStateChange(post._id, { ...state, status: 'review', error: data.error ?? 'Apply failed' })
        return
      }
      onStateChange(post._id, { ...state, status: 'applied' })
    } catch {
      onStateChange(post._id, { ...state, status: 'review', error: 'Network error — try again' })
    }
  }, [post, state, secret, onStateChange])

  const submitFeedback = useCallback(() => {
    const fb = feedbackText.trim()
    if (!fb) return
    setFeedbackText('')
    generate(fb)
  }, [feedbackText, generate])

  return (
    <div style={s.card}>

      {/* ── Thumbnail area ── */}
      <div style={s.imgWrap}>
        {state.status === 'idle' && (
          <div style={s.imgPlaceholder}>
            <div style={{ fontSize: 32, opacity: 0.25, marginBottom: 10 }}>🖼</div>
            {state.error && (
              <div style={{ fontSize: 12, color: '#dc2626', textAlign: 'center', padding: '0 12px' }}>
                ⚠ {state.error}
              </div>
            )}
          </div>
        )}

        {state.status === 'generating' && (
          <div style={s.imgPlaceholder}>
            <div style={s.spinner} />
            <div style={{ marginTop: 14, fontSize: 13, color: '#2563eb', fontWeight: 600 }}>Generating…</div>
            <div style={{ fontSize: 11, color: '#93c5fd', marginTop: 4 }}>~60–120 seconds</div>
          </div>
        )}

        {state.status === 'uploading' && (
          <div style={s.imgPlaceholder}>
            <div style={s.spinner} />
            <div style={{ marginTop: 14, fontSize: 13, color: '#2563eb', fontWeight: 600 }}>Uploading…</div>
            <div style={{ fontSize: 11, color: '#93c5fd', marginTop: 4 }}>Sending to Sanity</div>
          </div>
        )}

        {(state.status === 'review' || state.status === 'rejected' || state.status === 'applying') && state.previewUrl && (
          <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <Image
              src={state.previewUrl}
              alt={post.title}
              fill
              style={{ objectFit: 'cover' }}
              unoptimized
            />
            {state.status === 'applying' && (
              <div style={s.overlay}>
                <div style={s.spinnerSm} />
                <span style={{ color: '#fff', fontSize: 13, fontWeight: 600, marginLeft: 8 }}>Applying…</span>
              </div>
            )}
          </div>
        )}

        {state.status === 'applied' && state.previewUrl && (
          <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <Image
              src={state.previewUrl}
              alt={post.title}
              fill
              style={{ objectFit: 'cover' }}
              unoptimized
            />
            <div style={s.approvedBadge}>✓ Live</div>
          </div>
        )}
      </div>

      {/* ── Card body ── */}
      <div style={s.cardBody}>
        <div style={{ marginBottom: 8 }}>
          <span style={{ ...s.catPill, background: catColor + '18', color: catColor }}>
            {catLabel}
          </span>
        </div>
        <div style={s.cardTitle}>{post.title}</div>

        {/* ── Actions ── */}
        <div style={s.actions}>

          {/* IDLE — Generate or Upload */}
          {state.status === 'idle' && (
            <>
              <button onClick={() => generate()} style={s.btnPrimary}>
                Generate Thumbnail
              </button>
              <button onClick={() => fileInputRef.current?.click()} style={s.btnUpload}>
                Upload Your Own
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) uploadFile(file)
                  e.target.value = ''
                }}
              />
            </>
          )}

          {/* GENERATING / UPLOADING — disabled */}
          {(state.status === 'generating' || state.status === 'uploading') && (
            <button disabled style={s.btnDisabled}>
              {state.status === 'uploading' ? 'Uploading…' : 'Generating…'}
            </button>
          )}

          {/* REVIEW — Approve or Reject + replace option */}
          {state.status === 'review' && (
            <>
              <button onClick={approve} style={s.btnApprove}>
                ✓ Approve &amp; Apply
              </button>
              <button
                onClick={() => onStateChange(post._id, { ...state, status: 'rejected' })}
                style={s.btnReject}
              >
                ✕ Reject
              </button>
              <button onClick={() => fileInputRef.current?.click()} style={s.btnReplace}>
                ↑ Replace with your own
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) uploadFile(file)
                  e.target.value = ''
                }}
              />
            </>
          )}

          {/* REJECTED — feedback input + regenerate */}
          {state.status === 'rejected' && (
            <div style={{ width: '100%' }}>
              <textarea
                placeholder="What should be different? e.g. 'More blue tones', 'Chesapeake waterfront instead of beach', 'Remove the arrow graphics'…"
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                style={s.feedbackInput}
                rows={3}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submitFeedback()
                }}
              />
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button
                  onClick={submitFeedback}
                  disabled={!feedbackText.trim()}
                  style={{
                    ...s.btnPrimary,
                    opacity: feedbackText.trim() ? 1 : 0.4,
                    cursor: feedbackText.trim() ? 'pointer' : 'not-allowed',
                    flex: 1,
                  }}
                >
                  Regenerate with Feedback
                </button>
                <button
                  onClick={() => onStateChange(post._id, { ...state, status: 'review' })}
                  style={s.btnGhost}
                >
                  Cancel
                </button>
              </div>
              <div style={{ fontSize: 11, color: '#aaa9a4', marginTop: 6 }}>
                ⌘↵ to submit
              </div>
            </div>
          )}

          {/* APPLYING — disabled */}
          {state.status === 'applying' && (
            <button disabled style={s.btnDisabled}>Applying…</button>
          )}

          {/* APPLIED — success + view link */}
          {state.status === 'applied' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#16a34a' }}>
                ✓ Live on blog
              </span>
              <a
                href={`/blog/${post.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: 12, color: '#2563eb', textDecoration: 'none', fontWeight: 500 }}
              >
                View post →
              </a>
            </div>
          )}

        </div>

        {/* Error note */}
        {state.error && state.status !== 'idle' && (
          <div style={s.errorNote}>{state.error}</div>
        )}
      </div>

    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

function ThumbnailReviewInner() {
  const searchParams = useSearchParams()
  const secret = searchParams.get('secret') ?? ''

  const [posts, setPosts] = useState<Post[]>([])
  const [states, setStates] = useState<Record<string, CardState>>({})
  const [loading, setLoading] = useState(true)
  const [batchRunning, setBatchRunning] = useState(false)
  const showAll = searchParams.get('showAll') === '1'

  useEffect(() => {
    if (!secret) return
    fetch(`/api/blog/dashboard-data?secret=${secret}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (!data?.posts) return
        const list = showAll
          ? (data.posts as Post[])
          : (data.posts as Post[]).filter((p) => !p.hasCoverImage)
        setPosts(list)
        const initial: Record<string, CardState> = {}
        list.forEach((p) => { initial[p._id] = { status: 'idle' } })
        setStates(initial)
      })
      .finally(() => setLoading(false))
  }, [secret, showAll])

  const updateState = useCallback((id: string, next: CardState) => {
    setStates((prev) => ({ ...prev, [id]: next }))
  }, [])

  // Generate all idle/error posts sequentially
  const generateAll = useCallback(async () => {
    setBatchRunning(true)
    const toGenerate = posts.filter((p) => {
      const s = states[p._id]?.status
      return s === 'idle'
    })
    for (const post of toGenerate) {
      // Update to generating immediately
      setStates((prev) => ({ ...prev, [post._id]: { status: 'generating' } }))
      try {
        const res = await fetch('/api/blog/generate-thumbnail', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            postId: post._id,
            title: post.title,
            category: post.category,
            excerpt: post.excerpt,
            slug: post.slug,
            secret,
          }),
        })
        const data = await res.json()
        if (!res.ok || !data.assetRef) {
          setStates((prev) => ({ ...prev, [post._id]: { status: 'idle', error: data.error ?? 'Failed' } }))
        } else {
          setStates((prev) => ({ ...prev, [post._id]: { status: 'review', assetRef: data.assetRef, previewUrl: data.previewUrl, heroBannerAssetRef: data.heroBannerAssetRef ?? null } }))
        }
      } catch {
        setStates((prev) => ({ ...prev, [post._id]: { status: 'idle', error: 'Network error' } }))
      }
    }
    setBatchRunning(false)
  }, [posts, states, secret])

  if (!secret) {
    return (
      <div style={s.page}><div style={s.container}>
        <div style={s.errorBox}>Missing ?secret= — add it to the URL.</div>
      </div></div>
    )
  }

  const counts = Object.values(states).reduce(
    (acc, st) => { acc[st.status] = (acc[st.status] ?? 0) + 1; return acc },
    {} as Record<string, number>
  )
  const idleCount = counts['idle'] ?? 0
  const reviewCount = counts['review'] ?? 0
  const appliedCount = counts['applied'] ?? 0
  const generatingCount = counts['generating'] ?? 0

  return (
    <div style={s.page}>
      <div style={s.container}>

        {/* Header */}
        <div style={s.header}>
          <div style={s.eyebrow}>Legacy Home Search · Admin</div>
          <h1 style={s.title}>Thumbnail Review</h1>
          <p style={s.sub}>
            Generate AI thumbnails for posts that are missing them.
            Review each image — approve to apply it live, or reject with feedback to regenerate.
          </p>
        </div>

        {/* Steps legend */}
        <div style={s.steps}>
          {[
            ['1', 'Generate', 'AI creates thumbnail using Gemini + local Hampton Roads photos'],
            ['2', 'Review', 'See the image — approve to go live or reject with feedback'],
            ['3', 'Approve & Apply', 'Thumbnail is applied to the post immediately'],
          ].map(([num, label, desc]) => (
            <div key={num} style={s.step}>
              <div style={s.stepNum}>{num}</div>
              <div>
                <div style={s.stepLabel}>{label}</div>
                <div style={s.stepDesc}>{desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Stats + batch action */}
        {!loading && posts.length > 0 && (
          <div style={s.toolbar}>
            <div style={s.statRow}>
              {idleCount > 0 && <span style={{ ...s.stat, color: '#64748b' }}>{idleCount} pending</span>}
              {generatingCount > 0 && <span style={{ ...s.stat, color: '#2563eb' }}>⟳ {generatingCount} generating</span>}
              {reviewCount > 0 && <span style={{ ...s.stat, color: '#d97706' }}>{reviewCount} awaiting review</span>}
              {appliedCount > 0 && <span style={{ ...s.stat, color: '#16a34a' }}>✓ {appliedCount} applied</span>}
            </div>
            {idleCount > 0 && !batchRunning && (
              <button onClick={generateAll} style={s.btnPrimary}>
                Generate All {idleCount} Missing
              </button>
            )}
            {batchRunning && (
              <button disabled style={s.btnDisabled}>
                Running batch… ({generatingCount} active)
              </button>
            )}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#888884', fontSize: 14 }}>
            Loading posts…
          </div>
        )}

        {/* All done */}
        {!loading && posts.length === 0 && (
          <div style={s.allDone}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>✓</div>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>All posts have thumbnails</div>
            <div style={{ fontSize: 13, color: '#888884' }}>
              To regenerate existing thumbnails, add <code style={{ background: '#f0ede8', padding: '1px 6px', borderRadius: 4 }}>&amp;showAll=1</code> to the URL.
            </div>
          </div>
        )}

        {/* Post grid */}
        {!loading && posts.length > 0 && (
          <div style={s.grid}>
            {posts.map((post) => (
              <PostCard
                key={post._id}
                post={post}
                state={states[post._id] ?? { status: 'idle' }}
                secret={secret}
                onStateChange={updateState}
              />
            ))}
          </div>
        )}

        {!loading && posts.length > 0 && (
          <div style={s.footerNote}>
            Images are generated by GPT-4o + gpt-image-1 (OpenAI) featuring Barry Jenkins with an expression
            matched to the article tone. Gemini is used as a fallback. Generation takes 60–120 seconds per image.
            After approving, the post's cover image updates on the live site within 60 seconds.
          </div>
        )}

      </div>
    </div>
  )
}

export default function ThumbnailReviewPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#f8f7f4' }} />}>
      <ThumbnailReviewInner />
    </Suspense>
  )
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: '#f8f7f4',
    fontFamily: 'Inter, -apple-system, sans-serif',
    color: '#1a1a1a',
  },
  container: { maxWidth: 1200, margin: '0 auto', padding: '48px 24px 100px' },
  errorBox: {
    background: 'rgba(220,38,38,0.08)',
    border: '1px solid rgba(220,38,38,0.2)',
    color: '#dc2626',
    padding: '12px 16px',
    borderRadius: 8,
    fontSize: 14,
  },
  header: { marginBottom: 28, paddingBottom: 24, borderBottom: '1px solid #e0ddd8' },
  eyebrow: {
    fontSize: 11, fontWeight: 700, letterSpacing: '0.14em',
    textTransform: 'uppercase' as const, color: '#2563eb', marginBottom: 8,
  },
  title: { fontSize: 28, fontWeight: 800, margin: '0 0 8px', letterSpacing: '-0.02em' },
  sub: { fontSize: 14, color: '#888884', margin: 0, lineHeight: 1.7 },
  steps: {
    display: 'flex', gap: 24, flexWrap: 'wrap' as const,
    padding: '20px 24px', background: '#fff',
    border: '1px solid #e0ddd8', borderRadius: 12, marginBottom: 28,
  },
  step: { display: 'flex', alignItems: 'flex-start', gap: 12, flex: '1 1 200px' },
  stepNum: {
    width: 28, height: 28, borderRadius: '50%',
    background: '#2563eb', color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 13, fontWeight: 800, flexShrink: 0, marginTop: 1,
  },
  stepLabel: { fontWeight: 700, fontSize: 14, marginBottom: 2 },
  stepDesc: { fontSize: 12, color: '#888884', lineHeight: 1.5 },
  toolbar: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    flexWrap: 'wrap' as const, gap: 12, marginBottom: 24,
  },
  statRow: { display: 'flex', gap: 16, flexWrap: 'wrap' as const },
  stat: { fontSize: 13, fontWeight: 600 },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
    gap: 20,
  },
  card: {
    background: '#fff',
    border: '1px solid #e0ddd8',
    borderRadius: 12,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column' as const,
  },
  imgWrap: {
    width: '100%',
    aspectRatio: '16/9',
    background: '#f0ede8',
    position: 'relative' as const,
    overflow: 'hidden',
    flexShrink: 0,
  },
  imgPlaceholder: {
    width: '100%', height: '100%',
    display: 'flex', flexDirection: 'column' as const,
    alignItems: 'center', justifyContent: 'center',
  },
  overlay: {
    position: 'absolute' as const, inset: 0,
    background: 'rgba(0,0,0,0.55)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  approvedBadge: {
    position: 'absolute' as const, top: 10, right: 10,
    background: '#16a34a', color: '#fff',
    fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 100,
  },
  cardBody: { padding: '16px 18px 20px', flex: 1, display: 'flex', flexDirection: 'column' as const },
  cardTitle: { fontSize: 14, fontWeight: 600, lineHeight: 1.55, color: '#1a1a1a', marginBottom: 14, flex: 1 },
  catPill: {
    display: 'inline-block', padding: '2px 8px',
    borderRadius: 100, fontSize: 11, fontWeight: 600, marginBottom: 8,
  },
  actions: { display: 'flex', gap: 8, flexWrap: 'wrap' as const, alignItems: 'flex-start' },
  btnPrimary: {
    padding: '9px 16px', border: 'none', borderRadius: 7,
    background: '#2563eb', color: '#fff', fontSize: 13,
    fontWeight: 700, cursor: 'pointer',
  },
  btnApprove: {
    padding: '9px 16px', border: 'none', borderRadius: 7,
    background: '#16a34a', color: '#fff', fontSize: 13,
    fontWeight: 700, cursor: 'pointer',
  },
  btnReject: {
    padding: '9px 16px', borderRadius: 7, fontSize: 13, fontWeight: 700,
    background: 'transparent', border: '1.5px solid #e0ddd8', color: '#64748b', cursor: 'pointer',
  },
  btnGhost: {
    padding: '9px 14px', borderRadius: 7, fontSize: 13, fontWeight: 600,
    background: '#f0ede8', border: 'none', color: '#64748b', cursor: 'pointer',
  },
  btnUpload: {
    padding: '9px 14px', borderRadius: 7, fontSize: 13, fontWeight: 600,
    background: 'transparent', border: '1.5px solid #2563eb', color: '#2563eb', cursor: 'pointer',
  },
  btnReplace: {
    padding: '6px 12px', borderRadius: 7, fontSize: 12, fontWeight: 600,
    background: 'transparent', border: '1px solid #d1d5db', color: '#9ca3af', cursor: 'pointer',
    marginTop: 4,
  },
  btnDisabled: {
    padding: '9px 16px', border: 'none', borderRadius: 7,
    background: '#e5e7eb', color: '#9ca3af', fontSize: 13,
    fontWeight: 700, cursor: 'not-allowed',
  },
  feedbackInput: {
    width: '100%',
    padding: '10px 12px',
    border: '1.5px solid #2563eb',
    borderRadius: 8,
    fontSize: 13,
    fontFamily: 'Inter, -apple-system, sans-serif',
    color: '#1a1a1a',
    resize: 'vertical' as const,
    outline: 'none',
    lineHeight: 1.6,
    boxSizing: 'border-box' as const,
  },
  errorNote: {
    marginTop: 8, fontSize: 12, color: '#dc2626', lineHeight: 1.5,
  },
  allDone: {
    padding: '60px 24px', textAlign: 'center' as const,
    background: '#fff', borderRadius: 12, border: '1px solid #e0ddd8',
  },
  spinner: {
    width: 28, height: 28,
    border: '3px solid #dbeafe',
    borderTopColor: '#2563eb',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  spinnerSm: {
    width: 18, height: 18,
    border: '2px solid rgba(255,255,255,0.4)',
    borderTopColor: '#fff',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  footerNote: {
    marginTop: 40, paddingTop: 20,
    borderTop: '1px solid #e0ddd8',
    fontSize: 12, color: '#aaa9a4', lineHeight: 1.8,
  },
}
