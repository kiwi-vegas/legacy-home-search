import type { Metadata } from 'next'
import VirginiaBeachListings from '@/components/VirginiaBeachListings'
import HeroSection from '@/components/HeroSection'
import StatsBar from '@/components/StatsBar'
import AreaCards from '@/components/AreaCards'
import TestimonialsSection from '@/components/TestimonialsSection'
import { client } from '@/sanity/client'

export const metadata: Metadata = {
  title: 'Legacy Home Search | Virginia Beach & Hampton Roads Real Estate',
  description: 'Barry Jenkins and the Legacy Home Team help families buy and sell homes across Virginia Beach, Chesapeake, Norfolk, and all of Hampton Roads. Local expertise, proven results.',
}



export default async function HomePage() {
  const homepageDoc = await client.fetch(
    `*[_type == "homepage" && _id == "homepage"][0]{ trustStats[]{ value, label }, agentBioHeadline, agentBio }`,
    {},
    { next: { revalidate: 60 } }
  )
  const cmsStats: Array<{ value: string; label: string }> | undefined = homepageDoc?.trustStats
  const agentBioHeadline: string = homepageDoc?.agentBioHeadline || 'Helping Families Move Since 2014'
  const agentBio: string[] = homepageDoc?.agentBio?.length
    ? homepageDoc.agentBio
    : [
        'Barry Jenkins built Legacy Home Team on a simple belief: every family deserves an agent who treats their home purchase like it\'s the most important transaction in the world — because it is.',
        'With deep roots in Hampton Roads and a decade of experience navigating the local market, Barry combines data-driven strategy with a personal touch that keeps clients coming back — and referring their friends and family.',
        'Whether you\'re buying your first home, upsizing, downsizing, or relocating to the area, Barry and the Legacy team will be with you every step of the way.',
      ]

  return (
    <>
      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <HeroSection />

      {/* ── STATS ────────────────────────────────────────────────────── */}
      <StatsBar cmsStats={cmsStats} />

      {/* ── MEET BARRY ───────────────────────────────────────────────── */}
      <section>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 80, alignItems: 'start' }}>
            {/* Photo placeholder */}
            <div style={{
              aspectRatio: '4/5',
              background: 'var(--light-gray)',
              borderRadius: 'var(--radius-xl)',
              overflow: 'hidden',
              position: 'relative',
            }}>
              <img
                src="/Barry-AI.jpg"
                alt="Barry Jenkins - Legacy Home Team"
                style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }}
              />
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 100%)',
                padding: '32px 24px 24px',
              }}>
                <div style={{ color: '#fff', fontWeight: 700, fontSize: 20 }}>Barry Jenkins</div>
                <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>Lead Agent · Legacy Home Team</div>
              </div>
            </div>

            <div>
              <span className="section-label">Meet Your Agent</span>
              <h2 style={{ marginBottom: 20 }}>{agentBioHeadline}</h2>
              {agentBio.map((para, i) => (
                <p key={i} style={{ fontSize: 16, marginBottom: i < agentBio.length - 1 ? 16 : 28 }}>
                  {para}
                </p>
              ))}
              <div style={{ display: 'flex', gap: 12 }}>
                <a href="tel:+17578164037" className="btn-primary">Call (757) 816-4037</a>
                <a href="mailto:barry@yourfriendlyagent.net" className="btn-outline">Send an Email</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── ALTOS MARKET TRENDS ─────────────────────────────────────── */}
      <section style={{ background: 'var(--off-white)' }}>
        <div className="container">
          <div className="section-header">
            <span className="section-label">Market Data</span>
            <h2>Virginia Beach Market Trends</h2>
            <p>Live market data updated weekly — so you always know exactly what the Virginia Beach housing market is doing.</p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <iframe
              src="https://altos.re/html/s-html/8d125160-7a8d-4cb3-b0a0-c95d4cde0961?scale=1&marketNarrative=true&houses=true&weeklyChange=true&branding=true&size=large"
              style={{ border: 0, display: 'block', width: 640, maxWidth: '100%', height: 800 }}
              scrolling="auto"
              loading="lazy"
              title="Virginia Beach Market Trends"
            />
          </div>
        </div>
      </section>

      {/* ── VIRGINIA BEACH LISTINGS ──────────────────────────────────── */}
      <VirginiaBeachListings />

      {/* ── AREAS WE SERVE ───────────────────────────────────────────── */}
      <section>
        <div className="container">
          <div className="section-header">
            <span className="section-label">Where We Work</span>
            <h2>Serving All of Hampton Roads</h2>
            <p>From oceanfront Virginia Beach to the quiet streets of Chesapeake — we know every corner of the region.</p>
          </div>
          <AreaCards />
        </div>
      </section>

      {/* ── REVIEWS ──────────────────────────────────────────────────── */}
      <TestimonialsSection />

      {/* ── CONTACT ──────────────────────────────────────────────────── */}
      <section id="contact">
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'start' }}>
            <div>
              <span className="section-label">Get In Touch</span>
              <h2 style={{ marginBottom: 20 }}>Ready to Make Your Move?</h2>
              <p style={{ fontSize: 16, marginBottom: 36 }}>
                Whether you're buying, selling, or just exploring your options — Barry is ready to help. Reach out and expect a personal response within a few hours.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {[
                  { icon: '📞', label: 'Phone', value: '(757) 816-4037', href: 'tel:+17578164037' },
                  { icon: '✉️', label: 'Email', value: 'barry@yourfriendlyagent.net', href: 'mailto:barry@yourfriendlyagent.net' },
                  { icon: '📍', label: 'Office', value: '1545 Crossways Blvd, Suite 250\nChesapeake, VA 23320', href: null },
                ].map(item => (
                  <div key={item.label} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                    <div style={{
                      width: 44, height: 44, background: 'var(--accent-light)',
                      borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: 20, flexShrink: 0,
                    }}>{item.icon}</div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{item.label}</div>
                      {item.href ? (
                        <a href={item.href} style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', textDecoration: 'none' }}>{item.value}</a>
                      ) : (
                        <div style={{ fontSize: 15, color: 'var(--text)', whiteSpace: 'pre-line', lineHeight: 1.6 }}>{item.value}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{
              background: 'var(--off-white)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-xl)',
              padding: '36px 32px',
            }}>
              <h3 style={{ marginBottom: 24 }}>Send Barry a Message</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">First Name</label>
                    <input className="form-input" type="text" placeholder="Jane" />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Last Name</label>
                    <input className="form-input" type="text" placeholder="Smith" />
                  </div>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Email</label>
                  <input className="form-input" type="email" placeholder="jane@example.com" />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Phone</label>
                  <input className="form-input" type="tel" placeholder="(757) 555-0000" />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">I'm looking to…</label>
                  <select className="form-input" style={{ cursor: 'pointer' }}>
                    <option>Buy a home</option>
                    <option>Sell my home</option>
                    <option>Buy and sell</option>
                    <option>Get a home valuation</option>
                    <option>Just exploring</option>
                  </select>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Message</label>
                  <textarea className="form-input" rows={4} placeholder="Tell Barry a bit about what you're looking for…" style={{ resize: 'vertical' }} />
                </div>
                <a href="mailto:barry@yourfriendlyagent.net" className="btn-primary" style={{ justifyContent: 'center' }}>
                  Send Message
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
