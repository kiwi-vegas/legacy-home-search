import HamptonRoadsMap from '@/components/HamptonRoadsMap'
import AgentHeroSearchBar from '@/components/AgentHeroSearchBar'
import AgentCommunityListings from '@/components/AgentCommunityListings'
import AgentContactForm from '@/components/AgentContactForm'

interface AgentLandingPageProps {
  name: string          // "Tanya Thompson"
  title?: string        // "REALTOR®"
  phone: string         // "(757) 737-1866"
  phoneHref: string     // "tel:+17577371866"
  email: string         // "tanyasellsvirginia@gmail.com"
  photo: string         // "/team/tanya-thompson.jpg"
  bio?: string[]        // paragraphs from Sanity (or empty)
  subdomain: string     // "https://tanya.legacyhomesearch.com"
  slug: string          // "tanya-thompson"
}

export default function AgentLandingPage({
  name,
  title = 'REALTOR®',
  phone,
  phoneHref,
  email,
  photo,
  bio,
  subdomain,
  slug,
}: AgentLandingPageProps) {
  const firstName = name.split(' ')[0]
  const bioText =
    bio?.[0] ??
    `A dedicated Hampton Roads REALTOR® with Legacy Home Team, ${name} brings local expertise, clear communication, and a client-first approach to every transaction — whether you're buying, selling, or investing across the region.`

  return (
    <>
      {/* ── LUXURY HERO ──────────────────────────────────────────────── */}
      <section style={{
        background: '#070e1f',
        position: 'relative',
        overflow: 'hidden',
        paddingTop: 'calc(var(--nav-h) + 60px)',
        paddingBottom: 72,
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse 80% 60% at 60% 50%, rgba(37,99,235,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '260px 1fr',
              gap: 72,
              alignItems: 'center',
            }}
            className="agent-hero-grid"
          >
            {/* ── LEFT: Agent identity card ─────────────────────────── */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
              <div style={{
                width: '100%',
                aspectRatio: '3/4',
                borderRadius: 12,
                overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.10)',
                position: 'relative',
              }}>
                <img
                  src={photo}
                  alt={`${name} — ${title}`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }}
                />
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(to top, rgba(7,14,31,0.75) 0%, transparent 55%)',
                }} />
                <div style={{ position: 'absolute', bottom: 16, left: 16, right: 16 }}>
                  <div style={{ color: '#fff', fontWeight: 700, fontSize: 17, lineHeight: 1.25 }}>{name}</div>
                  <div style={{ color: 'rgba(147,197,253,0.85)', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 4 }}>
                    {title} · Legacy Home Team
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
                <a
                  href={phoneHref}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '11px 16px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.10)',
                    borderRadius: 8,
                    color: 'rgba(255,255,255,0.85)',
                    fontSize: 13, fontWeight: 600,
                    textDecoration: 'none',
                    transition: 'background 0.15s',
                  }}
                >
                  <span style={{ color: 'var(--accent)', fontSize: 15 }}>📞</span>
                  {phone}
                </a>
                <a
                  href={`mailto:${email}`}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '11px 16px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.10)',
                    borderRadius: 8,
                    color: 'rgba(255,255,255,0.85)',
                    fontSize: 12, fontWeight: 600,
                    textDecoration: 'none',
                    transition: 'background 0.15s',
                    wordBreak: 'break-all',
                  }}
                >
                  <span style={{ color: 'var(--accent)', fontSize: 15, flexShrink: 0 }}>✉️</span>
                  {email}
                </a>
              </div>
            </div>

            {/* ── RIGHT: Search content ─────────────────────────────── */}
            <div>
              <div style={{
                fontSize: 11, fontWeight: 700, letterSpacing: '0.16em',
                textTransform: 'uppercase', color: 'rgba(147,197,253,0.65)',
                marginBottom: 18,
              }}>
                Hampton Roads · Virginia
              </div>

              <h1 style={{
                fontSize: 'clamp(2.2rem, 4vw, 3.6rem)',
                fontWeight: 300,
                letterSpacing: '-0.02em',
                color: '#fff',
                lineHeight: 1.08,
                margin: '0 0 8px',
              }}>
                Search Hampton Roads
              </h1>
              <h1 style={{
                fontSize: 'clamp(2.2rem, 4vw, 3.6rem)',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                color: '#fff',
                lineHeight: 1.08,
                margin: '0 0 28px',
              }}>
                Real Estate
              </h1>

              <p style={{
                fontSize: 16, color: 'rgba(255,255,255,0.55)',
                marginBottom: 32, lineHeight: 1.65, maxWidth: 480,
              }}>
                Browse active MLS listings across all of Hampton Roads — with expert guidance from a trusted local agent.
              </p>

              <AgentHeroSearchBar subdomain={subdomain} />
            </div>
          </div>
        </div>
      </section>

      {/* ── AGENT VALUE STRIP ────────────────────────────────────────── */}
      <section style={{ background: 'var(--off-white)', paddingTop: 52, paddingBottom: 52 }}>
        <div className="container">
          <div style={{ maxWidth: 740, margin: '0 auto', textAlign: 'center' }}>
            <p style={{
              fontSize: 17, lineHeight: 1.75,
              color: 'var(--text-secondary)',
              marginBottom: 32,
            }}>
              {bioText}
            </p>
            <div style={{
              display: 'flex', justifyContent: 'center',
              gap: 40, marginBottom: 32, flexWrap: 'wrap',
            }}>
              {[
                { stat: '6 Communities', sub: 'All of Hampton Roads' },
                { stat: '5-Star Service', sub: 'Client-first approach' },
                { stat: 'Legacy Home Team', sub: 'Market-leading resources' },
              ].map(({ stat, sub }) => (
                <div key={stat} style={{ textAlign: 'center' }}>
                  <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--text)' }}>{stat}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>{sub}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <a href={phoneHref} className="btn-primary">Call {phone}</a>
              <a href={`mailto:${email}`} className="btn-outline">Send an Email</a>
            </div>
          </div>
        </div>
      </section>

      {/* ── COMMUNITY LISTINGS WITH TABS ─────────────────────────────── */}
      <section>
        <div className="container">
          <div className="section-header">
            <span className="section-label">Browse</span>
            <h2>Hampton Roads Property Search</h2>
            <p>Filter by community or browse all active MLS listings — updated daily.</p>
          </div>
          <AgentCommunityListings subdomain={subdomain} />
        </div>
      </section>

      {/* ── AREAS I COVER (MAP) ──────────────────────────────────────── */}
      <section style={{ background: 'var(--off-white)' }}>
        <div className="container">
          <div className="section-header">
            <span className="section-label">Where I Work</span>
            <h2>Areas I Cover</h2>
            <p>From oceanfront Virginia Beach to the quiet streets of Chesapeake — {firstName} knows every corner of Hampton Roads.</p>
          </div>
          <div style={{ height: 520, borderRadius: 'var(--radius-xl)', overflow: 'hidden', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
            <HamptonRoadsMap />
          </div>
          <p style={{ marginTop: 12, fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' }}>
            Hover a city to explore — click to view listings and market data.
          </p>
        </div>
      </section>

      {/* ── CONTACT ──────────────────────────────────────────────────── */}
      <section id="contact">
        <div className="container">
          <div className="contact-grid">
            <div>
              <span className="section-label">Get In Touch</span>
              <h2 style={{ marginBottom: 20 }}>Ready to Work with {firstName}?</h2>
              <p style={{ fontSize: 16, marginBottom: 36 }}>
                Whether you&apos;re buying your first home, upsizing, or getting ready to sell — {firstName} is ready to help. Reach out and expect a personal response quickly.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {([
                  { icon: '📞', label: 'Phone',  value: phone,  href: phoneHref },
                  { icon: '✉️', label: 'Email',  value: email,  href: `mailto:${email}` },
                  { icon: '📍', label: 'Office', value: '1545 Crossways Blvd, Suite 250\nChesapeake, VA 23320', href: null },
                ] as const).map(item => (
                  <div key={item.label} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                    <div style={{
                      width: 44, height: 44,
                      background: 'var(--accent-light)',
                      borderRadius: 'var(--radius)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 20, flexShrink: 0,
                    }}>
                      {item.icon}
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                        {item.label}
                      </div>
                      {item.href ? (
                        <a href={item.href} style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', textDecoration: 'none' }}>
                          {item.value}
                        </a>
                      ) : (
                        <div style={{ fontSize: 15, color: 'var(--text)', whiteSpace: 'pre-line', lineHeight: 1.6 }}>
                          {item.value}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <AgentContactForm
              agentName={firstName}
              agentSlug={slug}
              agentPhone={phone}
              agentPhoneHref={phoneHref}
            />
          </div>
        </div>
      </section>
    </>
  )
}
