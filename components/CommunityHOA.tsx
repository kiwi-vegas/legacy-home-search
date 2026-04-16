export interface HOAFee {
  neighborhood: string
  monthly: string
  highlight?: boolean
}

export interface CommunityHOAProps {
  city: string
  intro: string
  fees: HOAFee[]
  covers: string[]
  note: string
  badge?: string
}

export default function CommunityHOA({ city, intro, fees, covers, note, badge }: CommunityHOAProps) {
  return (
    <section id="hoa" style={{ background: 'var(--off-white)' }}>
      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 56, alignItems: 'start' }} className="hoa-grid">
          {/* Left: fee table */}
          <div>
            <span className="section-label">HOA Fees & Management</span>
            <h2 style={{ marginBottom: 12 }}>HOA Fees in {city}</h2>
            <p style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 28 }}>{intro}</p>

            <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', marginBottom: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 0 }}>
                <div style={{ padding: '10px 20px', background: 'var(--light-gray)', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>
                  Neighborhood / Area
                </div>
                <div style={{ padding: '10px 20px', background: 'var(--light-gray)', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>
                  Monthly Fee
                </div>
                {fees.map((f, i) => (
                  <>
                    <div
                      key={`name-${i}`}
                      style={{
                        padding: '13px 20px',
                        fontSize: 14,
                        color: 'var(--text-secondary)',
                        borderBottom: i < fees.length - 1 ? '1px solid var(--border-light)' : 'none',
                        background: f.highlight ? 'rgba(37,99,235,0.04)' : 'transparent',
                      }}
                    >
                      {f.neighborhood}
                    </div>
                    <div
                      key={`fee-${i}`}
                      style={{
                        padding: '13px 20px',
                        fontSize: 14,
                        fontWeight: 700,
                        color: f.highlight ? 'var(--accent)' : 'var(--text)',
                        borderBottom: i < fees.length - 1 ? '1px solid var(--border-light)' : 'none',
                        background: f.highlight ? 'rgba(37,99,235,0.04)' : 'transparent',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {f.monthly}
                    </div>
                  </>
                ))}
              </div>
            </div>

            {badge && (
              <div style={{ display: 'inline-block', padding: '6px 14px', border: '1.5px solid var(--accent)', borderRadius: 20, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 20 }}>
                {badge}
              </div>
            )}

            <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.7, padding: '14px 16px', background: 'rgba(0,0,0,0.03)', borderRadius: 8, border: '1px solid var(--border-light)' }}>
              {note}
            </p>
          </div>

          {/* Right: what HOA covers */}
          <div>
            <div style={{ background: '#0f1a2e', borderRadius: 'var(--radius-xl)', padding: '32px 36px', color: '#fff' }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: 12 }}>
                What HOA Fees Typically Cover
              </div>
              <h3 style={{ color: '#fff', marginBottom: 24, fontSize: '1.15rem' }}>Common HOA Services in {city}</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {covers.map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#2563eb', marginTop: 7, flexShrink: 0 }} />
                    <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.82)', lineHeight: 1.6 }}>{item}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.12)' }}>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, marginBottom: 16 }}>
                  Have questions about HOA fees for a specific home you&apos;re considering? Barry can help you understand all costs before you make an offer.
                </p>
                <a
                  href="tel:+17578164037"
                  style={{ display: 'inline-block', background: '#2563eb', color: '#fff', fontWeight: 700, fontSize: 14, padding: '11px 22px', borderRadius: 8, textDecoration: 'none' }}
                >
                  Call Barry: (757) 816-4037
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
