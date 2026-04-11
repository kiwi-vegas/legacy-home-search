'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

const COMMUNITIES = [
  { slug: 'virginia-beach', name: 'Virginia Beach' },
  { slug: 'chesapeake', name: 'Chesapeake' },
  { slug: 'norfolk', name: 'Norfolk' },
  { slug: 'suffolk', name: 'Suffolk' },
  { slug: 'hampton', name: 'Hampton' },
  { slug: 'newport-news', name: 'Newport News' },
]

function UploadForm() {
  const searchParams = useSearchParams()
  const secret = searchParams.get('secret') ?? ''

  const [community, setCommunity] = useState('virginia-beach')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ reviewUrl: string; community: string; period: string } | null>(null)

  if (!secret) {
    return (
      <div style={s.page}><div style={s.container}>
        <div style={s.errorBox}>Missing ?secret= in URL</div>
      </div></div>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file) { setError('Please select a PDF file'); return }
    setLoading(true)
    setError(null)

    const formData = new FormData()
    formData.append('secret', secret)
    formData.append('community', community)
    formData.append('pdf', file)

    try {
      const res = await fetch('/api/market-reports/generate-from-pdf', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error ?? data.detail ?? 'Generation failed')
      setResult({ reviewUrl: data.reviewUrl, community: data.community, period: data.period })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  if (result) {
    return (
      <div style={s.page}><div style={s.container}>
        <div style={s.successBox}>
          <div style={s.successIcon}>✓</div>
          <h2 style={s.successTitle}>Report Generated</h2>
          <p style={{ color: '#888884', margin: '0 0 28px' }}>
            {COMMUNITIES.find(c => c.slug === result.community)?.name} — {result.period}
          </p>
          <a href={result.reviewUrl} style={s.btn}>Review & Publish →</a>
          <div style={{ marginTop: 20 }}>
            <button onClick={() => { setResult(null); setFile(null) }} style={{ background: 'none', border: 'none', color: '#888884', fontSize: 13, cursor: 'pointer', textDecoration: 'underline' }}>
              Upload another report
            </button>
          </div>
        </div>
      </div></div>
    )
  }

  return (
    <div style={s.page}>
      <div style={s.container}>
        <div style={s.header}>
          <div style={s.label}>Legacy Home Search · Market Reports</div>
          <h1 style={s.title}>Generate Market Report</h1>
          <p style={s.sub}>
            Download your Altos Research PDF, upload it here. Claude reads the data and writes the full report in Barry's voice — ready to review and publish in about 90 seconds.
          </p>
        </div>

        {error && <div style={s.errorBox}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={s.section}>
            <div style={s.sectionTitle}>City</div>
            <select
              style={s.select}
              value={community}
              onChange={e => setCommunity(e.target.value)}
              disabled={loading}
            >
              {COMMUNITIES.map(c => (
                <option key={c.slug} value={c.slug}>{c.name}</option>
              ))}
            </select>
          </div>

          <div style={s.section}>
            <div style={s.sectionTitle}>Altos Research PDF</div>
            <p style={{ fontSize: 13, color: '#888884', marginBottom: 16, lineHeight: 1.6 }}>
              In Altos, click the button to view your Virginia Beach report, then use the print or download option to save it as a PDF. Upload that file here.
            </p>
            <label style={s.fileLabel}>
              <input
                type="file"
                accept=".pdf,application/pdf"
                onChange={e => setFile(e.target.files?.[0] ?? null)}
                disabled={loading}
                style={{ display: 'none' }}
              />
              <span style={s.fileBtn}>
                {file ? `✓ ${file.name}` : 'Choose PDF file'}
              </span>
            </label>
            {file && (
              <div style={{ marginTop: 8, fontSize: 12, color: '#888884' }}>
                {(file.size / 1024).toFixed(0)} KB
              </div>
            )}
          </div>

          <div style={s.footer}>
            <button
              type="submit"
              disabled={loading || !file}
              style={{ ...s.btn, opacity: loading || !file ? 0.5 : 1, cursor: loading || !file ? 'not-allowed' : 'pointer', border: 'none' }}
            >
              {loading ? 'Generating...' : 'Generate Report →'}
            </button>
            {loading && (
              <div style={{ marginTop: 16 }}>
                <p style={{ fontSize: 13, color: '#888884', margin: '0 0 8px' }}>
                  Claude is reading the Altos data and writing the report. Usually takes 60–90 seconds.
                </p>
                <div style={s.progressBar}>
                  <div style={s.progressFill} />
                </div>
              </div>
            )}
          </div>
        </form>
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
  container: { maxWidth: 640, margin: '0 auto', padding: '48px 24px' },
  errorBox: { background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)', color: '#dc2626', padding: '12px 16px', borderRadius: 8, fontSize: 14, marginBottom: 24 },
  header: { marginBottom: 36, paddingBottom: 28, borderBottom: '1px solid #e0ddd8' },
  label: { fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' as const, color: '#2563eb', marginBottom: 8 },
  title: { fontSize: 28, fontWeight: 800, margin: '0 0 8px', letterSpacing: '-0.02em' },
  sub: { fontSize: 14, color: '#888884', margin: 0, lineHeight: 1.7 },
  section: { marginBottom: 20, padding: '20px 24px', background: '#fff', borderRadius: 12, border: '1px solid #e0ddd8' },
  sectionTitle: { fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginBottom: 12, color: '#1a1a1a' },
  select: { width: '100%', padding: '10px 12px', border: '1px solid #e0ddd8', borderRadius: 6, fontSize: 15, fontFamily: 'Inter,sans-serif', background: '#fff', outline: 'none', cursor: 'pointer' },
  fileLabel: { display: 'block', cursor: 'pointer' },
  fileBtn: { display: 'inline-block', padding: '10px 20px', background: '#f0f4ff', border: '1.5px dashed #93c5fd', borderRadius: 8, fontSize: 14, fontWeight: 600, color: '#2563eb', cursor: 'pointer' },
  footer: { textAlign: 'center' as const, paddingTop: 24, borderTop: '1px solid #e0ddd8' },
  btn: { display: 'inline-block', background: '#2563eb', color: '#fff', padding: '14px 40px', fontSize: 15, fontWeight: 700, borderRadius: 8, textDecoration: 'none', cursor: 'pointer' },
  successBox: { textAlign: 'center' as const, padding: '80px 0' },
  successIcon: { fontSize: 48, color: '#2563eb', marginBottom: 16 },
  successTitle: { fontSize: 28, fontWeight: 800, margin: '0 0 8px' },
  progressBar: { height: 3, background: '#e0ddd8', borderRadius: 2, overflow: 'hidden', maxWidth: 300, margin: '0 auto' },
  progressFill: { height: '100%', width: '60%', background: '#2563eb', borderRadius: 2, animation: 'pulse 1.5s ease-in-out infinite' },
}
