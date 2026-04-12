'use client'

import { useState, useEffect, useRef, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

interface FileEntry {
  id: string
  filename: string
  status: 'queued' | 'processing' | 'done' | 'error'
  communityName?: string
  period?: string
  url?: string
  error?: string
}

interface RecentReport {
  _id: string
  communityName: string
  reportPeriod: string
  slug: string
  publishedAt: string | null
  _createdAt: string
  published: boolean
}

function UploadForm() {
  const searchParams = useSearchParams()
  const secret = searchParams.get('secret') ?? ''

  const [dragging, setDragging] = useState(false)
  const [files, setFiles] = useState<FileEntry[]>([])
  const [recentReports, setRecentReports] = useState<RecentReport[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dragCounter = useRef(0)

  const loadRecentReports = useCallback(() => {
    if (!secret) return
    fetch(`/api/market-reports/recent?secret=${secret}`)
      .then((r) => r.ok ? r.json() : [])
      .then((data) => setRecentReports(Array.isArray(data) ? data : []))
      .catch(() => {})
  }, [secret])

  useEffect(() => { loadRecentReports() }, [loadRecentReports])

  async function processFile(entry: FileEntry, file: File) {
    setFiles((prev) => prev.map((f) => f.id === entry.id ? { ...f, status: 'processing' } : f))

    const formData = new FormData()
    formData.append('secret', secret)
    formData.append('pdf', file)

    try {
      const res = await fetch('/api/market-reports/auto-publish', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error ?? data.detail ?? 'Failed')
      setFiles((prev) => prev.map((f) => f.id === entry.id
        ? { ...f, status: 'done', communityName: data.communityName, period: data.period, url: data.url }
        : f
      ))
      loadRecentReports()
    } catch (err) {
      setFiles((prev) => prev.map((f) => f.id === entry.id
        ? { ...f, status: 'error', error: err instanceof Error ? err.message : 'Unknown error' }
        : f
      ))
    }
  }

  function addFiles(newFiles: File[]) {
    const pdfs = newFiles.filter((f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'))
    if (!pdfs.length) return

    const entries: FileEntry[] = pdfs.map((f) => ({
      id: `${f.name}-${Date.now()}-${Math.random()}`,
      filename: f.name,
      status: 'queued',
    }))

    setFiles((prev) => [...entries, ...prev])

    // Start processing all files in parallel immediately
    entries.forEach((entry, i) => processFile(entry, pdfs[i]))
  }

  function handleDragEnter(e: React.DragEvent) {
    e.preventDefault()
    dragCounter.current++
    setDragging(true)
  }
  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault()
    dragCounter.current--
    if (dragCounter.current === 0) setDragging(false)
  }
  function handleDragOver(e: React.DragEvent) { e.preventDefault() }
  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    dragCounter.current = 0
    setDragging(false)
    addFiles(Array.from(e.dataTransfer.files))
  }
  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) addFiles(Array.from(e.target.files))
    e.target.value = ''
  }

  if (!secret) return (
    <div style={s.page}><div style={s.container}>
      <div style={s.errorBox}>Missing ?secret= in URL — use the /upload link.</div>
    </div></div>
  )

  const processing = files.filter((f) => f.status === 'processing' || f.status === 'queued').length
  const done = files.filter((f) => f.status === 'done').length
  const errors = files.filter((f) => f.status === 'error').length

  return (
    <div style={s.page}>
      <div style={s.container}>

        {/* Header */}
        <div style={s.header}>
          <div style={s.label}>Legacy Home Search · Market Reports</div>
          <h1 style={s.title}>Upload Reports</h1>
          <p style={s.sub}>
            Drop one or all six Altos PDFs at once. Each report is read by Claude, written in Barry's voice, and published live automatically — no review needed.
          </p>
        </div>

        {/* Drop zone */}
        <div
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            ...s.dropZone,
            background: dragging ? '#eff6ff' : '#fff',
            borderColor: dragging ? '#2563eb' : '#d1d5db',
            borderWidth: dragging ? 2 : 1.5,
            transform: dragging ? 'scale(1.01)' : 'scale(1)',
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            multiple
            onChange={handleInputChange}
            style={{ display: 'none' }}
          />
          <div style={{ fontSize: 36, marginBottom: 12, opacity: dragging ? 1 : 0.5 }}>
            {dragging ? '📂' : '📄'}
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: dragging ? '#2563eb' : '#1a1a1a', marginBottom: 6 }}>
            {dragging ? 'Drop to upload' : 'Drop PDFs here'}
          </div>
          <div style={{ fontSize: 13, color: '#888884' }}>
            or click to select files · all six cities at once
          </div>
          {processing > 0 && (
            <div style={{ marginTop: 16, fontSize: 13, fontWeight: 600, color: '#2563eb' }}>
              Processing {processing} file{processing !== 1 ? 's' : ''}…
            </div>
          )}
        </div>

        {/* City name hint */}
        <p style={{ fontSize: 12, color: '#aaa9a4', margin: '10px 0 0', lineHeight: 1.6 }}>
          City is detected from the filename. Make sure each PDF filename includes the city name
          (e.g. <em>Virginia_Beach_April_2026.pdf</em>).
        </p>

        {/* Per-file status rows */}
        {files.length > 0 && (
          <div style={{ marginTop: 28 }}>
            {files.map((f) => (
              <div key={f.id} style={s.fileRow}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {f.filename}
                  </div>
                  {f.status === 'queued' && (
                    <div style={{ fontSize: 12, color: '#aaa9a4' }}>Queued…</div>
                  )}
                  {f.status === 'processing' && (
                    <div style={{ fontSize: 12, color: '#2563eb' }}>
                      <span style={s.spinner} /> Reading PDF and writing report…
                    </div>
                  )}
                  {f.status === 'done' && (
                    <div style={{ fontSize: 12, color: '#16a34a' }}>
                      Published — {f.communityName}, {f.period} &nbsp;
                      <a href={f.url} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', textDecoration: 'underline' }}>
                        View →
                      </a>
                    </div>
                  )}
                  {f.status === 'error' && (
                    <div style={{ fontSize: 12, color: '#dc2626' }}>{f.error}</div>
                  )}
                </div>
                <div style={{ flexShrink: 0, marginLeft: 16, fontSize: 18 }}>
                  {f.status === 'queued' && <span style={{ color: '#d1d5db' }}>○</span>}
                  {f.status === 'processing' && <span style={{ color: '#2563eb' }}>⟳</span>}
                  {f.status === 'done' && <span style={{ color: '#16a34a' }}>✓</span>}
                  {f.status === 'error' && <span style={{ color: '#dc2626' }}>✕</span>}
                </div>
              </div>
            ))}

            {/* Summary bar when all done */}
            {processing === 0 && files.length > 0 && (
              <div style={{ marginTop: 16, padding: '12px 16px', borderRadius: 8, background: errors === 0 ? '#f0fdf4' : '#fff7ed', border: `1px solid ${errors === 0 ? '#bbf7d0' : '#fed7aa'}`, fontSize: 13, color: errors === 0 ? '#15803d' : '#92400e', fontWeight: 600 }}>
                {errors === 0
                  ? `All ${done} report${done !== 1 ? 's' : ''} published successfully.`
                  : `${done} published, ${errors} failed — check errors above.`
                }
              </div>
            )}
          </div>
        )}

        {/* Recent reports */}
        {recentReports.length > 0 && (
          <div style={{ marginTop: 48, paddingTop: 32, borderTop: '1px solid #e0ddd8' }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: '#888884', marginBottom: 16 }}>
              Recent Reports
            </div>
            <div>
              {recentReports.map((r, i) => {
                const dateStr = (r.publishedAt ?? r._createdAt)
                  ? new Date(r.publishedAt ?? r._createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                  : '—'
                const title = `${r.communityName} Real Estate Market Trends Data, ${r.reportPeriod}`
                const isLast = i === recentReports.length - 1
                return (
                  <div key={r._id} style={{ display: 'flex', alignItems: 'baseline', gap: 16, padding: '11px 0', borderBottom: isLast ? 'none' : '1px solid #f0ede8' }}>
                    <span style={{ fontSize: 12, color: '#aaa9a4', whiteSpace: 'nowrap' as const, minWidth: 96 }}>
                      {dateStr}
                    </span>
                    {r.published && r.slug ? (
                      <a href={`/market-reports/${r.slug}`} target="_blank" rel="noopener noreferrer"
                        style={{ fontSize: 14, color: '#2563eb', textDecoration: 'none', fontWeight: 500 }}>
                        {title}
                      </a>
                    ) : (
                      <span style={{ fontSize: 14, color: '#888884' }}>
                        {title}
                        <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 700, background: '#fef9c3', color: '#92400e', padding: '2px 6px', borderRadius: 4 }}>
                          Draft
                        </span>
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

export default function UploadMarketReportPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#f8f7f4' }} />}>
      <UploadForm />
    </Suspense>
  )
}

const s: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', background: '#f8f7f4', fontFamily: 'Inter,-apple-system,sans-serif', color: '#1a1a1a' },
  container: { maxWidth: 640, margin: '0 auto', padding: '48px 24px 80px' },
  errorBox: { background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)', color: '#dc2626', padding: '12px 16px', borderRadius: 8, fontSize: 14 },
  header: { marginBottom: 28, paddingBottom: 24, borderBottom: '1px solid #e0ddd8' },
  label: { fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' as const, color: '#2563eb', marginBottom: 8 },
  title: { fontSize: 28, fontWeight: 800, margin: '0 0 8px', letterSpacing: '-0.02em' },
  sub: { fontSize: 14, color: '#888884', margin: 0, lineHeight: 1.7 },
  dropZone: {
    marginTop: 24,
    padding: '40px 24px',
    borderStyle: 'dashed',
    borderRadius: 14,
    textAlign: 'center' as const,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    userSelect: 'none' as const,
  },
  fileRow: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 16px',
    background: '#fff',
    borderRadius: 10,
    border: '1px solid #e0ddd8',
    marginBottom: 8,
  },
  spinner: {
    display: 'inline-block',
    width: 10,
    height: 10,
    border: '2px solid #bfdbfe',
    borderTopColor: '#2563eb',
    borderRadius: '50%',
    animation: 'spin 0.7s linear infinite',
    marginRight: 6,
    verticalAlign: 'middle',
  },
}
