import Link from 'next/link'

export interface NearbyArea {
  name: string
  slug?: string        // internal slug → links to /{slug}; omit for non-Barry communities
  startingPrice: string
  why: string
}

export interface CommunityComparisonsProps {
  city: string
  subtitle: string
  nearby: NearbyArea[]
}

export default function CommunityComparisons({ city, subtitle, nearby }: CommunityComparisonsProps) {
  return (
    <section id="comparisons" style={{ background: '#0d1b2a' }}>
      <div className="container">
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)' }}>
            Comparisons
          </span>
          <h2 style={{ color: '#fff', marginTop: 10, marginBottom: 10 }}>Nearby Communities to Consider</h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 16, marginBottom: 40 }}>{subtitle}</p>

          <div style={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--radius-xl)', overflow: 'hidden' }}>
            {/* Header row */}
            <div style={{ display: 'grid', gridTemplateColumns: '180px 150px 1fr 40px', gap: 0, background: 'rgba(37,99,235,0.2)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              {['Community', 'Starting Price', 'Why Consider', ''].map((h, i) => (
                <div key={i} style={{ padding: '13px 20px', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)' }}>
                  {h}
                </div>
              ))}
            </div>

            {/* Data rows */}
            {nearby.map((area, i) => {
              const rowContent = (
                <>
                  <div style={{ padding: '20px 20px', fontSize: 15, fontWeight: 600, color: '#fff', borderBottom: i < nearby.length - 1 ? '1px solid rgba(255,255,255,0.07)' : 'none' }}>
                    {area.name}
                  </div>
                  <div style={{ padding: '20px 20px', fontSize: 15, fontWeight: 700, color: '#93c5fd', borderBottom: i < nearby.length - 1 ? '1px solid rgba(255,255,255,0.07)' : 'none' }}>
                    {area.startingPrice}
                  </div>
                  <div style={{ padding: '20px 20px', fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, borderBottom: i < nearby.length - 1 ? '1px solid rgba(255,255,255,0.07)' : 'none' }}>
                    {area.why}
                  </div>
                  <div style={{ padding: '20px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: i < nearby.length - 1 ? '1px solid rgba(255,255,255,0.07)' : 'none' }}>
                    {area.slug && (
                      <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 18 }}>→</span>
                    )}
                  </div>
                </>
              )

              if (area.slug) {
                return (
                  <Link
                    key={area.name}
                    href={`/${area.slug}`}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '180px 150px 1fr 40px',
                      textDecoration: 'none',
                      transition: 'background 0.15s',
                    }}
                    className="comparison-row"
                  >
                    {rowContent}
                  </Link>
                )
              }

              return (
                <div
                  key={area.name}
                  style={{ display: 'grid', gridTemplateColumns: '180px 150px 1fr 40px' }}
                >
                  {rowContent}
                </div>
              )
            })}
          </div>

          <p style={{ marginTop: 24, fontSize: 13, color: 'rgba(255,255,255,0.35)', textAlign: 'center' }}>
            Not sure which community is right for you? Barry knows every Hampton Roads market — call{' '}
            <a href="tel:+17578164037" style={{ color: 'rgba(255,255,255,0.55)', textDecoration: 'none' }}>(757) 816-4037</a>{' '}
            for a straight answer.
          </p>
        </div>
      </div>
    </section>
  )
}
