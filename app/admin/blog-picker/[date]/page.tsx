'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import type { ScoredArticle } from '@/lib/types'

const CATEGORY_LABELS: Record<string, string> = {
  'market-update': 'Market Update',
  'buying-tips': 'Buying Tips',
  'selling-tips': 'Selling Tips',
  'community-spotlight': 'Community Spotlight',
  investment: 'Investment',
  news: 'News',
}

const CATEGORY_COLORS: Record<string, string> = {
  'market-update': '#2563eb',
  'buying-tips': '#4CAF50',
  'selling-tips': '#0ea5e9',
  'community-spotlight': '#9C27B0',
  investment: '#FF9800',
  news: '#607D8B',
}

export default function BlogPickerPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const date = params.date as string
  const secret = searchParams.get('secret') ?? ''

  const [articles, setArticles] = useState<ScoredArticle[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [publishing, setPublishing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ published: Array<{ title: string; slug: string }> } | null>(null)

  useEffect(() => {
    if (!date || !secret) {
      setError('Missing date or secret in URL')
      setLoading(false)
      return
    }

    fetch(`/api/articles/${date}?secret=${secret}`)
      .then((r) => {
        if (!r.ok) throw new Error(r.status === 401 ? 'Unauthorized' : 'No articles found for this date')
        return r.json()
      })
      .then((data) => setArticles(data.articles ?? []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [date, secret])

  const MAX_SELECTION = 5

  function toggleArticle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else if (next.size < MAX_SELECTION) {
        next.add(id)
      }
      return next
    })
  }

  async function handlePublish() {
    if (selected.size === 0) return
    setPublishing(true)
    setError(null)

    try {
      const res = await fetch('/api/blog/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret, date, articleIds: Array.from(selected) }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error ?? data.message ?? 'Publish failed')
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setPublishing(false)
    }
  }

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <div style={styles.loading}>Loading today&apos;s articles...</div>
        </div>
      </div>
    )
  }

  if (result) {
    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <div style={styles.successBox}>
            <div style={styles.successIcon}>✓</div>
            <h2 style={styles.successTitle}>{result.published.length} {result.published.length === 1 ? 'Post' : 'Posts'} Published</h2>
            <p style={styles.successSub}>They&apos;re live on the blog now.</p>
            <ul style={styles.publishedList}>
              {result.published.map((p) => (
                <li key={p.slug} style={styles.publishedItem}>
                  <a
                    href={`/blog/${p.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={styles.publishedLink}
                  >
                    {p.title} →
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    )
  }

  const dateFormatted = new Date(date + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div style={styles.page}>
      <div style={styles.container}>

        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerLabel}>Legacy Home Search · Blog Pipeline</div>
          <h1 style={styles.headerTitle}>Pick Articles to Publish</h1>
          <p style={styles.headerSub}>{dateFormatted} · {articles.length} articles found · select 1–5</p>
        </div>

        {error && <div style={styles.errorBox}>{error}</div>}

        {/* Progress bar */}
        <div style={styles.progressBar}>
          <div style={styles.progressLabel}>
            {selected.size}/{MAX_SELECTION} selected
          </div>
          <div style={styles.progressTrack}>
            {Array.from({ length: MAX_SELECTION }, (_, i) => (
              <div
                key={i}
                style={{
                  ...styles.progressDot,
                  background: i < selected.size ? '#2563eb' : '#e5e3de',
                }}
              />
            ))}
          </div>
        </div>

        {/* Article grid */}
        <div style={styles.grid}>
          {articles.map((article, index) => {
            const isSelected = selected.has(article.id)
            const color = CATEGORY_COLORS[article.category] ?? '#2563eb'
            return (
              <div
                key={article.id}
                onClick={() => toggleArticle(article.id)}
                style={{
                  ...styles.card,
                  border: isSelected
                    ? '2px solid #2563eb'
                    : '2px solid #e0ddd8',
                  background: isSelected ? '#eff6ff' : '#ffffff',
                  cursor: selected.size >= MAX_SELECTION && !isSelected ? 'not-allowed' : 'pointer',
                  opacity: selected.size >= MAX_SELECTION && !isSelected ? 0.4 : 1,
                }}
              >
                <div style={styles.cardTop}>
                  <span style={styles.cardNumber}>{index + 1}</span>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ ...styles.categoryBadge, background: color + '22', color }}>
                      {CATEGORY_LABELS[article.category] ?? article.category}
                    </span>
                    <span style={styles.score}>{article.relevanceScore}/10</span>
                  </div>
                </div>
                <div style={styles.cardTitle}>{article.title}</div>
                <div style={styles.cardSummary}>{article.whyItMatters}</div>
                <div style={styles.cardMeta}>
                  {article.source}
                  {article.publishedDate
                    ? ` · ${new Date(article.publishedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                    : ''}
                </div>
                {isSelected && (
                  <div style={styles.selectedBadge}>Selected</div>
                )}
              </div>
            )
          })}
        </div>

        {/* Publish button */}
        <div style={styles.footer}>
          <button
            onClick={handlePublish}
            disabled={selected.size === 0 || publishing}
            style={{
              ...styles.publishBtn,
              opacity: selected.size === 0 || publishing ? 0.4 : 1,
              cursor: selected.size === 0 || publishing ? 'not-allowed' : 'pointer',
            }}
          >
            {publishing
              ? 'Publishing...'
              : selected.size > 0
                ? `Publish ${selected.size} Post${selected.size !== 1 ? 's' : ''} →`
                : 'Select at least 1 article'}
          </button>
          <p style={styles.footerNote}>
            Claude will write and publish all selected posts simultaneously. This may take up to 60 seconds per post.
          </p>
        </div>

      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: '#f8f7f4',
    fontFamily: 'Inter, -apple-system, sans-serif',
    color: '#1a1a1a',
  },
  container: {
    maxWidth: 900,
    margin: '0 auto',
    padding: '48px 24px',
  },
  loading: {
    textAlign: 'center',
    color: '#888884',
    padding: '80px 0',
    fontSize: 16,
  },
  header: {
    marginBottom: 32,
    paddingBottom: 24,
    borderBottom: '1px solid #e0ddd8',
  },
  headerLabel: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    color: '#2563eb',
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 800,
    margin: '0 0 8px',
    letterSpacing: '-0.02em',
    color: '#1a1a1a',
  },
  headerSub: {
    fontSize: 14,
    color: '#888884',
    margin: 0,
  },
  errorBox: {
    background: 'rgba(220,38,38,0.08)',
    border: '1px solid rgba(220,38,38,0.2)',
    color: '#dc2626',
    padding: '12px 16px',
    borderRadius: 8,
    fontSize: 14,
    marginBottom: 24,
  },
  progressBar: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    marginBottom: 24,
  },
  progressLabel: {
    fontSize: 13,
    color: '#555550',
    fontWeight: 600,
  },
  progressTrack: {
    display: 'flex',
    gap: 8,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: '50%',
    transition: 'background 0.2s',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
    gap: 16,
    marginBottom: 40,
  },
  card: {
    borderRadius: 12,
    padding: 20,
    position: 'relative',
    transition: 'border-color 0.15s, background 0.15s',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
  },
  cardTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardNumber: {
    fontSize: 20,
    fontWeight: 700,
    color: '#2563eb',
  },
  categoryBadge: {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    padding: '2px 8px',
    borderRadius: 4,
  },
  score: {
    fontSize: 11,
    color: '#888884',
    fontWeight: 600,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 600,
    lineHeight: 1.45,
    marginBottom: 8,
    color: '#1a1a1a',
  },
  cardSummary: {
    fontSize: 13,
    lineHeight: 1.6,
    color: '#555550',
    marginBottom: 10,
  },
  cardMeta: {
    fontSize: 11,
    color: '#888884',
  },
  selectedBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    background: '#2563eb',
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 700,
    padding: '2px 8px',
    borderRadius: 4,
  },
  footer: {
    textAlign: 'center',
    paddingTop: 24,
    borderTop: '1px solid #e0ddd8',
  },
  publishBtn: {
    background: '#2563eb',
    color: '#ffffff',
    border: 'none',
    padding: '16px 48px',
    fontSize: 15,
    fontWeight: 700,
    letterSpacing: '0.04em',
    borderRadius: 8,
    transition: 'opacity 0.2s',
  },
  footerNote: {
    marginTop: 12,
    fontSize: 12,
    color: '#888884',
  },
  successBox: {
    textAlign: 'center',
    padding: '80px 0',
  },
  successIcon: {
    fontSize: 48,
    color: '#2563eb',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: 800,
    margin: '0 0 8px',
    color: '#1a1a1a',
  },
  successSub: {
    color: '#888884',
    margin: '0 0 32px',
  },
  publishedList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },
  publishedItem: {
    padding: '8px 0',
    borderBottom: '1px solid #e0ddd8',
  },
  publishedLink: {
    color: '#2563eb',
    textDecoration: 'none',
    fontSize: 14,
  },
}
