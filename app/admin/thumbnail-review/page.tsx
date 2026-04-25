'use client'

import { useEffect, useRef, useState } from 'react'
import imageUrlBuilder from '@sanity/image-url'
import { createClient } from '@sanity/client'

const sanityClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? '2nr7n3lm',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production',
  apiVersion: '2024-01-01',
  useCdn: true,
})
const builder = imageUrlBuilder(sanityClient)

type Post = {
  _id: string
  title: string
  slug: string
  publishedAt: string
  category: string
  status?: string
  coverImage?: any
}

const CATEGORY_LABELS: Record<string, string> = {
  'market-update': 'Market Update',
  'buying-tips': 'Buying Tips',
  'selling-tips': 'Selling Tips',
  'community-spotlight': 'Community Spotlight',
  investment: 'Investment',
  news: 'News',
}

function PostCard({
  post,
  secret,
  onPublished,
}: {
  post: Post
  secret: string
  onPublished: (id: string, coverImage: any) => void
}) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const isPending = post.status === 'pending_thumbnail'

  const thumbUrl = post.coverImage
    ? builder.image(post.coverImage).width(400).height(225).fit('crop').url()
    : null

  async function handleFile(file: File) {
    setUploading(true)
    setError(null)
    try {
      const fd = new FormData()
      fd.append('postId', post._id)
      fd.append('image', file)
      const res = await fetch(`/api/blog/upload-thumbnail?secret=${secret}`, {
        method: 'POST',
        body: fd,
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Upload failed')
      onPublished(post._id, {
        _type: 'image',
        asset: { _type: 'reference', _ref: json.assetId },
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div style={{
      background: '#fff',
      border: isPending ? '2px solid #f59e0b' : '1px solid #e5e7eb',
      borderRadius: 10,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Thumbnail area */}
      <div style={{
        width: '100%',
        aspectRatio: '16/9',
        background: '#f3f4f6',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {thumbUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumbUrl} alt={post.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ textAlign: 'center', color: '#9ca3af' }}>
            <div style={{ fontSize: 32, marginBottom: 6 }}>🖼</div>
            <div style={{ fontSize: 12 }}>No thumbnail</div>
          </div>
        )}
        {isPending && (
          <div style={{
            position: 'absolute', top: 8, left: 8,
            background: '#f59e0b', color: '#fff',
            fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
            padding: '3px 8px', borderRadius: 4, textTransform: 'uppercase',
          }}>
            Pending
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '12px 14px', flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ fontSize: 11, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {CATEGORY_LABELS[post.category] ?? post.category}
          {post.publishedAt && (
            <span style={{ marginLeft: 8 }}>
              · {new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          )}
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', lineHeight: 1.4 }}>
          {post.title}
        </div>
      </div>

      {/* Actions */}
      <div style={{ padding: '0 14px 14px' }}>
        {error && <div style={{ fontSize: 11, color: '#dc2626', marginBottom: 6 }}>{error}</div>}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = '' }}
        />
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          style={{
            width: '100%',
            padding: '8px 0',
            background: isPending ? '#f59e0b' : '#1E3A5F',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 600,
            cursor: uploading ? 'wait' : 'pointer',
            opacity: uploading ? 0.7 : 1,
            letterSpacing: '0.03em',
          }}
        >
          {uploading ? 'Uploading…' : isPending ? 'Upload Thumbnail to Publish' : 'Replace Thumbnail'}
        </button>
      </div>
    </div>
  )
}

export default function ThumbnailReviewPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [secret, setSecret] = useState('')
  const [authed, setAuthed] = useState(false)
  const [authError, setAuthError] = useState(false)

  // Read secret from URL on mount
  useEffect(() => {
    const s = new URLSearchParams(window.location.search).get('secret') ?? ''
    setSecret(s)
    if (s) loadPosts(s)
    else setLoading(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadPosts(s: string) {
    setLoading(true)
    setAuthError(false)
    try {
      const res = await fetch(`/api/blog/all-posts?secret=${s}`)
      if (res.status === 401) { setAuthError(true); setLoading(false); return }
      const data = await res.json()
      setPosts(data)
      setAuthed(true)
    } catch {
      setAuthError(true)
    } finally {
      setLoading(false)
    }
  }

  function handlePublished(id: string, coverImage: any) {
    setPosts(prev => prev.map(p =>
      p._id === id ? { ...p, status: 'published', coverImage } : p
    ))
  }

  const pending = posts.filter(p => p.status === 'pending_thumbnail')
  const published = posts.filter(p => p.status !== 'pending_thumbnail')

  if (!secret && !loading) {
    return (
      <div style={{ padding: 48, fontFamily: 'system-ui', color: '#111' }}>
        <p>Add <code>?secret=YOUR_ADMIN_SECRET</code> to the URL.</p>
      </div>
    )
  }

  if (authError) {
    return (
      <div style={{ padding: 48, fontFamily: 'system-ui', color: '#dc2626' }}>
        <p>Unauthorized. Check your secret.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div style={{ padding: 48, fontFamily: 'system-ui', color: '#6b7280' }}>
        Loading posts…
      </div>
    )
  }

  return (
    <div style={{ background: '#f9fafb', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ background: '#1E3A5F', padding: '20px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>
            Legacy Home Search — Admin
          </div>
          <h1 style={{ color: '#fff', margin: 0, fontSize: 20, fontWeight: 700 }}>Thumbnail Manager</h1>
        </div>
        <a href="/blog" target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, textDecoration: 'none' }}>
          View Blog →
        </a>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>

        {/* Pending section */}
        {pending.length > 0 && (
          <section style={{ marginBottom: 48 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#111827' }}>Needs Thumbnail</h2>
              <span style={{ background: '#fef3c7', color: '#92400e', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>
                {pending.length} post{pending.length !== 1 ? 's' : ''}
              </span>
              <span style={{ fontSize: 12, color: '#6b7280' }}>— not visible on the public blog until a thumbnail is uploaded</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
              {pending.map(p => (
                <PostCard key={p._id} post={p} secret={secret} onPublished={handlePublished} />
              ))}
            </div>
          </section>
        )}

        {pending.length === 0 && authed && (
          <div style={{ background: '#d1fae5', border: '1px solid #6ee7b7', borderRadius: 8, padding: '12px 16px', marginBottom: 32, fontSize: 13, color: '#065f46' }}>
            ✓ All posts have thumbnails and are live.
          </div>
        )}

        {/* Published section */}
        {published.length > 0 && (
          <section>
            <h2 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700, color: '#111827' }}>
              Published ({published.length})
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
              {published.map(p => (
                <PostCard key={p._id} post={p} secret={secret} onPublished={handlePublished} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
