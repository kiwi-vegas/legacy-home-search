import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import imageUrlBuilder from '@sanity/image-url'
import { createClient } from '@sanity/client'
import { getMarketReport, getMarketReports } from '@/sanity/queries'

const ALTOS_EMBEDS: Record<string, string> = {
  'virginia-beach': '8d125160-7a8d-4cb3-b0a0-c95d4cde0961',
  chesapeake: 'd0698a30-2b4f-41d2-be37-018147dd9d8c',
  norfolk: '830a2b1d-dd67-4da4-a660-c7ada1ac2ba0',
  hampton: '6b44c4c3-b3d7-4545-b13b-8684f644895a',
  'newport-news': 'ec050d5c-5c80-45ae-820e-9212a2963ad5',
  suffolk: '7ca30f29-6763-4266-85e3-9c4292b1c25c',
}

const sanityClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? '2nr7n3lm',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production',
  apiVersion: '2024-01-01',
  useCdn: true,
})
const builder = imageUrlBuilder(sanityClient)

export async function generateStaticParams() {
  const reports = await getMarketReports(100)
  return reports.map((r) => ({ slug: r.slug }))
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params
  const report = await getMarketReport(slug)
  if (!report) return { title: 'Report Not Found' }
  return {
    title: report.metaTitle ?? `${report.communityName} Real Estate Market Trends Data, ${report.reportPeriod}`,
    description: report.metaDescription ?? report.marketSummary,
  }
}

export default async function MarketReportPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const report = await getMarketReport(slug)
  if (!report) notFound()

  const imgUrl = report.coverImage
    ? builder.image(report.coverImage).width(1200).height(630).fit('crop').url()
    : null

  const pubDate = report.publishedAt
    ? new Date(report.publishedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : report.reportPeriod

  const altosId = ALTOS_EMBEDS[report.community]

  const metrics = [
    { label: 'Median List Price', value: report.medianListPrice },
    { label: 'Price Change', value: report.medianPriceChange },
    { label: 'Days on Market', value: report.daysOnMarket },
    { label: 'Active Listings', value: report.activeInventory },
    { label: 'Inventory Change', value: report.inventoryChange },
    { label: 'Price Reductions', value: report.priceReductions },
  ].filter((m) => m.value)

  return (
    <article>

      {/* ── HERO ──────────────────────────────────────────────────────── */}
      {imgUrl && (
        <div className="blog-post-hero">
          <Image src={imgUrl} alt={`${report.communityName} Market Report`} fill priority sizes="100vw" style={{ objectFit: 'cover' }} />
          <div className="blog-post-hero-overlay" />
        </div>
      )}

      <div className="container">
        <div className="blog-post-header">
          <span className="blog-card-category">{report.communityName}</span>
          <h1 className="blog-post-title">{report.communityName} Real Estate Market Report — {report.reportPeriod}</h1>
          <div className="blog-post-meta">
            <span>Barry Jenkins · Legacy Home Team</span>
            <span className="blog-post-sep">·</span>
            <span>{pubDate}</span>
          </div>
          {report.marketSummary && <p className="blog-post-excerpt">{report.marketSummary}</p>}
        </div>

        {/* ── BARRY'S TAKE ──────────────────────────────────────────────── */}
        {report.barrysTake && (
          <div style={{ padding: '32px', background: '#1a1a1a', borderRadius: 16, marginBottom: 40, display: 'flex', gap: 28, alignItems: 'flex-start' }}>
            <img
              src="/Barry-AI.jpg"
              alt="Barry Jenkins"
              style={{ width: 96, height: 96, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '3px solid rgba(255,255,255,0.2)' }}
            />
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#2563eb', marginBottom: 10 }}>Barry's Take</div>
              <p style={{ fontSize: 16, lineHeight: 1.75, color: 'rgba(255,255,255,0.9)', margin: 0, fontStyle: 'italic' }}>"{report.barrysTake}"</p>
              <div style={{ marginTop: 16, fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>Barry Jenkins · Lead Agent, Legacy Home Team</div>
            </div>
          </div>
        )}

        {/* ── AT A GLANCE ───────────────────────────────────────────────── */}
        {metrics.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12, margin: '0 0 40px' }}>
            {metrics.map((m) => (
              <div key={m.label} style={{ padding: '16px 18px', background: '#f0f4ff', border: '1px solid rgba(37,99,235,0.15)', borderRadius: 10, textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#2563eb', marginBottom: 4 }}>{m.value}</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#555550', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{m.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* ── AUDIENCE SECTIONS ─────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28, marginBottom: 48 }}>

          {report.buyerSection && (
            <div style={{ padding: '28px 32px', background: '#f0f4ff', borderLeft: '4px solid #2563eb', borderRadius: '0 10px 10px 0' }}>
              <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#2563eb', marginBottom: 12 }}>For Buyers</div>
              <p style={{ fontSize: 16, lineHeight: 1.7, margin: 0, color: '#1a1a1a' }}>{report.buyerSection}</p>
            </div>
          )}

          {report.sellerSection && (
            <div style={{ padding: '28px 32px', background: '#f0fdf4', borderLeft: '4px solid #16a34a', borderRadius: '0 10px 10px 0' }}>
              <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#16a34a', marginBottom: 12 }}>For Sellers</div>
              <p style={{ fontSize: 16, lineHeight: 1.7, margin: 0, color: '#1a1a1a' }}>{report.sellerSection}</p>
            </div>
          )}

          {report.investorSection && (
            <div style={{ padding: '28px 32px', background: '#fffbeb', borderLeft: '4px solid #d97706', borderRadius: '0 10px 10px 0' }}>
              <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#d97706', marginBottom: 12 }}>For Investors</div>
              <p style={{ fontSize: 16, lineHeight: 1.7, margin: 0, color: '#1a1a1a' }}>{report.investorSection}</p>
            </div>
          )}

        </div>

        {/* ── LIVE ALTOS DATA ────────────────────────────────────────────── */}
        {altosId && (
          <div style={{ marginBottom: 48 }}>
            <div style={{ marginBottom: 20 }}>
              <span className="section-label">Live Market Data</span>
              <h2 style={{ marginTop: 8, marginBottom: 8 }}>Current {report.communityName} Stats</h2>
              <p style={{ color: '#555550', fontSize: 15 }}>Live data from Altos Research — updated weekly.</p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <iframe
                src={`https://altos.re/html/s-html/${altosId}?scale=1&marketNarrative=true&houses=true&weeklyChange=true&branding=true&size=large`}
                style={{ border: 0, display: 'block', width: 640, maxWidth: '100%', height: 800 }}
                scrolling="auto"
                loading="lazy"
                title={`${report.communityName} Market Trends`}
              />
            </div>
          </div>
        )}

        {/* ── CTA ───────────────────────────────────────────────────────── */}
        <div style={{ padding: '36px', background: 'var(--accent)', borderRadius: 16, textAlign: 'center', marginBottom: 48 }}>
          <h2 style={{ color: '#fff', marginBottom: 12 }}>Ready to Make Your Move?</h2>
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 16, margin: '0 0 28px' }}>
            Barry Jenkins has 20+ years in the {report.communityName} market. Talk to him directly — no pressure, just straight answers.
          </p>
          <a href="tel:+17578164037" style={{ display: 'inline-block', background: '#fff', color: '#2563eb', fontWeight: 700, fontSize: 15, padding: '14px 32px', borderRadius: 8, textDecoration: 'none' }}>
            Call (757) 816-4037
          </a>
        </div>

        {/* ── BACK LINK ─────────────────────────────────────────────────── */}
        <div className="blog-post-footer">
          <a href="/market-reports" className="btn-outline">← All Market Reports</a>
        </div>

      </div>
    </article>
  )
}
