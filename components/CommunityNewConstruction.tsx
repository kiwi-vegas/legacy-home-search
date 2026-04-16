export interface Builder {
  name: string
  communities: string
  sqftRange: string
  startingPrice: string
  desc: string
  searchUrl: string
}

export interface CommunityNewConstructionProps {
  city: string
  subtitle?: string
  builders: Builder[]
  limitedNote?: string
}

export default function CommunityNewConstruction({ city, subtitle, builders, limitedNote }: CommunityNewConstructionProps) {
  return (
    <section id="new-construction">
      <div className="container">
        <div className="section-header">
          <span className="section-label">New Construction</span>
          <h2>New Construction in {city}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>

        {limitedNote && (
          <div style={{ background: 'rgba(37,99,235,0.06)', border: '1px solid rgba(37,99,235,0.15)', borderRadius: 'var(--radius-lg)', padding: '16px 24px', marginBottom: 36, fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            <strong style={{ color: 'var(--accent)' }}>Note: </strong>{limitedNote}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
          {builders.map(b => (
            <div
              key={b.name}
              style={{
                background: 'var(--white)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-xl)',
                padding: '28px 28px 24px',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.01em', marginBottom: 6 }}>
                {b.name}
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 14 }}>
                {b.communities}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>
                {b.sqftRange}
              </div>
              <div style={{ display: 'inline-block', alignSelf: 'flex-start', padding: '5px 14px', border: '1.5px solid var(--border)', borderRadius: 20, fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 16 }}>
                {b.startingPrice}
              </div>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, flex: 1, marginBottom: 20 }}>
                {b.desc}
              </p>
              <a
                href={b.searchUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}
              >
                View Listings →
              </a>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 40, background: 'var(--off-white)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: '28px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 17, color: 'var(--text)', marginBottom: 6 }}>
              Buying New Construction? Bring Your Own Agent.
            </div>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: 0, maxWidth: 560, lineHeight: 1.7 }}>
              Builder sales reps represent the builder — not you. Barry represents buyers in new construction at no additional cost, and knows how to negotiate upgrades, lot premiums, and closing costs on your behalf.
            </p>
          </div>
          <a href="tel:+17578164037" className="btn-primary" style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>
            Call (757) 816-4037
          </a>
        </div>
      </div>
    </section>
  )
}
