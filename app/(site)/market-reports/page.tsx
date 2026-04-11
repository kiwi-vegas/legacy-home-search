import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import imageUrlBuilder from '@sanity/image-url'
import { createClient } from '@sanity/client'
import { getMarketReports } from '@/sanity/queries'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Hampton Roads Market Reports | Legacy Home Search',
  description: 'Monthly real estate market reports for Virginia Beach, Chesapeake, Norfolk, Suffolk, Hampton, and Newport News — buyers, sellers, and investors.',
}

const sanityClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? '2nr7n3lm',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production',
  apiVersion: '2024-01-01',
  useCdn: true,
})
const builder = imageUrlBuilder(sanityClient)

const CITIES = ['All', 'Virginia Beach', 'Chesapeake', 'Norfolk', 'Suffolk', 'Hampton', 'Newport News']

export default async function MarketReportsPage() {
  const reports = await getMarketReports(48)

  return (
    <>
      {/* ── HERO ──────────────────────────────────────────────────────── */}
      <section className="blog-hero">
        <div className="container">
          <span className="section-label">Monthly Analysis</span>
          <h1 className="blog-hero-title">Hampton Roads Market Reports</h1>
          <p className="blog-hero-sub">
            Monthly market breakdowns for buyers, sellers, and investors — straight from Barry Jenkins and the Legacy Home Team.
          </p>
        </div>
      </section>

      {/* ── REPORTS GRID ──────────────────────────────────────────────── */}
      <section className="blog-listing">
        <div className="container">
          {reports.length === 0 ? (
            <div className="blog-empty">
              <p>Market reports are published monthly. Check back soon.</p>
            </div>
          ) : (
            <div className="blog-grid">
              {reports.map((report) => {
                const imgUrl = report.coverImage
                  ? builder.image(report.coverImage).width(600).height(340).fit('crop').url()
                  : null
                const pubDate = report.publishedAt
                  ? new Date(report.publishedAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                  : report.reportPeriod

                return (
                  <Link key={report._id} href={`/market-reports/${report.slug}`} className="blog-card">
                    <div className="blog-card-img">
                      {imgUrl ? (
                        <Image src={imgUrl} alt={`${report.communityName} Market Report`} fill sizes="(max-width: 768px) 100vw, 400px" style={{ objectFit: 'cover' }} />
                      ) : (
                        <div className="blog-card-placeholder" />
                      )}
                    </div>
                    <div className="blog-card-body">
                      <span className="blog-card-category">{report.communityName}</span>
                      <h2 className="blog-card-title">{report.communityName} Real Estate Market — {report.reportPeriod}</h2>
                      {report.marketSummary && (
                        <p className="blog-card-excerpt">{report.marketSummary.slice(0, 120)}…</p>
                      )}
                      <div className="blog-card-meta">
                        <span>{pubDate}</span>
                        {report.medianListPrice && (
                          <span style={{ fontWeight: 600, color: '#2563eb' }}>{report.medianListPrice}</span>
                        )}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </section>
    </>
  )
}
