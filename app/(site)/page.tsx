import type { Metadata } from 'next'
import VirginiaBeachListings from '@/components/VirginiaBeachListings'

export const metadata: Metadata = {
  title: 'Legacy Home Search | Virginia Beach & Hampton Roads Real Estate',
  description: 'Barry Jenkins and the Legacy Home Team help families buy and sell homes across Virginia Beach, Chesapeake, Norfolk, and all of Hampton Roads. Local expertise, proven results.',
}

const reviews = [
  {
    text: "Barry and his team made buying our first home in Virginia Beach an amazing experience. They were patient, knowledgeable, and fought hard to get us the best deal. We couldn't be happier.",
    author: 'Jessica & Mark T.',
    location: 'Virginia Beach, VA',
  },
  {
    text: "Sold our Chesapeake home in 9 days at over asking price. The Legacy team's market knowledge and marketing strategy were second to none. Highly recommend.",
    author: 'David R.',
    location: 'Chesapeake, VA',
  },
  {
    text: "From our first call to closing, Barry was responsive, honest, and truly had our best interests at heart. This is the team you want in Hampton Roads.",
    author: 'Samantha L.',
    location: 'Norfolk, VA',
  },
]

const areas = [
  { name: 'Virginia Beach', desc: 'Oceanfront condos to suburban family homes — we know every pocket of VB.' },
  { name: 'Chesapeake', desc: 'Top-rated schools, new construction, and established neighborhoods.' },
  { name: 'Norfolk', desc: 'Urban living, historic charm, and a thriving waterfront community.' },
  { name: 'Suffolk', desc: 'Room to grow with country estates and fast-growing master-planned communities.' },
  { name: 'Hampton', desc: 'Waterfront access, military-friendly, and historically rich neighborhoods.' },
  { name: 'Newport News', desc: 'Diverse housing stock with strong value and easy access to the Peninsula.' },
]

export default function HomePage() {
  return (
    <>
      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section className="hero" style={{ minHeight: 700 }}>
        {/* Vimeo background video */}
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', zIndex: 0 }}>
          <iframe
            src="https://player.vimeo.com/video/1175999385?background=1&autoplay=1&loop=1&byline=0&title=0&muted=1"
            style={{
              position: 'absolute',
              top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              minWidth: '100%', minHeight: '100%',
              width: '177.78vh', height: '56.25vw',
              border: 'none', pointerEvents: 'none',
            }}
            allow="autoplay; fullscreen"
            title="Hero background video"
          />
          {/* Dark overlay for text readability */}
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)' }} />
        </div>
        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>
            <div className="hero-content" style={{ maxWidth: '100%' }}>
              <div className="hero-eyebrow" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', backdropFilter: 'blur(8px)' }}>Virginia Beach &amp; Hampton Roads</div>
              <h1 style={{ color: '#fff' }}>
                Your Home.<br />
                <span style={{ color: '#fff', opacity: 0.85 }}>Your Legacy.</span>
              </h1>
              <p className="hero-sub" style={{ color: 'rgba(255,255,255,0.85)' }}>
                Barry Jenkins and the Legacy Home Team have helped hundreds of Hampton Roads families buy and sell with confidence. Local expertise, honest guidance, and results you can count on.
              </p>
              <div className="hero-actions">
                <a href="https://legacyhomesearch.com/search" className="btn-primary" target="_blank" rel="noopener noreferrer">
                  Search Homes
                </a>
                <a href="#contact" className="btn-outline" style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)' }}>
                  Talk to Barry
                </a>
              </div>
            </div>

            {/* Contact Card */}
            <div style={{
              background: 'var(--white)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-xl)',
              padding: '36px 32px',
              boxShadow: 'var(--shadow-lg)',
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 20 }}>
                Get a Free Home Valuation
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
                <input className="form-input" type="text" placeholder="Your Name" />
                <input className="form-input" type="email" placeholder="Email Address" />
                <input className="form-input" type="tel" placeholder="Phone Number" />
                <input className="form-input" type="text" placeholder="Property Address" />
              </div>
              <a href="mailto:barry@yourfriendlyagent.net" className="btn-primary" style={{ width: '100%', justifyContent: 'center', fontSize: 15 }}>
                Request My Free Valuation
              </a>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 12, textAlign: 'center', lineHeight: 1.5 }}>
                No obligation. Barry will personally review your home and reach out within 24 hours.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ────────────────────────────────────────────────────── */}
      <div className="stats-bar">
        <div className="container">
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-num">500+</div>
              <div className="stat-lbl">Families Helped</div>
            </div>
            <div className="stat-item">
              <div className="stat-num">$300M+</div>
              <div className="stat-lbl">In Transactions</div>
            </div>
            <div className="stat-item">
              <div className="stat-num">10+</div>
              <div className="stat-lbl">Years in Hampton Roads</div>
            </div>
            <div className="stat-item">
              <div className="stat-num">5★</div>
              <div className="stat-lbl">Average Rating</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── MEET BARRY ───────────────────────────────────────────────── */}
      <section>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 80, alignItems: 'center' }}>
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
              <h2 style={{ marginBottom: 20 }}>Helping Families Move Since 2014</h2>
              <p style={{ fontSize: 16, marginBottom: 16 }}>
                Barry Jenkins built Legacy Home Team on a simple belief: every family deserves an agent who treats their home purchase like it's the most important transaction in the world — because it is.
              </p>
              <p style={{ fontSize: 16, marginBottom: 16 }}>
                With deep roots in Hampton Roads and a decade of experience navigating the local market, Barry combines data-driven strategy with a personal touch that keeps clients coming back — and referring their friends and family.
              </p>
              <p style={{ fontSize: 16, marginBottom: 32 }}>
                Whether you're buying your first home, upsizing, downsizing, or relocating to the area, Barry and the Legacy team will be with you every step of the way.
              </p>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 32 }}>
                {['REALTOR®', 'Hampton Roads Native', 'YLOPO Certified', 'Top Producer'].map(badge => (
                  <span key={badge} style={{
                    background: 'var(--accent-light)', color: 'var(--accent)',
                    fontSize: 12, fontWeight: 700, letterSpacing: '0.06em',
                    padding: '6px 14px', borderRadius: 99,
                  }}>{badge}</span>
                ))}
              </div>
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
              src="https://altos.re/html/s-html/8d125160-7a8d-4cb3-b0a0-c95d4cde0961?scale=1&marketNarrative=true&houses=true&weeklyChange=true&branding=true&size=medium"
              style={{ border: 0, display: 'block', width: 480, maxWidth: '100%', height: 600 }}
              scrolling="auto"
              loading="lazy"
              title="Virginia Beach Market Trends"
            />
          </div>
        </div>
      </section>

      {/* ── VIRGINIA BEACH LISTINGS ──────────────────────────────────── */}
      <VirginiaBeachListings />

      {/* ── WHY LEGACY ───────────────────────────────────────────────── */}
      <section style={{ background: 'var(--off-white)' }}>
        <div className="container">
          <div className="section-header">
            <span className="section-label">Why Legacy Home Team</span>
            <h2>Real Estate Done Right</h2>
            <p>We've spent a decade earning the trust of Hampton Roads families. Here's what sets us apart.</p>
          </div>
          <div className="cards-grid">
            {[
              { icon: '🏡', title: 'Deep Local Knowledge', body: 'We live and work in Hampton Roads. From Virginia Beach to Chesapeake, we know the neighborhoods, schools, and market trends that matter to you.' },
              { icon: '📊', title: 'Data-Driven Strategy', body: "Every pricing decision and offer strategy is backed by real market data — not guesswork. You'll always know exactly where you stand." },
              { icon: '⚡', title: 'Fast, Responsive Service', body: 'In a competitive market, speed wins. We respond quickly, move decisively, and make sure you never miss an opportunity.' },
              { icon: '🤝', title: 'Always In Your Corner', body: "We work exclusively for our clients — never the other side. Your goals drive every recommendation we make." },
              { icon: '🔍', title: 'Access to Every Listing', body: "From MLS to off-market properties, we surface opportunities other agents miss. If it's for sale in Hampton Roads, we'll find it." },
              { icon: '✅', title: 'Proven Track Record', body: '500+ closed transactions and a wall of 5-star reviews. Our results speak for themselves — and our clients keep coming back.' },
            ].map(item => (
              <div key={item.title} className="card">
                <div className="card-icon">{item.icon}</div>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AREAS WE SERVE ───────────────────────────────────────────── */}
      <section>
        <div className="container">
          <div className="section-header">
            <span className="section-label">Where We Work</span>
            <h2>Serving All of Hampton Roads</h2>
            <p>From oceanfront Virginia Beach to the quiet streets of Chesapeake — we know every corner of the region.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {areas.map(area => (
              <div key={area.name} style={{
                background: 'var(--white)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                padding: '24px 28px',
                transition: 'box-shadow 0.18s, border-color 0.18s',
                cursor: 'default',
              }}>
                <div style={{ fontWeight: 700, fontSize: 17, color: 'var(--text)', marginBottom: 8 }}>{area.name}</div>
                <p style={{ fontSize: 14 }}>{area.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── REVIEWS ──────────────────────────────────────────────────── */}
      <section style={{ background: 'var(--off-white)' }}>
        <div className="container">
          <div className="section-header">
            <span className="section-label">Client Stories</span>
            <h2>What Our Clients Say</h2>
            <p>Don't take our word for it — hear from the families we've helped across Hampton Roads.</p>
          </div>
          <div className="reviews-grid">
            {reviews.map(review => (
              <div key={review.author} className="review-card">
                <div className="review-stars">★★★★★</div>
                <p className="review-text">"{review.text}"</p>
                <div className="review-author">{review.author}</div>
                <div className="review-platform">{review.location}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

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
