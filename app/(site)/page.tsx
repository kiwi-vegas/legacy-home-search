import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Legacy Home Search | Coming Soon',
  description: 'Legacy Home Search — your trusted real estate partner. Launching soon.',
}

export default function HomePage() {
  return (
    <>
      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section className="hero">
        <div className="hero-bg" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1560184897-ae75f418493e?w=1600&q=80)' }} />
        <div className="container">
          <div className="hero-content">
            <div className="hero-eyebrow">
              Real Estate Made Simple
            </div>
            <h1>
              Coming Soon —<br />
              <span>Legacy Home Search</span>
            </h1>
            <p className="hero-sub">
              We&apos;re building something great. A modern real estate experience designed around you — your goals, your timeline, your home.
            </p>
            <div className="hero-actions">
              <a href="mailto:hello@legacyhomesearch.com" className="btn-primary">
                Get in Touch
              </a>
              <a href="/blog" className="btn-outline">
                Read Our Blog
              </a>
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
              <div className="stat-lbl">Homes Sold</div>
            </div>
            <div className="stat-item">
              <div className="stat-num">10+</div>
              <div className="stat-lbl">Years Experience</div>
            </div>
            <div className="stat-item">
              <div className="stat-num">98%</div>
              <div className="stat-lbl">Client Satisfaction</div>
            </div>
            <div className="stat-item">
              <div className="stat-num">$200M+</div>
              <div className="stat-lbl">In Transactions</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── WHY US ───────────────────────────────────────────────────── */}
      <section>
        <div className="container">
          <div className="section-header">
            <span className="section-label">Why Legacy</span>
            <h2>Real Estate Done Right</h2>
            <p>We believe buying or selling a home should be one of the best experiences of your life — not one of the most stressful ones.</p>
          </div>
          <div className="cards-grid">
            <div className="card">
              <div className="card-icon">🏠</div>
              <h3>Local Expertise</h3>
              <p>Deep knowledge of the local market means you get accurate pricing, smart strategy, and no surprises.</p>
            </div>
            <div className="card">
              <div className="card-icon">💬</div>
              <h3>Clear Communication</h3>
              <p>We keep you informed at every step. No jargon, no radio silence — just honest, clear updates throughout.</p>
            </div>
            <div className="card">
              <div className="card-icon">📊</div>
              <h3>Data-Driven Decisions</h3>
              <p>From pricing strategy to neighborhood analysis, every recommendation is backed by real market data.</p>
            </div>
            <div className="card">
              <div className="card-icon">🤝</div>
              <h3>Your Advocate</h3>
              <p>We work exclusively for you — never the other side. Your interests always come first.</p>
            </div>
            <div className="card">
              <div className="card-icon">⚡</div>
              <h3>Fast Response</h3>
              <p>In a competitive market, speed matters. Expect quick responses and fast action when it counts.</p>
            </div>
            <div className="card">
              <div className="card-icon">✅</div>
              <h3>Proven Results</h3>
              <p>Hundreds of successful transactions and 5-star reviews speak to our consistent track record.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────── */}
      <section id="contact" style={{ background: 'var(--off-white)' }}>
        <div className="container" style={{ textAlign: 'center', maxWidth: 640 }}>
          <span className="section-label">Get Started</span>
          <h2>Ready to Make Your Move?</h2>
          <p style={{ fontSize: 17, marginBottom: 32 }}>
            Whether you&apos;re buying your first home, selling your current one, or just exploring your options — we&apos;d love to talk.
          </p>
          <a href="mailto:hello@legacyhomesearch.com" className="btn-primary" style={{ fontSize: 16 }}>
            Contact Us Today
          </a>
        </div>
      </section>
    </>
  )
}
