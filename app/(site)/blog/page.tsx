import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import imageUrlBuilder from '@sanity/image-url'
import { createClient } from '@sanity/client'
import { getBlogPosts, getMarketReports } from '@/sanity/queries'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Hampton Roads Real Estate Blog | Legacy Home Search',
  description:
    'Expert insights on Hampton Roads real estate — market updates, buying tips, community spotlights, and investment analysis from the Legacy Home Search team.',
}

const CATEGORY_LABELS: Record<string, string> = {
  'market-update': 'Market Update',
  'buying-tips': 'Buying Tips',
  'selling-tips': 'Selling Tips',
  'community-spotlight': 'Community Spotlight',
  investment: 'Investment',
  news: 'News',
}

// Tabs in display order — value matches the ?category= param
const CATEGORY_TABS = [
  { value: 'market-report', label: 'Market Reports' },
  { value: 'market-update', label: 'Market Update' },
  { value: 'buying-tips', label: 'Buying Tips' },
  { value: 'selling-tips', label: 'Selling Tips' },
  { value: 'community-spotlight', label: 'Community Spotlight' },
  { value: 'investment', label: 'Investment' },
  { value: 'news', label: 'News' },
]

const sanityClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? '2nr7n3lm',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
})
const builder = imageUrlBuilder(sanityClient)

function urlFor(source: any) {
  return builder.image(source)
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>
}) {
  const { category } = await searchParams

  const [posts, reports] = await Promise.all([
    getBlogPosts(24),
    getMarketReports(12),
  ])

  // Merge into a unified list sorted by date, newest first
  type BlogItem =
    | { kind: 'post'; _id: string; slug: string; title: string; excerpt?: string; coverImage?: any; publishedAt?: string; category?: string; aiGenerated?: boolean }
    | { kind: 'report'; _id: string; slug: string; communityName: string; reportPeriod: string; marketSummary?: string; coverImage?: any; publishedAt?: string; medianListPrice?: string }

  const items: BlogItem[] = [
    ...posts.map((p) => ({ kind: 'post' as const, ...p })),
    ...reports.map((r) => ({ kind: 'report' as const, ...r })),
  ].sort((a, b) => {
    const da = a.publishedAt ? new Date(a.publishedAt).getTime() : 0
    const db = b.publishedAt ? new Date(b.publishedAt).getTime() : 0
    return db - da
  })

  // Compute which tabs actually have content (only show populated tabs)
  const populatedCategories = new Set<string>()
  for (const item of items) {
    if (item.kind === 'report') populatedCategories.add('market-report')
    else if (item.kind === 'post' && item.category) populatedCategories.add(item.category)
  }
  const visibleTabs = CATEGORY_TABS.filter((t) => populatedCategories.has(t.value))

  // Filter by selected category
  const filtered = category
    ? items.filter((item) => {
        if (category === 'market-report') return item.kind === 'report'
        return item.kind === 'post' && item.category === category
      })
    : items

  return (
    <>
      {/* ── HERO ──────────────────────────────────────────────────────── */}
      <section className="blog-hero">
        <div className="container">
          <span className="section-label">Insights &amp; News</span>
          <h1 className="blog-hero-title">Hampton Roads Real Estate Blog</h1>
          <p className="blog-hero-sub">
            Market reports, buying &amp; selling guides, and community insights — from the Legacy Home Search team.
          </p>
        </div>
      </section>

      {/* ── POSTS GRID ────────────────────────────────────────────────── */}
      <section className="blog-listing">
        <div className="container">

          {/* ── CATEGORY FILTER TABS ──────────────────────────────────── */}
          {visibleTabs.length > 0 && (
            <div style={{ marginBottom: 36 }}>
              <div style={{
                display: 'flex',
                gap: 8,
                flexWrap: 'wrap',
                alignItems: 'center',
              }}>
                {/* All tab */}
                <Link
                  href="/blog"
                  style={{
                    display: 'inline-block',
                    padding: '7px 16px',
                    borderRadius: 999,
                    fontSize: 13,
                    fontWeight: 600,
                    textDecoration: 'none',
                    border: '1.5px solid',
                    transition: 'all 0.15s',
                    ...(!category
                      ? { background: '#2563eb', borderColor: '#2563eb', color: '#fff' }
                      : { background: '#fff', borderColor: '#e0ddd8', color: '#555550' }
                    ),
                  }}
                >
                  All
                </Link>

                {visibleTabs.map((tab) => {
                  const isActive = category === tab.value
                  return (
                    <Link
                      key={tab.value}
                      href={`/blog?category=${tab.value}`}
                      style={{
                        display: 'inline-block',
                        padding: '7px 16px',
                        borderRadius: 999,
                        fontSize: 13,
                        fontWeight: 600,
                        textDecoration: 'none',
                        border: '1.5px solid',
                        transition: 'all 0.15s',
                        ...(isActive
                          ? { background: '#2563eb', borderColor: '#2563eb', color: '#fff' }
                          : { background: '#fff', borderColor: '#e0ddd8', color: '#555550' }
                        ),
                      }}
                    >
                      {tab.label}
                    </Link>
                  )
                })}
              </div>
            </div>
          )}

          {filtered.length === 0 ? (
            <div className="blog-empty">
              <p>No posts in this category yet — check back soon.</p>
            </div>
          ) : (
            <div className="blog-grid">
              {filtered.map((item) => {
                if (item.kind === 'report') {
                  const imgUrl = item.coverImage
                    ? urlFor(item.coverImage).width(600).height(340).fit('crop').url()
                    : null
                  return (
                    <Link key={item._id} href={`/market-reports/${item.slug}`} className="blog-card">
                      <div className="blog-card-img">
                        {imgUrl ? (
                          <Image src={imgUrl} alt={`${item.communityName} Market Report`} fill sizes="(max-width: 768px) 100vw, 400px" style={{ objectFit: 'cover' }} />
                        ) : (
                          <div className="blog-card-placeholder" />
                        )}
                      </div>
                      <div className="blog-card-body">
                        <span className="blog-card-category">Market Report</span>
                        <h2 className="blog-card-title">{item.communityName} Real Estate Market Trends Data, {item.reportPeriod}</h2>
                        {item.marketSummary && (
                          <p className="blog-card-excerpt">{item.marketSummary.slice(0, 120)}…</p>
                        )}
                        <div className="blog-card-meta">
                          <span>{item.reportPeriod}</span>
                          {item.medianListPrice && (
                            <span style={{ fontWeight: 600, color: '#2563eb' }}>{item.medianListPrice}</span>
                          )}
                        </div>
                      </div>
                    </Link>
                  )
                }

                const imgUrl = item.coverImage
                  ? urlFor(item.coverImage).width(600).height(340).fit('crop').url()
                  : null
                const pubDate = item.publishedAt
                  ? new Date(item.publishedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                  : ''
                const categoryLabel = CATEGORY_LABELS[item.category ?? ''] ?? item.category

                return (
                  <Link key={item._id} href={`/blog/${item.slug}`} className="blog-card">
                    <div className="blog-card-img">
                      {imgUrl ? (
                        <Image src={imgUrl} alt={item.title} fill sizes="(max-width: 768px) 100vw, 400px" style={{ objectFit: 'cover' }} />
                      ) : (
                        <div className="blog-card-placeholder" />
                      )}
                    </div>
                    <div className="blog-card-body">
                      {categoryLabel && <span className="blog-card-category">{categoryLabel}</span>}
                      <h2 className="blog-card-title">{item.title}</h2>
                      {item.excerpt && <p className="blog-card-excerpt">{item.excerpt}</p>}
                      <div className="blog-card-meta">
                        <span>{pubDate}</span>
                        {item.aiGenerated && <span className="blog-ai-badge">AI</span>}
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
