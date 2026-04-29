'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { upload } from '@vercel/blob/client'
import type { SanityBlogPost, WorkflowStatus } from '@/sanity/queries'
type ThumbnailState =
  | { type: 'none' }
  | { type: 'upload'; file: File; previewUrl: string }
  | { type: 'saved' }

type VideoState =
  | { type: 'none' }
  | { type: 'heygen-generating'; videoId: string; message: string }
  | { type: 'uploading'; progress: number }
  | { type: 'ready'; url: string; filename: string }
  | { type: 'saved'; url: string }

type PlatformStatus =
  | { phase: 'idle' }
  | { phase: 'publishing' }
  | { phase: 'polling'; submissionId: string }
  | { phase: 'done'; postUrl?: string }
  | { phase: 'error'; message: string }

type PublishState =
  | { phase: 'idle' }
  | { phase: 'saving' }
  | { phase: 'publishing' }
  | {
      phase: 'polling'
      facebook: PlatformStatus
      youtube: PlatformStatus
      tiktok: PlatformStatus
    }
  | {
      phase: 'done'
      facebook: PlatformStatus
      youtube: PlatformStatus
      tiktok: PlatformStatus
    }
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
  const [thumbnail, setThumbnail] = useState<ThumbnailState>({ type: 'none' })
  const [socialCopy, setSocialCopy] = useState('')
  const [generatingCaption, setGeneratingCaption] = useState(false)
  const [videoScript, setVideoScript] = useState('')
  const [generatingScript, setGeneratingScript] = useState(false)
  const [video, setVideo] = useState<VideoState>({ type: 'none' })
  const [videoThumbnailUrl, setVideoThumbnailUrl] = useState<string | null>(null)
  const [uploadingVideoThumb, setUploadingVideoThumb] = useState(false)
  const heygenPollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Publish state
  const [publishState, setPublishState] = useState<PublishState>({ phase: 'idle' })
  const pollRefs = useRef<Record<string, ReturnType<typeof setInterval>>>({})

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
          setSocialCopy(found.socialCopy ?? '')
          setVideoScript(found.videoScript ?? '')

          if (found.workflowStatus === 'media_ready' || found.workflowStatus === 'published') {
            setThumbnail({ type: 'saved' })
          }

          if (found.videoUrl) {
            setVideo({ type: 'saved', url: found.videoUrl })
          }
          if (found.videoThumbnailUrl) {
            setVideoThumbnailUrl(found.videoThumbnailUrl)
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

  // ── Cleanup polls on unmount ─────────────────────────────────────────────────
  useEffect(() => () => {
    Object.values(pollRefs.current).forEach(clearInterval)
    if (heygenPollRef.current) clearInterval(heygenPollRef.current)
  }, [])

  // ── Generate Facebook caption ────────────────────────────────────────────────
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

  // ── Generate video script ────────────────────────────────────────────────────
  async function handleGenerateScript() {
    if (!post) return
    setGeneratingScript(true)
    try {
      const res = await fetch(`/api/content/generate-script?secret=${encodeURIComponent(secret)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: post.title, excerpt: post.excerpt, category: post.category }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed')
      setVideoScript(data.script)
    } catch {
      // leave existing script unchanged
    } finally {
      setGeneratingScript(false)
    }
  }

  // ── Generate video via HeyGen ────────────────────────────────────────────────
  async function handleGenerateHeyGenVideo() {
    if (!videoScript.trim()) return
    if (heygenPollRef.current) clearInterval(heygenPollRef.current)

    try {
      const res = await fetch(`/api/content/generate-heygen-video?secret=${encodeURIComponent(secret)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ script: videoScript }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to start video generation')

      const { videoId } = data
      setVideo({ type: 'heygen-generating', videoId, message: 'Starting render…' })

      let elapsed = 0
      heygenPollRef.current = setInterval(async () => {
        elapsed += 15
        const minutes = Math.floor(elapsed / 60)
        const seconds = elapsed % 60
        const timeStr = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`

        setVideo(prev =>
          prev.type === 'heygen-generating'
            ? { ...prev, message: `Rendering… ${timeStr}` }
            : prev
        )

        try {
          const statusRes = await fetch(
            `/api/content/heygen-status?secret=${encodeURIComponent(secret)}&videoId=${encodeURIComponent(videoId)}`
          )
          const statusData = await statusRes.json()

          if (statusData.status === 'completed') {
            clearInterval(heygenPollRef.current!)
            setVideo({ type: 'ready', url: statusData.videoUrl, filename: 'heygen-video.mp4' })
          } else if (statusData.status === 'failed') {
            clearInterval(heygenPollRef.current!)
            setVideo({ type: 'none' })
            alert(`HeyGen render failed: ${statusData.error ?? 'Unknown error'}`)
          } else if (elapsed >= 600) {
            // Stop after 10 minutes
            clearInterval(heygenPollRef.current!)
            setVideo({ type: 'none' })
            alert('HeyGen render timed out after 10 minutes. Try again.')
          }
        } catch { /* keep polling */ }
      }, 15000)
    } catch (err) {
      setVideo({ type: 'none' })
      alert(err instanceof Error ? err.message : 'Failed to generate video')
    }
  }

  // ── Video upload via Vercel Blob ─────────────────────────────────────────────
  async function handleVideoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setVideo({ type: 'uploading', progress: 0 })

    try {
      const blob = await upload(file.name, file, {
        access: 'public',
        handleUploadUrl: `/api/content/upload-video?secret=${encodeURIComponent(secret)}`,
        onUploadProgress: ({ percentage }) => {
          setVideo({ type: 'uploading', progress: Math.round(percentage) })
        },
      })

      setVideo({ type: 'ready', url: blob.url, filename: file.name })
    } catch (err) {
      setVideo({ type: 'none' })
      alert(err instanceof Error ? err.message : 'Video upload failed')
    }

    // Reset input so the same file can be re-selected
    e.target.value = ''
  }

  function handleRemoveVideo() {
    setVideo({ type: 'none' })
  }

  async function handleVideoThumbnailSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingVideoThumb(true)
    try {
      const blob = await upload(file.name, file, {
        access: 'public',
        handleUploadUrl: `/api/content/upload-video?secret=${encodeURIComponent(secret)}`,
      })
      setVideoThumbnailUrl(blob.url)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Thumbnail upload failed')
    } finally {
      setUploadingVideoThumb(false)
      e.target.value = ''
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
    if (thumbnail.type !== 'upload') return

    setPublishState({ phase: 'saving' })

    try {
      const form = new FormData()
      form.append('postId', postId)
      form.append('socialCopy', socialCopy)
      if (videoScript) form.append('videoScript', videoScript)

      const videoUrl = video.type === 'ready' ? video.url :
                       video.type === 'saved' ? video.url : null
      if (videoUrl) form.append('videoUrl', videoUrl)
      if (videoThumbnailUrl) form.append('videoThumbnailUrl', videoThumbnailUrl)

      if (thumbnail.type === 'upload') {
        form.append('image', thumbnail.file)
      }

      const res = await fetch(`/api/content/mark-ready?secret=${encodeURIComponent(secret)}`, {
        method: 'POST',
        body: form,
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to save')

      setThumbnail({ type: 'saved' })
      if (video.type === 'ready') {
        setVideo(prev => prev.type === 'ready' ? { type: 'saved', url: prev.url } : prev)
      }
      setPost(prev => prev ? { ...prev, workflowStatus: 'media_ready' as WorkflowStatus } : prev)
      setPublishState({ phase: 'idle' })
    } catch (err) {
      setPublishState({ phase: 'error', message: err instanceof Error ? err.message : 'Save failed' })
    }
  }

  // ── Poll a single platform ───────────────────────────────────────────────────
  function startPoll(
    platform: 'facebook' | 'youtube' | 'tiktok',
    submissionId: string,
    onUpdate: (status: PlatformStatus) => void,
  ) {
    let attempts = 0
    const interval = setInterval(async () => {
      attempts++
      try {
        const res = await fetch(
          `/api/content/blotato-status?secret=${encodeURIComponent(secret)}&postSubmissionId=${encodeURIComponent(submissionId)}&postId=${encodeURIComponent(postId)}&platform=${platform}`
        )
        const data = await res.json()

        if (data.status === 'published') {
          clearInterval(interval)
          delete pollRefs.current[platform]
          onUpdate({ phase: 'done', postUrl: data.postUrl })
        } else if (data.status === 'failed') {
          clearInterval(interval)
          delete pollRefs.current[platform]
          onUpdate({ phase: 'error', message: data.errorMessage ?? `${platform} publish failed` })
        } else if (attempts >= 30) {
          clearInterval(interval)
          delete pollRefs.current[platform]
          onUpdate({ phase: 'done' })
        }
      } catch { /* keep trying */ }
    }, 10000)

    pollRefs.current[platform] = interval
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

      const initFb: PlatformStatus = data.facebook?.postSubmissionId
        ? { phase: 'polling', submissionId: data.facebook.postSubmissionId }
        : { phase: 'idle' }
      const initYt: PlatformStatus = data.youtube?.postSubmissionId
        ? { phase: 'polling', submissionId: data.youtube.postSubmissionId }
        : { phase: 'idle' }
      const initTt: PlatformStatus = data.tiktok?.postSubmissionId
        ? { phase: 'polling', submissionId: data.tiktok.postSubmissionId }
        : { phase: 'idle' }

      setPublishState({ phase: 'polling', facebook: initFb, youtube: initYt, tiktok: initTt })
      setPost(prev => prev ? { ...prev, workflowStatus: 'published' as WorkflowStatus } : prev)

      // Track resolved statuses so we know when all are done
      const resolved = { facebook: initFb.phase === 'idle', youtube: initYt.phase === 'idle', tiktok: initTt.phase === 'idle' }
      const statuses: Record<string, PlatformStatus> = { facebook: initFb, youtube: initYt, tiktok: initTt }

      function checkAllDone() {
        if (resolved.facebook && resolved.youtube && resolved.tiktok) {
          setPublishState({ phase: 'done', facebook: statuses.facebook, youtube: statuses.youtube, tiktok: statuses.tiktok })
        }
      }

      if (data.facebook?.postSubmissionId) {
        startPoll('facebook', data.facebook.postSubmissionId, (s) => {
          statuses.facebook = s
          resolved.facebook = true
          setPublishState(prev => prev.phase === 'polling' ? { ...prev, facebook: s } : prev)
          checkAllDone()
        })
      } else {
        resolved.facebook = true
      }

      if (data.youtube?.postSubmissionId) {
        startPoll('youtube', data.youtube.postSubmissionId, (s) => {
          statuses.youtube = s
          resolved.youtube = true
          setPublishState(prev => prev.phase === 'polling' ? { ...prev, youtube: s } : prev)
          checkAllDone()
        })
      } else {
        resolved.youtube = true
      }

      if (data.tiktok?.postSubmissionId) {
        startPoll('tiktok', data.tiktok.postSubmissionId, (s) => {
          statuses.tiktok = s
          resolved.tiktok = true
          setPublishState(prev => prev.phase === 'polling' ? { ...prev, tiktok: s } : prev)
          checkAllDone()
        })
      } else {
        resolved.tiktok = true
      }

      checkAllDone()
    } catch (err) {
      setPublishState({ phase: 'error', message: err instanceof Error ? err.message : 'Publish failed' })
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  const thumbnailPreviewUrl =
    thumbnail.type === 'upload' ? thumbnail.previewUrl :
    thumbnail.type === 'saved' && post?.coverImage?.asset
      ? `https://cdn.sanity.io/images/2nr7n3lm/production/${post.coverImage.asset._ref.replace('image-', '').replace(/-(\w+)$/, '.$1')}`
      : null

  const isReady = post?.workflowStatus === 'media_ready'
  const isPublished = post?.workflowStatus === 'published'
  const canMarkReady = thumbnail.type === 'upload'
  const canPublish = (isReady || isPublished === false) && thumbnail.type === 'saved'
  const publishInProgress = ['saving', 'publishing', 'polling'].includes(publishState.phase)
  const hasVideo = video.type === 'ready' || video.type === 'saved' || video.type === 'heygen-generating'

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

        {/* ── LEFT ── */}
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

          {/* Video script */}
          <Card title="Video Script">
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8, gap: 12 }}>
              <p style={{ fontSize: 12, color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
                A short script for Barry to record a video summary of this article — high-level takeaways, what it means for the local market, and a direct call to action.
              </p>
              <button
                onClick={handleGenerateScript}
                disabled={generatingScript}
                style={{
                  flexShrink: 0,
                  padding: '5px 14px', background: '#eff6ff', color: '#1e40af',
                  border: '1px solid #93c5fd', borderRadius: 6, fontSize: 12,
                  fontWeight: 600, cursor: generatingScript ? 'wait' : 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {generatingScript ? 'Writing…' : '🎬 Generate Script'}
              </button>
            </div>
            <textarea
              value={videoScript}
              onChange={e => setVideoScript(e.target.value)}
              placeholder="Video script will appear here after generating…"
              rows={14}
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: 12, border: '1px solid #e2e8f0', borderRadius: 8,
                fontSize: 13, lineHeight: 1.7, resize: 'vertical',
                fontFamily: '"Courier New", Courier, monospace', color: '#1a1a1a',
                background: '#fafafa',
              }}
            />
            <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>
              Tip: Edit before recording. Read naturally — don't rush. Scripts run 30–90 seconds depending on the topic.
            </p>
          </Card>

          {/* Video upload */}
          <Card title="Video Upload (YouTube + TikTok)">
            <p style={{ fontSize: 12, color: '#94a3b8', margin: '0 0 14px', lineHeight: 1.5 }}>
              Optional. If Barry records a video, upload it here — it will be published to YouTube and TikTok alongside the Facebook post. Supports MP4, MOV, or WebM (up to 500 MB).
            </p>

            {video.type === 'none' && (
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                <button
                  onClick={handleGenerateHeyGenVideo}
                  disabled={!videoScript.trim()}
                  title={!videoScript.trim() ? 'Generate a video script first' : undefined}
                  style={{
                    padding: '10px 20px', background: videoScript.trim() ? '#1E3A5F' : '#e2e8f0',
                    color: videoScript.trim() ? '#fff' : '#94a3b8',
                    border: 'none', borderRadius: 8, fontSize: 14,
                    fontWeight: 600, cursor: videoScript.trim() ? 'pointer' : 'not-allowed',
                  }}
                >
                  🤖 Generate with HeyGen
                </button>
                <span style={{ color: '#94a3b8', fontSize: 13 }}>— or —</span>
                <label style={{
                  display: 'inline-block',
                  padding: '10px 20px', background: '#f1f5f9', color: '#475569',
                  border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14,
                  fontWeight: 600, cursor: 'pointer',
                }}>
                  📹 Upload Video
                  <input
                    type="file"
                    accept="video/mp4,video/quicktime,video/webm,video/x-m4v"
                    onChange={handleVideoSelect}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>
            )}

            {video.type === 'heygen-generating' && (
              <div style={{ padding: '14px 16px', background: '#eff6ff', border: '1px solid #93c5fd', borderRadius: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <div style={{ fontSize: 20 }}>🎬</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1e40af' }}>HeyGen is rendering Barry's video</div>
                    <div style={{ fontSize: 12, color: '#3b82f6' }}>{video.message}</div>
                  </div>
                </div>
                <div style={{ height: 4, background: '#bfdbfe', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', width: '100%', background: '#3b82f6', borderRadius: 99,
                    animation: 'pulse 1.5s ease-in-out infinite',
                  }} />
                </div>
                <p style={{ fontSize: 11, color: '#60a5fa', marginTop: 8 }}>
                  Typically takes 2–5 minutes. You can leave this page open and come back.
                </p>
              </div>
            )}

            {video.type === 'uploading' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#475569', marginBottom: 6 }}>
                  <span>Uploading video…</span>
                  <span>{video.progress}%</span>
                </div>
                <div style={{ height: 6, background: '#e2e8f0', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${video.progress}%`, background: '#1E3A5F', borderRadius: 99, transition: 'width 0.3s' }} />
                </div>
              </div>
            )}

            {(video.type === 'ready' || video.type === 'saved') && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8 }}>
                <span style={{ fontSize: 20 }}>🎥</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#166534' }}>
                    {video.type === 'saved' ? 'Video saved' : 'Video ready'}
                  </div>
                  <div style={{ fontSize: 11, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {video.type === 'ready' ? video.filename : video.url.split('/').pop()}
                  </div>
                </div>
                {video.type === 'ready' && (
                  <button
                    onClick={handleRemoveVideo}
                    style={{ fontSize: 12, color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px' }}
                  >
                    Remove
                  </button>
                )}
              </div>
            )}

            {video.type === 'none' && (
              <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 8 }}>
                No video uploaded — only Facebook will be published.
              </p>
            )}

            {/* Video thumbnail (YouTube only — TikTok doesn't support external thumbnails) */}
            {(video.type === 'ready' || video.type === 'saved') && (
              <div style={{ marginTop: 16, borderTop: '1px solid #e2e8f0', paddingTop: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a', display: 'block', marginBottom: 4 }}>
                  YouTube Thumbnail <span style={{ fontWeight: 400, color: '#94a3b8' }}>(optional)</span>
                </label>
                <p style={{ fontSize: 11, color: '#94a3b8', margin: '0 0 10px', lineHeight: 1.5 }}>
                  Custom thumbnail for YouTube. JPG or PNG, 1280×720 recommended. TikTok uses a frame from the video automatically.
                </p>

                {videoThumbnailUrl ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <img
                      src={videoThumbnailUrl}
                      alt="Video thumbnail"
                      style={{ width: 120, height: 68, objectFit: 'cover', borderRadius: 6, border: '1px solid #e2e8f0' }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#166534' }}>✓ Thumbnail ready</div>
                      <label style={{ fontSize: 11, color: '#2563eb', cursor: 'pointer', display: 'block', marginTop: 4 }}>
                        Replace
                        <input type="file" accept="image/*" onChange={handleVideoThumbnailSelect} style={{ display: 'none' }} />
                      </label>
                    </div>
                  </div>
                ) : (
                  <label style={{
                    display: 'inline-block',
                    padding: '8px 16px', background: '#f1f5f9', color: '#475569',
                    border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13,
                    fontWeight: 600, cursor: uploadingVideoThumb ? 'wait' : 'pointer',
                    opacity: uploadingVideoThumb ? 0.7 : 1,
                  }}>
                    {uploadingVideoThumb ? 'Uploading…' : '🖼 Upload YouTube Thumbnail'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleVideoThumbnailSelect}
                      disabled={uploadingVideoThumb}
                      style={{ display: 'none' }}
                    />
                  </label>
                )}
              </div>
            )}
          </Card>

        </div>

        {/* ── RIGHT: Preview + Publish ── */}
        <div style={{ position: 'sticky', top: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Thumbnail */}
          <Card title="Thumbnail">
            <div style={{
              aspectRatio: '16/9', background: '#f1f5f9', borderRadius: 8, overflow: 'hidden',
              display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12,
            }}>
              {thumbnailPreviewUrl ? (
                <img src={thumbnailPreviewUrl} alt="Thumbnail preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ textAlign: 'center', color: '#94a3b8' }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>🖼</div>
                  <div style={{ fontSize: 13 }}>No thumbnail yet</div>
                </div>
              )}
            </div>

            {thumbnail.type === 'saved' ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 12, color: '#166534', fontWeight: 600 }}>✓ Thumbnail saved</span>
                <label style={{ fontSize: 12, color: '#2563eb', cursor: 'pointer', fontWeight: 600 }}>
                  Replace
                  <input type="file" accept="image/*" onChange={handleFileSelect} style={{ display: 'none' }} />
                </label>
              </div>
            ) : (
              <label style={{
                display: 'block', width: '100%', boxSizing: 'border-box', marginBottom: 10,
                padding: '10px 0', textAlign: 'center',
                background: '#f1f5f9', color: '#475569',
                border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14,
                fontWeight: 600, cursor: 'pointer',
              }}>
                📷 Upload Thumbnail
                <input type="file" accept="image/*" onChange={handleFileSelect} style={{ display: 'none' }} />
              </label>
            )}

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
          </Card>

          {/* Publish panel */}
          <Card title="Publish">
            <p style={{ fontSize: 13, color: '#64748b', marginBottom: 12, lineHeight: 1.5 }}>
              Pressing Publish will:
            </p>
            <ul style={{ fontSize: 13, color: '#475569', lineHeight: 1.8, margin: '0 0 16px', paddingLeft: 18 }}>
              <li>Make the post live on the website</li>
              <li>Post to the Legacy Home Team Facebook page</li>
              {hasVideo && <li>Upload the video to YouTube</li>}
              {hasVideo && <li>Post the video to TikTok</li>}
            </ul>

            {/* Per-platform publish status */}
            {(publishState.phase === 'polling' || publishState.phase === 'done') && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                <PlatformStatusRow
                  icon="👥"
                  label="Facebook"
                  status={publishState.facebook}
                />
                {publishState.youtube.phase !== 'idle' && (
                  <PlatformStatusRow
                    icon="▶️"
                    label="YouTube"
                    status={publishState.youtube}
                  />
                )}
                {publishState.tiktok.phase !== 'idle' && (
                  <PlatformStatusRow
                    icon="🎵"
                    label="TikTok"
                    status={publishState.tiktok}
                  />
                )}
              </div>
            )}

            {publishState.phase === 'error' && (
              <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 13, color: '#991b1b' }}>
                {publishState.message}
              </div>
            )}

            {publishState.phase === 'done' && (
              <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 13, color: '#166534' }}>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>✓ Published!</div>
                <a href={`/blog/${post.slug}`} target="_blank" rel="noopener noreferrer" style={{ color: '#166534', display: 'block' }}>
                  View blog post →
                </a>
                {publishState.facebook.phase === 'done' && publishState.facebook.postUrl && (
                  <a href={publishState.facebook.postUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#166534', display: 'block', marginTop: 4 }}>
                    View Facebook post →
                  </a>
                )}
                {publishState.youtube.phase === 'done' && publishState.youtube.postUrl && (
                  <a href={publishState.youtube.postUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#166534', display: 'block', marginTop: 4 }}>
                    View YouTube video →
                  </a>
                )}
                {publishState.tiktok.phase === 'done' && publishState.tiktok.postUrl && (
                  <a href={publishState.tiktok.postUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#166534', display: 'block', marginTop: 4 }}>
                    View TikTok post →
                  </a>
                )}
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

// ── Sub-components ────────────────────────────────────────────────────────────

function PlatformStatusRow({ icon, label, status }: {
  icon: string
  label: string
  status: PlatformStatus
}) {
  const isPolling = status.phase === 'polling'
  const isDone = status.phase === 'done'
  const isError = status.phase === 'error'

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '8px 12px',
      background: isDone ? '#f0fdf4' : isError ? '#fef2f2' : '#eff6ff',
      border: `1px solid ${isDone ? '#86efac' : isError ? '#fca5a5' : '#93c5fd'}`,
      borderRadius: 8, fontSize: 13,
    }}>
      <span>{icon}</span>
      <span style={{ fontWeight: 600, color: isDone ? '#166534' : isError ? '#991b1b' : '#1e40af' }}>
        {label}
      </span>
      <span style={{ marginLeft: 'auto', color: isDone ? '#166534' : isError ? '#991b1b' : '#1e40af' }}>
        {isPolling ? 'Waiting…' : isDone ? '✓ Published' : isError ? `✗ ${status.message}` : ''}
      </span>
    </div>
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
