import type { Metadata } from 'next'
import Link from 'next/link'
import HamptonRoadsMap from '@/components/HamptonRoadsMap'

export const metadata: Metadata = {
  title: 'Hampton Roads Communities | Legacy Home Team',
  description: 'Explore homes for sale across Virginia Beach, Chesapeake, Norfolk, Suffolk, Hampton, and Newport News. Barry Jenkins and the Legacy Home Team serve all of Hampton Roads.',
}

const communities = [
  {
    name: 'Virginia Beach',
    slug: 'virginia-beach',
    icon: '🏖️',
    tagline: 'Where the Ocean Meets Opportunity',
    desc: 'From oceanfront condos along the resort strip to quiet suburban neighborhoods near top-ranked schools — Virginia Beach offers the widest range of homes in Hampton Roads.',
    highlight: 'Military-friendly · 35 miles of coastline · Strong schools',
  },
  {
    name: 'Chesapeake',
    slug: 'chesapeake',
    icon: '🏡',
    tagline: 'Space, Schools & New Construction',
    desc: 'One of the fastest-growing cities in Virginia, Chesapeake combines top-rated school districts with new construction communities, country estates, and accessible pricing.',
    highlight: 'Top schools · New builds · Room to grow',
  },
  {
    name: 'Norfolk',
    slug: 'norfolk',
    icon: '⚓',
    tagline: 'Urban Energy, Waterfront Character',
    desc: 'Norfolk is Hampton Roads\' urban core — a compact, walkable city with a thriving arts scene, historic neighborhoods, major military installations, and a beautiful waterfront.',
    highlight: 'City living · Historic districts · Waterfront',
  },
  {
    name: 'Suffolk',
    slug: 'suffolk',
    icon: '🌳',
    tagline: 'Land, Privacy & Master-Planned Communities',
    desc: 'One of the largest cities by land area in the eastern US. Suffolk blends rural tranquility with fast-growing subdivisions — ideal for buyers who want space without sacrificing convenience.',
    highlight: 'Large lots · Master-planned · Lower price points',
  },
  {
    name: 'Hampton',
    slug: 'hampton',
    icon: '🚀',
    tagline: 'History, Water & Military Roots',
    desc: 'Home to Langley Air Force Base, Hampton University, and miles of waterfront, Hampton offers affordable entry points, strong rental demand, and a rich sense of place.',
    highlight: 'Military · Waterfront access · NASA Langley',
  },
  {
    name: 'Newport News',
    slug: 'newport-news',
    icon: '⚙️',
    tagline: 'Value, Variety & Peninsula Living',
    desc: 'Newport News offers some of Hampton Roads\' best value — diverse housing stock from starter homes to waterfront estates, with easy access to I-64, the shipyard, and the Peninsula.',
    highlight: 'Best value · Peninsula access · Diverse inventory',
  },
]

export default function CommunitiesPage() {
  return (
    <main>
      {/* BREADCRUMB */}
      <div className="breadcrumb">
        <div className="breadcrumb-inner">
          <Link href="/">Home</Link>
          <span className="breadcrumb-sep">›</span>
          <span>Communities</span>
        </div>
      </div>

      {/* HERO */}
      <header style={{
        position: 'relative',
        minHeight: 480,
        display: 'flex',
        alignItems: 'flex-end',
        paddingBottom: 64,
        overflow: 'hidden',
        background: '#0f1a2e',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(135deg, #0f1a2e 0%, #1a2f50 50%, #0d2040 100%)',
        }} />
        {/* Subtle dot grid */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(rgba(37,99,235,0.15) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }} />
        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>
            Hampton Roads, Virginia
          </p>
          <h1 style={{ color: '#fff', fontSize: 'clamp(2.2rem, 5vw, 3.75rem)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 16 }}>
            Find Your Perfect<br />Hampton Roads Community
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 17, maxWidth: 560, marginBottom: 40, lineHeight: 1.7 }}>
            Barry Jenkins and the Legacy Home Team serve all six cities across Hampton Roads — from the Atlantic coast to the western Peninsula. Explore the map to find your neighborhood.
          </p>
          <div style={{ display: 'flex', gap: 40, flexWrap: 'wrap' }}>
            {[
              ['6', 'Communities Served'],
              ['1.8M+', 'Metro Population'],
              ['10+', 'Years Local Expertise'],
              ['900+', 'Homes Sold Annually'],
            ].map(([num, lbl]) => (
              <div key={lbl}>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff', lineHeight: 1 }}>{num}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 4 }}>{lbl}</div>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* INTERACTIVE MAP */}
      <section style={{ background: 'var(--off-white)' }}>
        <div className="container">
          <div className="section-header">
            <span className="section-label">Explore the Map</span>
            <h2>Where We Work</h2>
            <p>Hover over any city to learn more, or click to explore listings and market data.</p>
          </div>
          <div style={{
            height: 540,
            borderRadius: 'var(--radius-xl)',
            overflow: 'hidden',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow)',
          }}>
            <HamptonRoadsMap />
          </div>
          <p style={{ marginTop: 12, fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' }}>
            City boundaries are approximate and shown for reference only.
          </p>
        </div>
      </section>

      {/* COMMUNITY CARDS */}
      <section>
        <div className="container">
          <div className="section-header">
            <span className="section-label">Our Communities</span>
            <h2>Six Cities, One Expert Team</h2>
            <p>Every Hampton Roads community has its own personality, price range, and lifestyle — here&apos;s what makes each one unique.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
            {communities.map(c => (
              <Link key={c.slug} href={`/${c.slug}`} style={{ textDecoration: 'none' }}>
                <div style={{
                  background: 'var(--white)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-xl)',
                  padding: '28px 28px 24px',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'box-shadow 0.2s ease, border-color 0.2s ease, transform 0.2s ease',
                  cursor: 'pointer',
                }}
                  className="community-hub-card"
                >
                  <div style={{ fontSize: 36, marginBottom: 14 }}>{c.icon}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
                    {c.tagline}
                  </div>
                  <h3 style={{ fontSize: '1.2rem', marginBottom: 10 }}>{c.name}</h3>
                  <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 16, flex: 1 }}>
                    {c.desc}
                  </p>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', borderTop: '1px solid var(--border-light)', paddingTop: 14, marginTop: 'auto' }}>
                    {c.highlight}
                  </div>
                  <div style={{ marginTop: 16, fontSize: 14, fontWeight: 700, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    Explore {c.name} <span>→</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: 'var(--accent)', textAlign: 'center' }}>
        <div className="container" style={{ maxWidth: 640 }}>
          <h2 style={{ color: '#fff', marginBottom: 16 }}>Not Sure Which Community Is Right for You?</h2>
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 17, marginBottom: 36 }}>
            Barry has lived and worked in Hampton Roads for over a decade. Tell him your priorities — schools, commute, lifestyle, budget — and he&apos;ll point you in the right direction.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="tel:+17578164037" style={{ background: '#fff', color: 'var(--accent)', padding: '14px 32px', borderRadius: 'var(--radius)', fontWeight: 700, fontSize: 15, textDecoration: 'none' }}>
              Call (757) 816-4037
            </a>
            <Link href="/#contact" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', padding: '14px 32px', borderRadius: 'var(--radius)', fontWeight: 700, fontSize: 15, textDecoration: 'none', border: '1.5px solid rgba(255,255,255,0.4)' }}>
              Send a Message
            </Link>
          </div>
          <p style={{ marginTop: 24, fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Licensed in Virginia · Legacy Home Team · (757) 816-4037</p>
        </div>
      </section>
    </main>
  )
}
