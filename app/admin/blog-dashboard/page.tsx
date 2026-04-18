import { client } from '@/sanity/client'

type Props = { searchParams: Promise<{ secret?: string }> }

interface BlogPost {
  _id: string
  title: string
  slug: { current: string }
  category: string
  publishedAt: string | null
  aiGenerated: boolean
}

const CATEGORY_LABELS: Record<string, string> = {
  'market-update': 'Market Update',
  'buying-tips': 'Buying Tips',
  'selling-tips': 'Selling Tips',
  'community-spotlight': 'Community',
  'investment': 'Investment',
  'news': 'News',
}

const CATEGORY_COLORS: Record<string, string> = {
  'market-update': '#2563eb',
  'buying-tips': '#16a34a',
  'selling-tips': '#9333ea',
  'community-spotlight': '#ea580c',
  'investment': '#0891b2',
  'news': '#64748b',
}

function daysSince(dateStr: string | null): number | null {
  if (!dateStr) return null
  const ms = Date.now() - new Date(dateStr).getTime()
  return Math.floor(ms / (1000 * 60 * 60 * 24))
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function postsPerWeek(posts: BlogPost[]): string {
  const published = posts.filter(p => p.publishedAt)
  if (published.length < 2) return '—'
  const oldest = new Date(published[published.length - 1].publishedAt!).getTime()
  const newest = new Date(published[0].publishedAt!).getTime()
  const weeks = (newest - oldest) / (1000 * 60 * 60 * 24 * 7)
  if (weeks < 0.1) return '—'
  return (published.length / weeks).toFixed(1)
}

export default async function BlogDashboardPage({ searchParams }: Props) {
  const { secret } = await searchParams

  if (secret !== process.env.ADMIN_SECRET) {
    return (
      <div style={s.page}>
        <div style={s.container}>
          <div style={s.errorBox}>
            Unauthorized — add <code>?secret=YOUR_ADMIN_SECRET</code> to the URL.
          </div>
        </div>
      </div>
    )
  }

  const posts: BlogPost[] = await client.fetch(`
    *[_type == "blogPost"] | order(publishedAt desc) {
      _id, title, slug, category, publishedAt, aiGenerated
    }
  `)

  const total = posts.length
  const published = posts.filter(p => p.publishedAt)
  const aiCount = posts.filter(p => p.aiGenerated).length

  const byCat: Record<string, number> = {}
  for (const p of posts) {
    byCat[p.category] = (byCat[p.category] ?? 0) + 1
  }

  const ppw = postsPerWeek(published)
  const reportDate = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

  // Posts in last 90 days
  const cutoff = Date.now() - 90 * 24 * 60 * 60 * 1000
  const recent90 = published.filter(p => new Date(p.publishedAt!).getTime() > cutoff)

  return (
    <div style={s.page}>
      <div style={s.container}>

        {/* ─── HEADER ─── */}
        <div style={s.header}>
          <div style={s.eyebrow}>Legacy Home Search · Barry Jenkins</div>
          <h1 style={s.title}>Blog Effectiveness Dashboard</h1>
          <p style={s.sub}>
            Report generated {reportDate} · Data source: Sanity CMS{gaId ? ' + Google Analytics' : ''} · {total} total posts
          </p>
        </div>

        {/* ─── WHY ─── */}
        <div style={s.prose}>
          <p style={s.whyHeading}>Why we're doing this.</p>
          <p style={s.whyText}>
            The rules for ranking on Google changed more in the last 18 months than in the previous five years combined.
            AI Overviews now answer many queries at the top of the search page before anyone clicks a link.
            Google's algorithm weights real user behavior — how long people stay, whether they bounce back —
            more than keywords or backlinks, and thin content is actively hurting sites that produce too much of it.
            The short version: stop publishing filler, make every post directly answer one question a buyer or seller
            actually types, and prove real local expertise. That's what this dashboard tracks.
          </p>
        </div>

        {/* ─── THIS WEEK'S READ ─── */}
        <div style={s.weekCard}>
          <div style={s.weekLabel}>This week's read · {reportDate}</div>

          <div style={s.weekSection}>
            <div style={s.weekSectionTitle}>Overall blog effectiveness</div>
            <p style={s.weekSectionText}>
              {total === 0
                ? 'No posts published yet. Use the blog pipeline to start publishing.'
                : gaId
                  ? `The blog has ${total} published posts and Google Analytics is now collecting data. Check back next week for traffic metrics — GA typically takes 7–14 days to accumulate meaningful data on new posts.`
                  : `The blog has ${total} published posts across ${Object.keys(byCat).length} categories. Google Analytics was connected on ${reportDate} — traffic metrics will appear here as data accumulates over the coming weeks.`
              }
              {total > 0 && ` Posting frequency: ${ppw} posts/week over the tracked period.`}
            </p>
          </div>

          {total > 0 && (
            <div style={s.weekSection}>
              <div style={s.weekSectionTitle}>Content breakdown</div>
              <p style={s.weekSectionText}>
                {Object.entries(byCat).sort((a, b) => b[1] - a[1]).map(([cat, count]) =>
                  `${CATEGORY_LABELS[cat] ?? cat}: ${count}`
                ).join(' · ')}.
                {aiCount > 0 && ` ${aiCount} posts flagged as AI-generated.`}
                {recent90.length > 0 && ` ${recent90.length} posts published in the last 90 days.`}
              </p>
            </div>
          )}
        </div>

        {/* ─── HEADLINE KPIs ─── */}
        <h2 style={s.sectionTitle}>Headline numbers ({total} posts)</h2>

        <div style={s.kpiGrid}>
          {[
            { label: 'Pageviews per post per day', bench: '0.15 – 0.35', benchLabel: 'Typical real-estate blog' },
            { label: 'Sessions per post per day', bench: '0.12 – 0.30', benchLabel: 'Typical real-estate blog' },
            { label: 'Users per post per day', bench: '0.10 – 0.25', benchLabel: 'Typical real-estate blog' },
            { label: 'Avg engagement time (sec/session)', bench: '30 – 60 sec', benchLabel: 'Typical real-estate blog' },
          ].map((kpi) => (
            <div key={kpi.label} style={s.kpiCard}>
              <div style={s.kpiValue}>—</div>
              <div style={s.kpiLabel}>{kpi.label}</div>
              <div style={s.kpiBench}>
                Typical real-estate blog: <strong>{kpi.bench}</strong>
              </div>
            </div>
          ))}
        </div>

        {/* ─── GA SETUP CALLOUT ─── */}
        {!gaId ? (
          <div style={s.gaWarning}>
            <div style={s.gaWarningTitle}>Google Analytics not connected</div>
            <p style={s.gaWarningText}>
              Add <code style={s.code}>NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX</code> to your Vercel environment
              variables to activate traffic tracking. Once set, all four KPIs above will populate automatically
              as GA accumulates data (typically 7–14 days for meaningful numbers).
            </p>
          </div>
        ) : (
          <div style={s.gaSuccess}>
            <strong>Google Analytics connected</strong> — Measurement ID: <code style={s.code}>{gaId}</code>.
            Traffic metrics will populate as GA accumulates data. This dashboard updates live on each page load.
          </div>
        )}

        {/* ─── BENCHMARK TABLE ─── */}
        <h2 style={s.sectionTitle}>How we compare to a typical real-estate blog</h2>
        <p style={s.metaNote}>
          Industry benchmark ranges drawn from published marketing studies (HubSpot, Databox, SEMrush, SimilarWeb).
          Ranges reflect the middle 50% of mature informational posts on real-estate blogs — not top performers.
        </p>
        <div style={s.tableWrap}>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={{ ...s.th, width: '35%' }}>Metric</th>
                <th style={s.th}>Legacy Home Search</th>
                <th style={s.th}>Typical real-estate blog</th>
                <th style={s.th}>How we stack up</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Pageviews / post / day', '— (GA pending)', '0.15 – 0.35', 'Will update as GA data arrives'],
                ['Avg engagement time', '— (GA pending)', '30 – 60 sec', 'Will update as GA data arrives'],
                ['Organic search share', '— (GA pending)', '55 – 70%', 'Will update as GA data arrives'],
                ['Direct share', '— (GA pending)', '15 – 25%', 'Will update as GA data arrives'],
                ['Sessions / post / day', '— (GA pending)', '0.12 – 0.30', 'Will update as GA data arrives'],
                ['Posts published', String(total), 'varies', total >= 20 ? 'Healthy volume' : total > 0 ? 'Building — keep publishing' : 'No posts yet'],
                ['Posts / week', ppw, '3 – 7', ppw === '—' ? 'Not enough data' : parseFloat(ppw) >= 3 ? 'On target' : 'Below target — increase cadence'],
              ].map(([metric, us, bench, note], i) => (
                <tr key={metric} style={{ background: i % 2 === 0 ? '#fff' : '#fafaf8' }}>
                  <td style={s.td}><strong>{metric}</strong></td>
                  <td style={s.td}>{us}</td>
                  <td style={s.td}>{bench}</td>
                  <td style={{ ...s.td, color: '#64748b', fontSize: 12 }}>{note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ─── CATEGORY BREAKDOWN ─── */}
        <h2 style={s.sectionTitle}>Content breakdown by category</h2>
        <div style={s.catGrid}>
          {Object.entries(byCat).sort((a, b) => b[1] - a[1]).map(([cat, count]) => (
            <div key={cat} style={s.catCard}>
              <div style={{ ...s.catDot, background: CATEGORY_COLORS[cat] ?? '#94a3b8' }} />
              <div>
                <div style={s.catCount}>{count}</div>
                <div style={s.catName}>{CATEGORY_LABELS[cat] ?? cat}</div>
              </div>
            </div>
          ))}
          {Object.keys(byCat).length === 0 && (
            <div style={{ color: '#94a3b8', fontSize: 14 }}>No posts yet.</div>
          )}
        </div>

        {/* ─── CHANNEL TABLE (placeholder) ─── */}
        <h2 style={s.sectionTitle}>Where the traffic comes from</h2>
        {!gaId && (
          <p style={s.metaNote}>
            Connect Google Analytics (see callout above) to see channel data. Once connected, this table will show
            Organic Search, Direct, Social, and Referral breakdowns for all posts.
          </p>
        )}
        <div style={s.tableWrap}>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>Channel</th>
                <th style={s.th}>Pageviews</th>
                <th style={s.th}>Sessions</th>
                <th style={s.th}>% of PV</th>
              </tr>
            </thead>
            <tbody>
              {['Organic Search', 'Direct', 'Organic Social', 'Referral'].map((ch, i) => (
                <tr key={ch} style={{ background: i % 2 === 0 ? '#fff' : '#fafaf8' }}>
                  <td style={s.td}>{ch}</td>
                  <td style={{ ...s.td, color: '#94a3b8' }}>—</td>
                  <td style={{ ...s.td, color: '#94a3b8' }}>—</td>
                  <td style={{ ...s.td, color: '#94a3b8' }}>—</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ─── POST-BY-POST TABLE ─── */}
        <h2 style={s.sectionTitle}>Post-by-post results ({total} posts)</h2>
        <p style={s.metaNote}>
          Traffic metrics show — until Google Analytics data accumulates. Posts are sorted newest-first.
        </p>

        {total === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>
            No posts published yet.
          </div>
        ) : (
          <div style={s.tableWrap}>
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={{ ...s.th, width: '40%' }}>Post</th>
                  <th style={s.th}>Category</th>
                  <th style={s.th}>Published</th>
                  <th style={s.th}>Age (days)</th>
                  <th style={s.th}>PV/day</th>
                  <th style={s.th}>Sess/day</th>
                  <th style={s.th}>Engage (sec)</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post, i) => {
                  const days = daysSince(post.publishedAt)
                  return (
                    <tr key={post._id} style={{ background: i % 2 === 0 ? '#fff' : '#fafaf8' }}>
                      <td style={s.td}>
                        <a
                          href={`/blog/${post.slug?.current}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={s.postLink}
                        >
                          {post.title}
                        </a>
                        {post.aiGenerated && (
                          <span style={s.aiBadge}>AI</span>
                        )}
                      </td>
                      <td style={s.td}>
                        <span style={{
                          ...s.catPill,
                          background: (CATEGORY_COLORS[post.category] ?? '#94a3b8') + '18',
                          color: CATEGORY_COLORS[post.category] ?? '#64748b',
                        }}>
                          {CATEGORY_LABELS[post.category] ?? post.category ?? '—'}
                        </span>
                      </td>
                      <td style={{ ...s.td, fontSize: 12, color: '#64748b', whiteSpace: 'nowrap' }}>
                        {formatDate(post.publishedAt)}
                      </td>
                      <td style={{ ...s.td, fontSize: 12, color: '#64748b', textAlign: 'center' }}>
                        {days !== null ? days : '—'}
                      </td>
                      <td style={{ ...s.td, color: '#94a3b8', textAlign: 'center' }}>—</td>
                      <td style={{ ...s.td, color: '#94a3b8', textAlign: 'center' }}>—</td>
                      <td style={{ ...s.td, color: '#94a3b8', textAlign: 'center' }}>—</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ─── FOOTER NOTE ─── */}
        <div style={s.footerNote}>
          <strong>Benchmark sources:</strong>{' '}
          HubSpot State of Marketing (engagement time by industry),
          Databox Benchmarks (GA4 real-estate cohort),
          SEMrush real-estate industry studies (organic search share),
          SimilarWeb real-estate category data (channel mix).
          Ranges reflect mature informational posts on real-estate blogs; "typical" means the middle 50%
          of sites in those studies, not the top performers.
        </div>

      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: '#f8f7f4',
    fontFamily: 'Inter, -apple-system, sans-serif',
    color: '#1a1a1a',
  },
  container: { maxWidth: 1100, margin: '0 auto', padding: '48px 24px 100px' },
  errorBox: {
    background: 'rgba(220,38,38,0.08)',
    border: '1px solid rgba(220,38,38,0.2)',
    color: '#dc2626',
    padding: '12px 16px',
    borderRadius: 8,
    fontSize: 14,
  },
  header: { marginBottom: 32, paddingBottom: 28, borderBottom: '1px solid #e0ddd8' },
  eyebrow: {
    fontSize: 11, fontWeight: 700, letterSpacing: '0.14em',
    textTransform: 'uppercase' as const, color: '#2563eb', marginBottom: 8,
  },
  title: { fontSize: 32, fontWeight: 800, margin: '0 0 10px', letterSpacing: '-0.025em' },
  sub: { fontSize: 14, color: '#888884', margin: 0, lineHeight: 1.7 },
  prose: { marginBottom: 28 },
  whyHeading: { fontWeight: 700, margin: '0 0 8px', fontSize: 15 },
  whyText: { margin: 0, fontSize: 14, color: '#444', lineHeight: 1.8 },
  weekCard: {
    background: '#fff',
    border: '1px solid #e0ddd8',
    borderRadius: 12,
    padding: '24px 28px',
    marginBottom: 36,
  },
  weekLabel: {
    fontSize: 11, fontWeight: 700, letterSpacing: '0.12em',
    textTransform: 'uppercase' as const, color: '#2563eb', marginBottom: 16,
  },
  weekSection: { marginBottom: 16 },
  weekSectionTitle: { fontWeight: 700, fontSize: 15, marginBottom: 6 },
  weekSectionText: { margin: 0, fontSize: 14, color: '#444', lineHeight: 1.8 },
  sectionTitle: {
    fontSize: 18, fontWeight: 700, margin: '40px 0 12px', letterSpacing: '-0.015em',
  },
  metaNote: { fontSize: 13, color: '#888884', margin: '0 0 14px', lineHeight: 1.7 },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: 16,
    marginBottom: 24,
  },
  kpiCard: {
    background: '#fff',
    border: '1px solid #e0ddd8',
    borderRadius: 12,
    padding: '20px 24px',
  },
  kpiValue: { fontSize: 36, fontWeight: 800, color: '#2563eb', letterSpacing: '-0.03em', marginBottom: 4 },
  kpiLabel: { fontSize: 13, fontWeight: 600, color: '#1a1a1a', marginBottom: 8, lineHeight: 1.4 },
  kpiBench: { fontSize: 12, color: '#888884', lineHeight: 1.5 },
  gaWarning: {
    background: '#fffbeb',
    border: '1px solid #fde68a',
    borderRadius: 10,
    padding: '16px 20px',
    marginBottom: 36,
  },
  gaWarningTitle: { fontWeight: 700, fontSize: 14, color: '#92400e', marginBottom: 6 },
  gaWarningText: { margin: 0, fontSize: 13, color: '#78350f', lineHeight: 1.7 },
  gaSuccess: {
    background: '#f0fdf4',
    border: '1px solid #bbf7d0',
    borderRadius: 10,
    padding: '14px 20px',
    fontSize: 13,
    color: '#15803d',
    marginBottom: 36,
    lineHeight: 1.7,
  },
  code: {
    fontFamily: 'monospace',
    background: 'rgba(0,0,0,0.06)',
    padding: '1px 5px',
    borderRadius: 4,
    fontSize: 12,
  },
  tableWrap: { overflowX: 'auto' as const, marginBottom: 8 },
  table: { width: '100%', borderCollapse: 'collapse' as const, fontSize: 13 },
  th: {
    padding: '10px 14px',
    textAlign: 'left' as const,
    background: '#f0ede8',
    fontWeight: 700,
    fontSize: 12,
    color: '#444',
    borderBottom: '1px solid #e0ddd8',
    whiteSpace: 'nowrap' as const,
  },
  td: {
    padding: '10px 14px',
    borderBottom: '1px solid #f0ede8',
    verticalAlign: 'middle' as const,
    fontSize: 13,
  },
  postLink: {
    color: '#2563eb',
    textDecoration: 'none',
    fontWeight: 500,
    lineHeight: 1.4,
  },
  aiBadge: {
    display: 'inline-block',
    marginLeft: 6,
    fontSize: 10,
    fontWeight: 700,
    background: '#eff6ff',
    color: '#2563eb',
    padding: '1px 5px',
    borderRadius: 4,
    verticalAlign: 'middle',
  },
  catPill: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: 100,
    fontSize: 11,
    fontWeight: 600,
    whiteSpace: 'nowrap' as const,
  },
  catGrid: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: 12,
    marginBottom: 8,
  },
  catCard: {
    background: '#fff',
    border: '1px solid #e0ddd8',
    borderRadius: 10,
    padding: '14px 18px',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    minWidth: 140,
  },
  catDot: { width: 10, height: 10, borderRadius: '50%', flexShrink: 0 },
  catCount: { fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1 },
  catName: { fontSize: 12, color: '#888884', marginTop: 2 },
  footerNote: {
    marginTop: 60,
    paddingTop: 24,
    borderTop: '1px solid #e0ddd8',
    fontSize: 12,
    color: '#aaa9a4',
    lineHeight: 1.8,
  },
}
