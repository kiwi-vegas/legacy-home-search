'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { SanityBlogPost, WorkflowStatus } from '@/sanity/queries'
import { AdminWorkflowNav } from '@/components/AdminWorkflowNav'

const STATUS_LABELS: Record<WorkflowStatus, string> = {
  media_pending: 'Needs Media',
  media_ready:   'Ready to Publish',
  publish_pending: 'Publish Pending',
  publishing:    'Publishing…',
  published:     'Published',
  publish_failed: 'Publish Failed',
}

const STATUS_COLORS: Record<WorkflowStatus, { bg: string; text: string; border: string }> = {
  media_pending:   { bg: '#fff7ed', text: '#9a3412', border: '#fb923c' },
  media_ready:     { bg: '#f0fdf4', text: '#166534', border: '#4ade80' },
  publish_pending: { bg: '#eff6ff', text: '#1e40af', border: '#60a5fa' },
  publishing:      { bg: '#eff6ff', text: '#1e40af', border: '#60a5fa' },
  published:       { bg: '#f0fdf4', text: '#166534', border: '#86efac' },
  publish_failed:  { bg: '#fef2f2', text: '#991b1b', border: '#f87171' },
}

export default function VAQueuePage() {
  const [posts, setPosts] = useState<SanityBlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const secret = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('secret') ?? ''
    : ''

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/content/queue?secret=${encodeURIComponent(secret)}`)
        if (!res.ok) { setError('Unauthorized — add ?secret=... to the URL'); return }
        const data = await res.json()
        setPosts(data)
      } catch {
        setError('Failed to load queue')
      } finally {
        setLoading(false)
      }
    }
    if (secret) load()
    else { setLoading(false); setError('Unauthorized — add ?secret=... to the URL') }
  }, [secret])

  const pending = posts.filter(p => p.workflowStatus === 'media_pending')
  const ready   = posts.filter(p => p.workflowStatus === 'media_ready')
  const other   = posts.filter(p => !['media_pending', 'media_ready'].includes(p.workflowStatus ?? ''))

  return (
    <div style={{ minHeight: '100vh', background: '#f8f7f4', fontFamily: 'Inter, sans-serif' }}>
      <AdminWorkflowNav current="va-queue" secret={secret} />

      {/* Page title bar */}
      <div style={{
        background: '#fff', borderBottom: '1px solid #e2e8f0',
        padding: '12px 32px', display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <h1 style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a', margin: 0 }}>Media Queue</h1>
        {!loading && !error && posts.length > 0 && (
          <span style={{ fontSize: 12, background: '#fff7ed', color: '#9a3412', borderRadius: 99, padding: '2px 10px', fontWeight: 600 }}>
            {posts.filter(p => p.workflowStatus === 'media_pending' || p.workflowStatus === 'media_ready').length} need attention
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
        {error && <p style={{ color: '#dc2626', background: '#fef2f2', padding: 16, borderRadius: 8 }}>{error}</p>}

        {!loading && !error && posts.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#64748b' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✓</div>
            <p style={{ fontSize: 18, fontWeight: 600, color: '#1a1a1a' }}>Queue is empty</p>
            <p>All approved posts have been published.</p>
          </div>
        )}

        {/* Needs Media */}
        {pending.length > 0 && (
          <Section title="Needs Media" count={pending.length} urgent>
            {pending.map(post => (
              <PostCard key={post._id} post={post} secret={secret} />
            ))}
          </Section>
        )}

        {/* Ready to Publish */}
        {ready.length > 0 && (
          <Section title="Ready to Publish" count={ready.length}>
            {ready.map(post => (
              <PostCard key={post._id} post={post} secret={secret} />
            ))}
          </Section>
        )}

        {/* Other states */}
        {other.length > 0 && (
          <Section title="In Progress / Recent" count={other.length}>
            {other.map(post => (
              <PostCard key={post._id} post={post} secret={secret} />
            ))}
          </Section>
        )}
      </div>
    </div>
  )
}

function Section({ title, count, urgent, children }: {
  title: string; count: number; urgent?: boolean; children: React.ReactNode
}) {
  return (
    <div style={{ marginBottom: 40 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: urgent ? '#9a3412' : '#1a1a1a' }}>
          {title}
        </h2>
        <span style={{
          fontSize: 12, fontWeight: 700,
          background: urgent ? '#fed7aa' : '#e2e8f0',
          color: urgent ? '#9a3412' : '#475569',
          borderRadius: 99, padding: '2px 8px',
        }}>
          {count}
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {children}
      </div>
    </div>
  )
}

function PostCard({ post, secret }: { post: SanityBlogPost; secret: string }) {
  const status = post.workflowStatus as WorkflowStatus
  const colors = STATUS_COLORS[status] ?? STATUS_COLORS.media_pending
  const label = STATUS_LABELS[status] ?? status

  const pubDate = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'Unpublished'

  const hasThumb = !!post.coverImage?.asset

  return (
    <Link
      href={`/admin/va-queue/${post._id}?secret=${secret}`}
      style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
    >
      <div style={{
        background: '#fff',
        border: `1.5px solid ${colors.border}`,
        borderRadius: 12,
        overflow: 'hidden',
        transition: 'box-shadow 0.15s',
        cursor: 'pointer',
      }}
        onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.10)')}
        onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
      >
        {/* Thumbnail preview */}
        <div style={{
          height: 140,
          background: hasThumb ? '#e2e8f0' : '#f1f5f9',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative', overflow: 'hidden',
        }}>
          {hasThumb ? (
            <img
              src={`https://cdn.sanity.io/images/2nr7n3lm/production/${post.coverImage.asset._ref.replace('image-', '').replace(/-(\w+)$/, '.$1')}`}
              alt={post.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <div style={{ textAlign: 'center', color: '#94a3b8' }}>
              <div style={{ fontSize: 28, marginBottom: 4 }}>🖼</div>
              <div style={{ fontSize: 12 }}>No thumbnail yet</div>
            </div>
          )}
        </div>

        {/* Card body */}
        <div style={{ padding: '14px 16px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#64748b' }}>
              {post.category?.replace(/-/g, ' ')}
            </span>
            <span style={{
              fontSize: 11, fontWeight: 700,
              background: colors.bg, color: colors.text,
              borderRadius: 99, padding: '2px 8px',
            }}>
              {label}
            </span>
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a', lineHeight: 1.4, marginBottom: 8 }}>
            {post.title}
          </div>
          <div style={{ fontSize: 12, color: '#94a3b8' }}>{pubDate}</div>
        </div>
      </div>
    </Link>
  )
}
