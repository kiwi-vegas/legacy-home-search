'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'

interface ReportDraft {
  _id: string
  communityName: string
  reportPeriod: string
  slug: string
  published: boolean
  medianListPrice: string
  medianPriceChange: string
  daysOnMarket: string
  activeInventory: string
  inventoryChange: string
  priceReductions: string
  marketSummary: string
  buyerSection: string
  sellerSection: string
  investorSection: string
  barrysTake: string
  metaTitle: string
  metaDescription: string
}

export default function MarketReportReviewPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const id = params.id as string
  const secret = searchParams.get('secret') ?? ''

  const [draft, setDraft] = useState<ReportDraft | null>(null)
  const [fields, setFields] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [publishing, setPublishing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [published, setPublished] = useState<{ slug: string; url: string } | null>(null)

  useEffect(() => {
    if (!id || !secret) { setError('Missing id or secret'); setLoading(false); return }
    fetch(`/api/market-reports/draft?id=${id}&secret=${secret}`)
      .then((r) => { if (!r.ok) throw new Error('Draft not found or unauthorized'); return r.json() })
      .then((data) => {
        setDraft(data)
        setFields({
          medianListPrice: data.medianListPrice ?? '',
          medianPriceChange: data.medianPriceChange ?? '',
          daysOnMarket: data.daysOnMarket ?? '',
          activeInventory: data.activeInventory ?? '',
          inventoryChange: data.inventoryChange ?? '',
          priceReductions: data.priceReductions ?? '',
          marketSummary: data.marketSummary ?? '',
          buyerSection: data.buyerSection ?? '',
          sellerSection: data.sellerSection ?? '',
          investorSection: data.investorSection ?? '',
          barrysTake: data.barrysTake ?? '',
          metaTitle: data.metaTitle ?? '',
          metaDescription: data.metaDescription ?? '',
        })
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [id, secret])

  function update(key: string, value: string) {
    setFields((prev) => ({ ...prev, [key]: value }))
  }

  async function handlePublish() {
    setPublishing(true)
    setError(null)
    try {
      const res = await fetch('/api/market-reports/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret, id, fields }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error ?? 'Publish failed')
      setPublished({ slug: data.slug, url: data.url })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setPublishing(false)
    }
  }

  if (loading) return <div style={s.page}><div style={s.container}><div style={s.loading}>Loading draft...</div></div></div>
  if (error) return <div style={s.page}><div style={s.container}><div style={s.errorBox}>{error}</div></div></div>
  if (published) return (
    <div style={s.page}><div style={s.container}>
      <div style={s.successBox}>
        <div style={s.successIcon}>✓</div>
        <h2 style={s.successTitle}>Report Published</h2>
        <p style={{ color: '#888884', margin: '0 0 28px' }}>
          {draft?.communityName} — {draft?.reportPeriod} is now live.
        </p>
        <a href={published.url} target="_blank" rel="noopener noreferrer" style={s.btn}>
          View Live Report →
        </a>
      </div>
    </div></div>
  )

  if (!draft) return null

  return (
    <div style={s.page}>
      <div style={s.container}>

        <div style={s.header}>
          <div style={s.label}>Legacy Home Search · Market Reports</div>
          <h1 style={s.title}>{draft.communityName} — {draft.reportPeriod}</h1>
          <p style={s.sub}>Review and edit each section, then publish. Changes go live within 60 seconds.</p>
        </div>

        {error && <div style={s.errorBox}>{error}</div>}

        {/* Metrics */}
        <div style={s.section}>
          <div style={s.sectionTitle}>At a Glance — Key Metrics</div>
          <div style={s.metricsGrid}>
            {[
              ['medianListPrice', 'Median List Price'],
              ['medianPriceChange', 'Price Change'],
              ['daysOnMarket', 'Days on Market'],
              ['activeInventory', 'Active Inventory'],
              ['inventoryChange', 'Inventory Change'],
              ['priceReductions', 'Price Reductions'],
            ].map(([key, label]) => (
              <div key={key}>
                <div style={s.fieldLabel}>{label}</div>
                <input
                  style={s.input}
                  value={fields[key] ?? ''}
                  onChange={(e) => update(key, e.target.value)}
                  placeholder={`e.g. ${key === 'medianListPrice' ? '$389,000' : key === 'daysOnMarket' ? '18 days' : '—'}`}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Written sections */}
        {[
          { key: 'marketSummary', label: 'Market Overview', accent: '#2563eb' },
          { key: 'buyerSection', label: 'For Buyers', accent: '#2563eb' },
          { key: 'sellerSection', label: 'For Sellers', accent: '#16a34a' },
          { key: 'investorSection', label: 'For Investors', accent: '#d97706' },
          { key: 'barrysTake', label: "Barry's Take", accent: '#7c3aed' },
        ].map(({ key, label, accent }) => (
          <div key={key} style={s.section}>
            <div style={{ ...s.sectionTitle, color: accent }}>{label}</div>
            <textarea
              style={s.textarea}
              value={fields[key] ?? ''}
              onChange={(e) => update(key, e.target.value)}
              rows={5}
            />
          </div>
        ))}

        {/* SEO */}
        <div style={s.section}>
          <div style={s.sectionTitle}>SEO</div>
          <div style={{ marginBottom: 12 }}>
            <div style={s.fieldLabel}>Meta Title (under 60 chars)</div>
            <input style={s.input} value={fields.metaTitle ?? ''} onChange={(e) => update('metaTitle', e.target.value)} />
            <div style={{ fontSize: 11, color: fields.metaTitle?.length > 60 ? '#dc2626' : '#888884', marginTop: 4 }}>
              {fields.metaTitle?.length ?? 0}/60 chars
            </div>
          </div>
          <div>
            <div style={s.fieldLabel}>Meta Description (120–155 chars)</div>
            <textarea style={{ ...s.textarea, minHeight: 64 }} value={fields.metaDescription ?? ''} onChange={(e) => update('metaDescription', e.target.value)} rows={3} />
            <div style={{ fontSize: 11, color: '#888884', marginTop: 4 }}>
              {fields.metaDescription?.length ?? 0} chars
            </div>
          </div>
        </div>

        {/* Publish */}
        <div style={s.footer}>
          <button onClick={handlePublish} disabled={publishing} style={{ ...s.btn, opacity: publishing ? 0.5 : 1, cursor: publishing ? 'not-allowed' : 'pointer' }}>
            {publishing ? 'Publishing...' : 'Publish Live →'}
          </button>
          <p style={{ marginTop: 12, fontSize: 12, color: '#888884' }}>
            The report will be live at /market-reports/{draft.slug} within 60 seconds.
          </p>
        </div>

      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', background: '#f8f7f4', fontFamily: 'Inter,-apple-system,sans-serif', color: '#1a1a1a' },
  container: { maxWidth: 860, margin: '0 auto', padding: '48px 24px' },
  loading: { textAlign: 'center', color: '#888884', padding: '80px 0', fontSize: 16 },
  errorBox: { background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)', color: '#dc2626', padding: '12px 16px', borderRadius: 8, fontSize: 14, marginBottom: 24 },
  header: { marginBottom: 36, paddingBottom: 28, borderBottom: '1px solid #e0ddd8' },
  label: { fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' as const, color: '#2563eb', marginBottom: 8 },
  title: { fontSize: 28, fontWeight: 800, margin: '0 0 8px', letterSpacing: '-0.02em' },
  sub: { fontSize: 14, color: '#888884', margin: 0 },
  section: { marginBottom: 28, padding: 24, background: '#fff', borderRadius: 12, border: '1px solid #e0ddd8' },
  sectionTitle: { fontSize: 13, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' as const, marginBottom: 16, color: '#1a1a1a' },
  metricsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 },
  fieldLabel: { fontSize: 11, fontWeight: 600, color: '#555550', marginBottom: 4, textTransform: 'uppercase' as const, letterSpacing: '0.06em' },
  input: { width: '100%', padding: '8px 12px', border: '1px solid #e0ddd8', borderRadius: 6, fontSize: 14, fontFamily: 'Inter,sans-serif', boxSizing: 'border-box' as const, outline: 'none' },
  textarea: { width: '100%', padding: '10px 12px', border: '1px solid #e0ddd8', borderRadius: 6, fontSize: 14, fontFamily: 'Inter,sans-serif', lineHeight: 1.6, resize: 'vertical' as const, boxSizing: 'border-box' as const, outline: 'none', minHeight: 120 },
  footer: { textAlign: 'center', paddingTop: 24, borderTop: '1px solid #e0ddd8' },
  btn: { display: 'inline-block', background: '#2563eb', color: '#fff', border: 'none', padding: '14px 40px', fontSize: 15, fontWeight: 700, borderRadius: 8, textDecoration: 'none', cursor: 'pointer' },
  successBox: { textAlign: 'center', padding: '80px 0' },
  successIcon: { fontSize: 48, color: '#2563eb', marginBottom: 16 },
  successTitle: { fontSize: 28, fontWeight: 800, margin: '0 0 8px' },
}
