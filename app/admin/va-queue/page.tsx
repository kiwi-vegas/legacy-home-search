'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { SanityBlogPost, WorkflowStatus } from '@/sanity/queries'
import { AdminWorkflowNav } from '@/components/AdminWorkflowNav'

// ─── Workflow queue status display ────────────────────────────────────────────

const STATUS_LABELS: Record<WorkflowStatus, string> = {
  media_pending:   'Needs Media',
  media_ready:     'Ready to Publish',
  publish_pending: 'Publish Pending',
  publishing:      'Publishing…',
  published:       'Published',
  publish_failed:  'Publish Failed',
}

const STATUS_COLORS: Record<WorkflowStatus, { bg: string; text: string; border: string }> = {
  media_pending:   { bg: '#fff7ed', text: '#9a3412',  border: '#fb923c' },
  media_ready:     { bg: '#f0fdf4', text: '#166534',  border: '#4ade80' },
  publish_pending: { bg: '#eff6ff', text: '#1e40af',  border: '#60a5fa' },
  publishing:      { bg: '#eff6ff', text: '#1e40af',  border: '#60a5fa' },
  published:       { bg: '#f0fdf4', text: '#166534',  border: '#86efac' },
  publish_failed:  { bg: '#fef2f2', text: '#991b1b',  border: '#f87171' },
}

// ─── Social card state ────────────────────────────────────────────────────────

type SocialCardPhase =
  | { phase: 'idle' }
  | { phase: 'generating' }
  | { phase: 'confirming'; caption: string }
  | { phase: 'posting' }
  | { phase: 'done' }
  | { phase: 'error'; message: string }

// ─── Helpers ─────────────────────────────────────────────────────────────────

function sanityThumbUrl(ref: string) {
  return `https://cdn.sanity.io/images/2nr7n3lm/production/${ref.replace('image-', '').replace(/-(\w+)$/, '.$1')}`
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function VAQueuePage() {
  const [posts,         setPosts]         = useState<SanityBlogPost[]>([])
  const [socialPosts,   setSocialPosts]   = useState<SanityBlogPost[]>([])
  const [loading,       setLoading]       = useState(true)
  const [socialLoading, setSocialLoading] = useState(true)
  const [error,         setError]         = useState('')
  const [socialDismissed, setSocialDismissed] = useState<Set<string>>(new Set())

  const secret = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('secret') ?? ''
    : ''

  useEffect(() => {
    if (!secret) {
      setLoading(false)
      setSocialLoading(false)
      setError('Unauthorized — add ?secret=... to the URL')
      return
    }

    // Load workflow queue
    fetch(`/api/content/queue?secret=${encodeURIComponent(secret)}`)
      .then(r => r.ok ? r.json() : Promise.reject('Unauthorized'))
      .then(setPosts)
      .catch(() => setError('Failed to load queue'))
      .finally(() => setLoading(false))

    // Load social queue (published posts not yet on Facebook)
    fetch(`/api/content/social-queue?secret=${encodeURIComponent(secret)}`)
      .then(r => r.ok ? r.json() : [])
      .then(setSocialPosts)
      .catch(() => {})
      .finally(() => setSocialLoading(false))
  }, [secret])

  const pending = posts.filter(p => p.workflowStatus === 'media_pending')
  const ready   = posts.filter(p => p.workflowStatus === 'media_ready')
  const other   = posts.filter(p => !['media_pending', 'media_ready'].includes(p.workflowStatus ?? ''))
  const social  = socialPosts.filter(p => !socialDismissed.has(p._id))

  const activeCount = posts.filter(p => ['media_pending', 'media_ready'].includes(p.workflowStatus ?? '')).length

  return (
    <div style={{ minHeight: '100vh', background: '#f8f7f4', fontFamily: 'Inter, sans-serif' }}>
      <AdminWorkflowNav current="va-queue" secret={secret} />

      {/* Title bar */}
      <div style={{
        background: '#fff', borderBottom: '1px solid #e2e8f0',
        padding: '12px 32px', display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <h1 style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a', margin: 0 }}>Media Queue</h1>
        {!loading && activeCount > 0 && (
          <span style={{ fontSize: 12, background: '#fff7ed', color: '#9a3412', borderRadius: 99, padding: '2px 10px', fontWeight: 600 }}>
            {activeCount} need attention
          </span>
        )}
        {!socialLoading && social.length > 0 && (
          <span style={{ fontSize: 12, background: '#eff6ff', color: '#1e40af', borderRadius: 99, padding: '2px 10px', fontWeight: 600 }}>
            {social.length} awaiting Facebook
          </span>
        )}
        <Link
          href={`/admin/thumbnail-review?secret=${secret}`}
          style={{ marginLeft: 'auto', fontSize: 12, color: '#94a3b8', textDecoration: 'none' }}
        >
          Legacy Upload Tool
        </Link>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>
        {loading && <p style={{ color: '#64748b' }}>Loading queue…</p>}
        {error  && <p style={{ color: '#dc2626', background: '#fef2f2', padding: 16, borderRadius: 8 }}>{error}</p>}

        {/* Needs Media */}
        {pending.length > 0 && (
          <Section title="Needs Media" count={pending.length} accent="#9a3412" bg="#fed7aa">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
              {pending.map(post => <PostCard key={post._id} post={post} secret={secret} />)}
            </div>
          </Section>
        )}

        {/* Ready to Publish */}
        {ready.length > 0 && (
          <Section title="Ready to Publish" count={ready.length}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
              {ready.map(post => <PostCard key={post._id} post={post} secret={secret} />)}
            </div>
          </Section>
        )}

        {/* In Progress */}
        {other.length > 0 && (
          <Section title="In Progress / Recent" count={other.length}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
              {other.map(post => <PostCard key={post._id} post={post} secret={secret} />)}
            </div>
          </Section>
        )}

        {!loading && !error && posts.length === 0 && social.length === 0 && !socialLoading && (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#64748b' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✓</div>
            <p style={{ fontSize: 18, fontWeight: 600, color: '#1a1a1a' }}>All caught up</p>
            <p>No posts need media or Facebook publishing right now.</p>
          </div>
        )}

        {/* ── Social Queue ─────────────────────────────────────────────────────── */}
        {(social.length > 0 || socialLoading) && (
          <Section
            title="Published — Post to Facebook"
            count={social.length}
            accent="#1e40af"
            bg="#bfdbfe"
            subtitle="These posts are live on the blog but haven't been pushed to Facebook yet."
          >
            {socialLoading ? (
              <p style={{ color: '#64748b', fontSize: 13 }}>Loading…</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {social.map(post => (
                  <SocialPostCard
                    key={post._id}
                    post={post}
                    secret={secret}
                    onDismiss={(id) => setSocialDismissed(prev => new Set([...prev, id]))}
                  />
                ))}
              </div>
            )}
          </Section>
        )}
      </div>
    </div>
  )
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ title, count, accent = '#1a1a1a', bg = '#e2e8f0', subtitle, children }: {
  title: string
  count: number
  accent?: string
  bg?: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <div style={{ marginBottom: 40 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: subtitle ? 6 : 16 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: accent }}>{title}</h2>
        <span style={{ fontSize: 12, fontWeight: 700, background: bg, color: accent, borderRadius: 99, padding: '2px 8px' }}>
          {count}
        </span>
      </div>
      {subtitle && (
        <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 16px' }}>{subtitle}</p>
      )}
      {children}
    </div>
  )
}

// ─── Workflow post card (links to VA editor) ──────────────────────────────────

function PostCard({ post, secret }: { post: SanityBlogPost; secret: string }) {
  const status = post.workflowStatus as WorkflowStatus
  const colors = STATUS_COLORS[status] ?? STATUS_COLORS.media_pending
  const label  = STATUS_LABELS[status] ?? status
  const hasThumb = !!post.coverImage?.asset

  return (
    <Link href={`/admin/va-queue/${post._id}?secret=${secret}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
      <div style={{ background: '#fff', border: `1.5px solid ${colors.border}`, borderRadius: 12, overflow: 'hidden', cursor: 'pointer' }}
        onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.10)')}
        onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
      >
        <div style={{ height: 140, background: hasThumb ? '#e2e8f0' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          {hasThumb
            ? <img src={sanityThumbUrl(post.coverImage.asset._ref)} alt={post.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <div style={{ textAlign: 'center', color: '#94a3b8' }}><div style={{ fontSize: 28, marginBottom: 4 }}>🖼</div><div style={{ fontSize: 12 }}>No thumbnail yet</div></div>
          }
        </div>
        <div style={{ padding: '14px 16px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#64748b' }}>
              {post.category?.replace(/-/g, ' ')}
            </span>
            <span style={{ fontSize: 11, fontWeight: 700, background: colors.bg, color: colors.text, borderRadius: 99, padding: '2px 8px' }}>
              {label}
            </span>
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a', lineHeight: 1.4, marginBottom: 8 }}>{post.title}</div>
          <div style={{ fontSize: 12, color: '#94a3b8' }}>{post.publishedAt ? fmtDate(post.publishedAt) : 'Unpublished'}</div>
        </div>
      </div>
    </Link>
  )
}

// ─── Social post card ─────────────────────────────────────────────────────────

function SocialPostCard({ post, secret, onDismiss }: {
  post: SanityBlogPost
  secret: string
  onDismiss: (id: string) => void
}) {
  const [state, setState] = useState<SocialCardPhase>({ phase: 'idle' })
  const hasThumb = !!post.coverImage?.asset

  async function handlePost() {
    setState({ phase: 'generating' })
    try {
      // Generate caption first so the user can review it
      const captionRes = await fetch(`/api/content/generate-caption?secret=${encodeURIComponent(secret)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: post.title, excerpt: post.excerpt, category: post.category }),
      })
      const captionData = await captionRes.json()
      const caption = captionData.caption ?? post.excerpt ?? post.title
      setState({ phase: 'confirming', caption })
    } catch {
      setState({ phase: 'error', message: 'Failed to generate caption — try again.' })
    }
  }

  async function handlePublish(caption: string) {
    setState({ phase: 'posting' })
    try {
      const res = await fetch(`/api/content/publish-social?secret=${encodeURIComponent(secret)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: post._id, socialCopy: caption }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Publishing failed')
      setState({ phase: 'done' })
    } catch (err) {
      setState({ phase: 'error', message: err instanceof Error ? err.message : 'Publishing failed' })
    }
  }

  async function handleDecline() {
    await fetch(`/api/content/social-decline?secret=${encodeURIComponent(secret)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postId: post._id }),
    })
    onDismiss(post._id)
  }

  return (
    <div style={{
      background: '#fff',
      border: '1px solid #e2e8f0',
      borderLeft: state.phase === 'done' ? '4px solid #16a34a' : '4px solid #3b82f6',
      borderRadius: 10,
      overflow: 'hidden',
    }}>
      <div style={{ display: 'flex', gap: 0, alignItems: 'stretch' }}>

        {/* Thumbnail */}
        <div style={{
          width: 120, flexShrink: 0,
          background: hasThumb ? '#e2e8f0' : '#f1f5f9',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden',
        }}>
          {hasThumb
            ? <img src={sanityThumbUrl(post.coverImage.asset._ref)} alt={post.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: 11, padding: 8 }}>No image</div>
          }
        </div>

        {/* Content */}
        <div style={{ flex: 1, padding: '14px 16px', minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#64748b' }}>
              {post.category?.replace(/-/g, ' ')}
            </span>
            <span style={{ fontSize: 11, color: '#94a3b8' }}>·</span>
            <span style={{ fontSize: 11, color: '#94a3b8' }}>
              {post.publishedAt ? fmtDate(post.publishedAt) : ''}
            </span>
            {post.blotatoPublishStatus === 'pending' && (
              <span style={{ fontSize: 10, background: '#fefce8', color: '#ca8a04', fontWeight: 700, padding: '1px 7px', borderRadius: 99 }}>
                Blotato pending
              </span>
            )}
          </div>

          <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a', lineHeight: 1.4, marginBottom: 4 }}>
            {post.title}
          </div>

          {post.excerpt && (
            <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5, marginBottom: 10,
              overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any }}>
              {post.excerpt}
            </div>
          )}

          {/* Actions / States */}
          {state.phase === 'idle' && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={handlePost}
                style={{
                  padding: '7px 16px', background: '#1E3A5F', color: '#fff',
                  border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                }}
              >
                Post to Facebook
              </button>
              <button
                onClick={handleDecline}
                style={{
                  padding: '7px 12px', background: 'none', color: '#94a3b8',
                  border: '1px solid #e2e8f0', borderRadius: 7, fontSize: 12, cursor: 'pointer',
                }}
              >
                Decline
              </button>
              <a
                href={`/blog/${post.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ padding: '7px 12px', color: '#64748b', fontSize: 12, textDecoration: 'none', alignSelf: 'center' }}
              >
                View post →
              </a>
            </div>
          )}

          {state.phase === 'generating' && (
            <p style={{ fontSize: 12, color: '#2563eb', margin: 0 }}>⏳ Writing Facebook caption…</p>
          )}

          {state.phase === 'confirming' && (
            <CaptionEditor
              initialCaption={state.caption}
              onPublish={handlePublish}
              onCancel={() => setState({ phase: 'idle' })}
            />
          )}

          {state.phase === 'posting' && (
            <p style={{ fontSize: 12, color: '#2563eb', margin: 0 }}>⏳ Posting to Facebook…</p>
          )}

          {state.phase === 'done' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, color: '#16a34a', fontWeight: 700 }}>✓ Posted to Facebook</span>
              <span style={{ fontSize: 12, color: '#64748b' }}>— Blotato is processing, confirmation arrives in ~1 min</span>
            </div>
          )}

          {state.phase === 'error' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 12, color: '#dc2626' }}>{state.message}</span>
              <button
                onClick={() => setState({ phase: 'idle' })}
                style={{ fontSize: 11, color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
              >
                Retry
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Inline caption editor ────────────────────────────────────────────────────

function CaptionEditor({ initialCaption, onPublish, onCancel }: {
  initialCaption: string
  onPublish: (caption: string) => void
  onCancel: () => void
}) {
  const [caption, setCaption] = useState(initialCaption)

  return (
    <div style={{ marginTop: 4 }}>
      <div style={{ fontSize: 11, color: '#64748b', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        Facebook Caption — review &amp; edit before posting
      </div>
      <textarea
        value={caption}
        onChange={e => setCaption(e.target.value)}
        rows={4}
        style={{
          width: '100%', boxSizing: 'border-box',
          padding: '10px 12px', fontSize: 13, lineHeight: 1.6,
          border: '1.5px solid #3b82f6', borderRadius: 8,
          fontFamily: 'Inter, sans-serif', resize: 'vertical',
          outline: 'none', color: '#1a1a1a',
        }}
      />
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button
          onClick={() => onPublish(caption)}
          disabled={!caption.trim()}
          style={{
            padding: '7px 18px', background: '#16a34a', color: '#fff',
            border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 700,
            cursor: caption.trim() ? 'pointer' : 'not-allowed',
            opacity: caption.trim() ? 1 : 0.5,
          }}
        >
          Publish to Facebook
        </button>
        <button
          onClick={onCancel}
          style={{
            padding: '7px 14px', background: 'none', color: '#64748b',
            border: '1px solid #e2e8f0', borderRadius: 7, fontSize: 12, cursor: 'pointer',
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
