'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const communities = [
  { name: 'Virginia Beach', slug: 'virginia-beach' },
  { name: 'Chesapeake', slug: 'chesapeake' },
  { name: 'Norfolk', slug: 'norfolk' },
  { name: 'Suffolk', slug: 'suffolk' },
  { name: 'Hampton', slug: 'hampton' },
  { name: 'Newport News', slug: 'newport-news' },
]

export default function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mobileCommOpen, setMobileCommOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Transparent overlay only on the homepage hero (dark video background)
  const isTransparent = pathname === '/' && !scrolled

  const linkColor = isTransparent ? 'rgba(255,255,255,0.88)' : undefined
  const barColor = isTransparent ? '#fff' : 'var(--text)'
  // White logo over dark video; black logo over white nav (on all other pages or after scroll)
  const logoFilter = isTransparent ? 'brightness(0) invert(1)' : 'brightness(0)'

  return (
    <>
      <nav id="nav" className={scrolled || !isTransparent ? 'scrolled' : ''}>
        <div className="container nav-inner">
          <Link href="/" className="nav-logo">
            <img src="/legacy-home-team-logo.png" alt="Legacy Home Team" style={{ height: 38, width: 'auto', filter: logoFilter, transition: 'filter 0.35s ease' }} />
          </Link>

          <div className="nav-links">
            <Link href="/#listings" className="nav-link" style={{ color: linkColor }}>Buy</Link>
            <a href="https://listings.legacyhomesearch.com/seller" className="nav-link" style={{ color: linkColor }} target="_blank" rel="noopener noreferrer">Sell</a>

            {/* Communities dropdown */}
            <div className="nav-dropdown-wrap">
              <button className="nav-link" style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, color: linkColor }}>
                Communities
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ opacity: 0.5, marginTop: 1 }}>
                  <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <div className="nav-dropdown">
                <div className="nav-dropdown-label">Hampton Roads Communities</div>
                <Link href="/communities" style={{ fontWeight: 700, color: 'var(--accent)' }}>View All Communities →</Link>
                {communities.map(c => (
                  <Link key={c.slug} href={`/${c.slug}`}>{c.name}</Link>
                ))}
              </div>
            </div>

            <Link href="/team" className="nav-link" style={{ color: linkColor }}>Our Team</Link>
            <Link href="/blog" className="nav-link" style={{ color: linkColor }}>Blog</Link>
            <a href="tel:+17578164037" className="nav-link" style={{ fontWeight: 600, color: linkColor }}>(757) 816-4037</a>
            <Link
              href="/#contact"
              className="nav-link nav-cta"
              style={isTransparent ? { background: 'transparent', border: '1px solid rgba(255,255,255,0.70)', color: '#fff' } : undefined}
            >Contact Us</Link>
          </div>

          <button
            className="nav-hamburger"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
            style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', padding: '8px' }}
          >
            <span style={{ display: 'block', width: 22, height: 2, background: barColor, marginBottom: 5, transition: 'background 0.35s' }} />
            <span style={{ display: 'block', width: 22, height: 2, background: barColor, marginBottom: 5, transition: 'background 0.35s' }} />
            <span style={{ display: 'block', width: 22, height: 2, background: barColor, transition: 'background 0.35s' }} />
          </button>
        </div>
      </nav>

      {mobileOpen && (
        <div style={{
          position: 'fixed', top: 'var(--nav-h)', left: 0, right: 0,
          background: 'var(--white)', borderBottom: '1px solid var(--border)',
          padding: '8px 24px 16px', zIndex: 999,
          boxShadow: 'var(--shadow)',
        }}>
          <Link href="/#listings" style={{ display: 'block', padding: '12px 0', color: 'var(--text-secondary)', textDecoration: 'none', borderBottom: '1px solid var(--border-light)' }} onClick={() => setMobileOpen(false)}>Buy</Link>
          <a href="https://listings.legacyhomesearch.com/seller" target="_blank" rel="noopener noreferrer" style={{ display: 'block', padding: '12px 0', color: 'var(--text-secondary)', textDecoration: 'none', borderBottom: '1px solid var(--border-light)' }} onClick={() => setMobileOpen(false)}>Sell</a>
          <button
            onClick={() => setMobileCommOpen(!mobileCommOpen)}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '12px 0', color: 'var(--text-secondary)', background: 'none', border: 'none', borderBottom: '1px solid var(--border-light)', cursor: 'pointer', fontSize: 'inherit', fontFamily: 'inherit' }}
          >
            Communities
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ opacity: 0.5, transform: mobileCommOpen ? 'rotate(180deg)' : 'none', transition: '0.18s' }}>
              <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          {mobileCommOpen && (
            <div style={{ paddingLeft: 16, borderBottom: '1px solid var(--border-light)' }}>
              <Link href="/communities" style={{ display: 'block', padding: '10px 0', color: 'var(--accent)', textDecoration: 'none', fontSize: 14, fontWeight: 700 }} onClick={() => { setMobileOpen(false); setMobileCommOpen(false) }}>
                View All Communities →
              </Link>
              {communities.map(c => (
                <Link key={c.slug} href={`/${c.slug}`} style={{ display: 'block', padding: '10px 0', color: 'var(--text-secondary)', textDecoration: 'none', fontSize: 14 }} onClick={() => { setMobileOpen(false); setMobileCommOpen(false) }}>
                  {c.name}
                </Link>
              ))}
            </div>
          )}
          <Link href="/team" style={{ display: 'block', padding: '12px 0', color: 'var(--text-secondary)', textDecoration: 'none', borderBottom: '1px solid var(--border-light)' }} onClick={() => setMobileOpen(false)}>Our Team</Link>
          <Link href="/blog" style={{ display: 'block', padding: '12px 0', color: 'var(--text-secondary)', textDecoration: 'none', borderBottom: '1px solid var(--border-light)' }} onClick={() => setMobileOpen(false)}>Blog</Link>
          <Link href="/#contact" style={{ display: 'block', padding: '12px 0', color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }} onClick={() => setMobileOpen(false)}>Contact Us</Link>
        </div>
      )}
    </>
  )
}
