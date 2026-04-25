'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import type { SanityBlogPost, WorkflowStatus } from '@/sanity/queries'
import { buildDefaultThumbnailPrompt, detectCommunitySlug } from '@/lib/thumbnail-prompt'

type AssetImage = { url: string; label: string }

type ThumbnailState =
  | { type: 'none' }
  | { type: 'generating' }
  | { type: 'dalle'; url: string }      // temp DALL-E URL
  | { type: 'upload'; file: File; previewUrl: string }
  | { type: 'saved' }                   // already saved to Sanity (media_ready)

type PublishState =
  | { phase: 'idle' }
  | { phase: 'saving' }
  | { phase: 'publishing' }
  | { phase: 'polling'; postSubmissionId: string }
  | { phase: 'done'; facebookUrl?: string }
  | { phase: 'error'; message: string }

const CATEGORY_LABELS: Record<string, string> = {
  'market-update': 'Market Update',
  'buying-tips':   'Buying Tips',
  'selling-tips':  'Selling Tips',
  'community-spotlight': 'Community Spotlight',
  'investment':    'Investment',
  'news':          'News',
}

export default function VAPostPage() {
  const params = useParams()
  const postId = params.postId as string

  const secret = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('secret') ?? ''
    : ''

  const [post, setPost] = useState<SanityBlogPost | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Media editor state
  const [prompt, setPrompt] = useState('')
  const [backgrounds, setBackgrounds] = useState<AssetImage[]>([])
  const [clientImages, setClientImages] = useState<AssetImage[]>([])
  const [selectedBg, setSelectedBg] = useState<string | null>(null)
  const [selectedClient, setSelectedClient] = useState<string | null>(null)
  const [thumbnail, setThumbnail] = useState<ThumbnailState>({ type: 'none' })
  const [socialCopy, setSocialCopy] = useState('')
  const [generatingCaption, setGeneratingCaption] = useState(false)
  const [generateError, setGenerateError] = useState('')

  // Publish state
  const [publishState, setPublishState] = useState<PublishState>({ phase: 'idle' })
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── Load post ────────────────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      if (!secret) { setError('Unauthorized'); setLoading(false); return }
      try {
        const res = await fetch(`/api/content/post?secret=${encodeURIComponent(secret)}&postId=${encodeURIComponent(postId)}`)
        if (res.status === 401) { setError('Unauthorized'); return }
        if (res.status === 404) { setError('Post not found.'); return }
        if (!res.ok) { setError('Failed to load post'); return }
        const found: SanityBlogPost = await res.json()
        setPost(found)

        if (found) {
          // Pre-fill prompt
          const community = detectCommunitySlug(found.title, found.slug ?? '')
          setPrompt(buildDefaultThumbnailPrompt({
            title: found.title,
            category: found.category ?? '',
            excerpt: found.excerpt,
            community,
          }))
          setSocialCopy(found.socialCopy ?? '')

          if (found.workflowStatus === 'media_ready' || found.workflowStatus === 'published') {
            setThumbnail({ type: 'saved' })
          }

          // Load asset pickers
          const assetRes = await fetch(`/api/content/assets?secret=${encodeURIComponent(secret)}&community=${community ?? ''}`)
          if (assetRes.ok) {
            const { backgrounds: bgs, clientImages: cis } = await assetRes.json()
            setBackgrounds(bgs)
            setClientImages(cis)
            if (bgs.length > 0) setSelectedBg(bgs[0].url)
            if (cis.length > 0) setSelectedClient(cis[0].url)
          }
        }
      } catch {
        setError('Failed to load post')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [postId, secret])

  // ── Cleanup poll on unmount ──────────────────────────────────────────────────
  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current) }, [])

  // ── Generate Facebook caption ─────────────────────────────────────────────────
  async function handleGenerateCaption() {
    if (!post) return
    setGeneratingCaption(true)
    try {
      const res = await fetch(`/api/content/generate-caption?secret=${encodeURIComponent(secret)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: post.title, excerpt: post.excerpt, category: post.category }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed')
      setSocialCopy(data.caption)
    } catch {
      // leave existing copy unchanged
    } finally {
      setGeneratingCaption(false)
    }
  }

  // ── Generate thumbnail ───────────────────────────────────────────────────────
  async function handleGenerate() {
    setGenerateError('')
    setThumbnail({ type: 'generating' })
    try {
      const res = await fetch(`/api/content/generate-thumbnail?secret=${encodeURIComponent(secret)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Generation failed')
      setThumbnail({ type: 'dalle', url: data.imageUrl })
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : 'Generation failed')
      setThumbnail({ type: 'none' })
    }
  }

  // ── Upload thumbnail ─────────────────────────────────────────────────────────
  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const previewUrl = URL.createObjectURL(file)
    setThumbnail({ type: 'upload', file, previewUrl })
  }

  // ── Mark Ready ───────────────────────────────────────────────────────────────
  async function handleMarkReady() {
    if (thumbnail.type === 'none' || thumbnail.type === 'generating' || thumbnail.type === 'saved') return

    setPublishState({ phase: 'saving' })

    try {
      const form = new FormData()
      form.append('postId', postId)
      form.append('socialCopy', socialCopy)

      if (thumbnail.type === 'upload') {
        form.append('image', thumbnail.file)
      } else if (thumbnail.type === 'dalle') {
        form.append('imageUrl', thumbnail.url)
      }

      const res = await fetch(`/api/content/mark-ready?secret=${encodeURIComponent(secret)}`, {
        method: 'POST',
        body: form,
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to save')

      setThumbnail({ type: 'saved' })
      setPost(prev => prev ? { ...prev, workflowStatus: 'media_ready' as WorkflowStatus } : prev)
      setPublishState({ phase: 'idle' })
    } catch (err) {
      setPublishState({ phase: 'error', message: err instanceof Error ? err.message : 'Save failed' })
    }
  }

  // ── Publish ──────────────────────────────────────────────────────────────────
  async function handlePublish() {
    setPublishState({ phase: 'publishing' })

    try {
      const res = await fetch(`/api/content/publish?secret=${encodeURIComponent(secret)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, socialCopy }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Publish failed')

      const { postSubmissionId } = data
      setPublishState({ phase: 'polling', postSubmissionId })

      // Poll for Blotato status
      let attempts = 0
      pollRef.current = setInterval(async () => {
        attempts++
        try {
          const statusRes = await fetch(
            `/api/content/blotato-status?secret=${encodeURIComponent(secret)}&postSubmissionId=${encodeURIComponent(postSubmissionId)}&postId=${encodeURIComponent(postId)}`
          )
          const statusData = await statusRes.json()

          if (statusData.status === 'published') {
            clearInterval(pollRef.current!)
            setPublishState({ phase: 'done', facebookUrl: statusData.postUrl })
            setPost(prev => prev ? { ...prev, workflowStatus: 'published' as WorkflowStatus } : prev)
          } else if (statusData.status === 'failed') {
            clearInterval(pollRef.current!)
            setPublishState({ phase: 'error', message: statusData.errorMessage ?? 'Facebook publish failed' })
          } else if (attempts >= 30) {
            // Stop polling after 5 min; status already saved in Sanity
            clearInterval(pollRef.current!)
            setPublishState({ phase: 'done' })
          }
        } catch { /* ignore poll errors, keep trying */ }
      }, 10000)
    } catch (err) {
      setPublishState({ phase: 'error', message: err instanceof Error ? err.message : 'Publish failed' })
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  const thumbnailPreviewUrl =
    thumbnail.type === 'dalle' ? thumbnail.url :
    thumbnail.type === 'upload' ? thumbnail.previewUrl :
    thumbnail.type === 'saved' && post?.coverImage?.asset
      ? `https://cdn.sanity.io/images/2nr7n3lm/production/${post.coverImage.asset._ref.replace('image-', '').replace(/-(\w+)$/, '.$1')}`
      : null

  const isReady = post?.workflowStatus === 'media_ready'
  const isPublished = post?.workflowStatus === 'published'
  const canMarkReady = thumbnail.type === 'dalle' || thumbnail.type === 'upload'
  const canPublish = (isReady || isPublished === false) && thumbnail.type === 'saved'
  const publishInProgress = ['saving', 'publishing', 'polling'].includes(publishState.phase)

  if (loading) return <PageShell><p style={{ padding: 32, color: '#64748b' }}>Loading…</p></PageShell>
  if (error) return <PageShell><p style={{ padding: 32, color: '#dc2626' }}>{error}</p></PageShell>
  if (!post) return <PageShell><p style={{ padding: 32, color: '#64748b' }}>Post not found in queue.</p></PageShell>

  return (
    <PageShell>
      {/* Nav */}
      <div style={{ background: '#1E3A5F', color: '#fff', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <Link href={`/admin/va-queue?secret=${secret}`} style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, textDecoration: 'none' }}>
          ← Back to Queue
        </Link>
        <span style={{ opacity: 0.3 }}>|</span>
        <span style={{ fontSize: 14, fontWeight: 600 }}>{post.title}</span>
        {post.workflowStatus && (
          <span style={{ marginLeft: 'auto', fontSize: 11, background: 'rgba(255,255,255,0.15)', padding: '3px 10px', borderRadius: 99 }}>
            {post.workflowStatus.replace(/_/g, ' ').toUpperCase()}
          </span>
        )}
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px', display: 'grid', gridTemplateColumns: '1fr 420px', gap: 32, alignItems: 'start' }}>

        {/* ── LEFT: Article Context + Thumbnail Builder ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Article context */}
          <Card title="Article">
            <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
              {post.category && (
                <span style={{ fontSize: 11, fontWeight: 700, background: '#EEF1F5', color: '#1E3A5F', padding: '3px 10px', borderRadius: 99 }}>
                  {CATEGORY_LABELS[post.category] ?? post.category}
                </span>
              )}
              {post.publishedAt && (
                <span style={{ fontSize: 11, color: '#94a3b8' }}>
                  {new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </span>
              )}
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 10px', color: '#1a1a1a', lineHeight: 1.4 }}>{post.title}</h2>
            {post.excerpt && <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.6, margin: 0 }}>{post.excerpt}</p>}
          </Card>

          {/* Social copy */}
          <Card title="Facebook Post Caption">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>
                This text will be posted to the Legacy Home Team Facebook page. Edit it before publishing.
              </p>
              <button
                onClick={handleGenerateCaption}
                disabled={generatingCaption}
                style={{
                  flexShrink: 0, marginLeft: 12,
                  padding: '5px 14px', background: '#eff6ff', color: '#1e40af',
                  border: '1px solid #93c5fd', borderRadius: 6, fontSize: 12,
                  fontWeight: 600, cursor: generatingCaption ? 'wait' : 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {generatingCaption ? 'Writing…' : '✨ Generate Caption'}
              </button>
            </div>
            <textarea
              value={socialCopy}
              onChange={e => setSocialCopy(e.target.value)}
              placeholder="Facebook post caption will appear here after generating or editing…"
              rows={4}
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: 12, border: '1px solid #e2e8f0', borderRadius: 8,
                fontSize: 14, lineHeight: 1.6, resize: 'vertical',
                fontFamily: 'Inter, sans-serif', color: '#1a1a1a',
              }}
            />
            <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>
              The blog post URL will be appended automatically when published.
            </p>
          </Card>

          {/* Thumbnail builder */}
          {!isPublished && (
            <Card title="Thumbnail Builder">
              {/* Prompt editor */}
              <label style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a', display: 'block', marginBottom: 6 }}>
                Image Prompt
              </label>
              <textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                rows={6}
                style={{
                  width: '100%', boxSizing: 'border-box',
                  padding: 12, border: '1px solid #e2e8f0', borderRadius: 8,
                  fontSize: 13, lineHeight: 1.6, resize: 'vertical',
                  fontFamily: 'Inter, sans-serif', color: '#1a1a1a',
                  marginBottom: 16,
                }}
              />

              {/* Background picker */}
              {backgrounds.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a', display: 'block', marginBottom: 8 }}>
                    Background Image (for reference)
                  </label>
                  <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
                    {backgrounds.slice(0, 8).map(bg => (
                      <button
                        key={bg.url}
                        onClick={() => setSelectedBg(bg.url)}
                        title={bg.label}
                        style={{
                          flexShrink: 0, width: 72, height: 48,
                          borderRadius: 6, overflow: 'hidden', padding: 0, cursor: 'pointer',
                          border: selectedBg === bg.url ? '2px solid #1E3A5F' : '2px solid transparent',
                        }}
                      >
                        <img src={bg.url} alt={bg.label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Client image picker */}
              {clientImages.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a', display: 'block', marginBottom: 8 }}>
                    Client Image
                  </label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {clientImages.map(ci => (
                      <button
                        key={ci.url}
                        onClick={() => setSelectedClient(ci.url)}
                        title={ci.label}
                        style={{
                          width: 56, height: 56, borderRadius: 8, overflow: 'hidden',
                          padding: 0, cursor: 'pointer',
                          border: selectedClient === ci.url ? '2px solid #1E3A5F' : '2px solid #e2e8f0',
                          background: '#f8fafc',
                        }}
                      >
                        <img src={ci.url} alt={ci.label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Generate button */}
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <button
                  onClick={handleGenerate}
                  disabled={thumbnail.type === 'generating' || !prompt.trim()}
                  style={{
                    padding: '10px 24px', background: '#1E3A5F', color: '#fff',
                    border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600,
                    cursor: thumbnail.type === 'generating' ? 'wait' : 'pointer',
                    opacity: thumbnail.type === 'generating' ? 0.7 : 1,
                  }}
                >
                  {thumbnail.type === 'generating' ? 'Generating…' : '✨ Generate Thumbnail'}
                </button>

                <span style={{ color: '#94a3b8', fontSize: 13 }}>— or —</span>

                <label style={{
                  padding: '10px 20px', background: '#f1f5f9', color: '#475569',
                  border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14,
                  fontWeight: 600, cursor: 'pointer',
                }}>
                  Upload Image
                  <input type="file" accept="image/*" onChange={handleFileSelect} style={{ display: 'none' }} />
                </label>
              </div>

              {generateError && (
                <p style={{ marginTop: 10, fontSize: 13, color: '#dc2626' }}>{generateError}</p>
              )}
            </Card>
          )}
        </div>

        {/* ── RIGHT: Preview + Publish ── */}
        <div style={{ position: 'sticky', top: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Thumbnail preview */}
          <Card title="Thumbnail Preview">
            <div style={{
              aspectRatio: '16/9', background: '#f1f5f9', borderRadius: 8, overflow: 'hidden',
              display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12,
            }}>
              {thumbnailPreviewUrl ? (
                <img src={thumbnailPreviewUrl} alt="Thumbnail preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : thumbnail.type === 'generating' ? (
                <div style={{ textAlign: 'center', color: '#94a3b8' }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>⏳</div>
                  <div style={{ fontSize: 13 }}>Generating…</div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', color: '#94a3b8' }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>🖼</div>
                  <div style={{ fontSize: 13 }}>No thumbnail yet</div>
                </div>
              )}
            </div>

            {/* Mark Ready button */}
            {canMarkReady && (
              <button
                onClick={handleMarkReady}
                disabled={publishInProgress}
                style={{
                  width: '100%', padding: '11px 0',
                  background: '#166534', color: '#fff',
                  border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600,
                  cursor: publishInProgress ? 'wait' : 'pointer',
                  opacity: publishInProgress ? 0.7 : 1,
                }}
              >
                {publishState.phase === 'saving' ? 'Saving…' : '✓ Mark as Ready'}
              </button>
            )}

            {thumbnail.type === 'saved' && (
              <div style={{ fontSize: 12, color: '#166534', fontWeight: 600, textAlign: 'center', padding: '8px 0' }}>
                ✓ Thumbnail saved
              </div>
            )}
          </Card>

          {/* Publish panel */}
          <Card title="Publish">
            <p style={{ fontSize: 13, color: '#64748b', marginBottom: 16, lineHeight: 1.5 }}>
              Pressing Publish will:
            </p>
            <ul style={{ fontSize: 13, color: '#475569', lineHeight: 1.8, margin: '0 0 20px', paddingLeft: 18 }}>
              <li>Make the post live on the website</li>
              <li>Post to the Legacy Home Team Facebook page</li>
            </ul>

            {publishState.phase === 'error' && (
              <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 13, color: '#991b1b' }}>
                {publishState.message}
              </div>
            )}

            {publishState.phase === 'done' && (
              <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 13, color: '#166534' }}>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>✓ Published successfully!</div>
                <div>Post is live on the website.</div>
                {publishState.facebookUrl && (
                  <a href={publishState.facebookUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#166534', display: 'block', marginTop: 4 }}>
                    View Facebook post →
                  </a>
                )}
                <a href={`/blog/${post.slug}`} target="_blank" rel="noopener noreferrer" style={{ color: '#166534', display: 'block', marginTop: 4 }}>
                  View blog post →
                </a>
              </div>
            )}

            {publishState.phase === 'polling' && (
              <div style={{ background: '#eff6ff', border: '1px solid #93c5fd', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 13, color: '#1e40af' }}>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>✓ Post submitted!</div>
                <div>Waiting for Facebook confirmation…</div>
              </div>
            )}

            {isPublished ? (
              <div style={{ fontSize: 13, color: '#166534', fontWeight: 600, padding: '8px 0', textAlign: 'center' }}>
                ✓ Already published
              </div>
            ) : (
              <button
                onClick={handlePublish}
                disabled={!canPublish || publishInProgress}
                style={{
                  width: '100%', padding: '13px 0',
                  background: canPublish && !publishInProgress ? '#1E3A5F' : '#e2e8f0',
                  color: canPublish && !publishInProgress ? '#fff' : '#94a3b8',
                  border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 700,
                  cursor: canPublish && !publishInProgress ? 'pointer' : 'not-allowed',
                  transition: 'background 0.2s',
                }}
              >
                {publishState.phase === 'publishing' ? 'Publishing…' :
                 publishState.phase === 'polling'    ? 'Waiting for confirmation…' :
                 publishState.phase === 'saving'     ? 'Saving thumbnail…' :
                 '🚀 Publish'}
              </button>
            )}

            {!canPublish && !isPublished && thumbnail.type !== 'saved' && (
              <p style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center', marginTop: 8 }}>
                Generate or upload a thumbnail, then click "Mark as Ready" first.
              </p>
            )}
          </Card>
        </div>
      </div>
    </PageShell>
  )
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', background: '#f8f7f4', fontFamily: 'Inter, sans-serif' }}>
      {children}
    </div>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20 }}>
      <h3 style={{ fontSize: 13, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 14px' }}>
        {title}
      </h3>
      {children}
    </div>
  )
}
