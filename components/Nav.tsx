'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

const communities = [
  { name: 'Virginia Beach', slug: 'virginia-beach' },
  { name: 'Chesapeake', slug: 'chesapeake' },
  { name: 'Norfolk', slug: 'norfolk' },
  { name: 'Suffolk', slug: 'suffolk' },
  { name: 'Hampton', slug: 'hampton' },
  { name: 'Newport News', slug: 'newport-news' },
]

interface RecentPost { title: string; slug: string; category: string }

export default function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mobileCommOpen, setMobileCommOpen] = useState(false)
  const [mobileBlogOpen, setMobileBlogOpen] = useState(false)
  const [recentPosts, setRecentPosts] = useState<RecentPost[]>([])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    fetch('/api/blog/recent-posts')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.posts) setRecentPosts(d.posts) })
      .catch(() => {})
  }, [])

  return (
    <>
      <nav id="nav" className={scrolled ? 'scrolled' : ''}>
        <div className="container nav-inner">
          <Link href="/" className="nav-logo">
            <img src="/legacy-home-team-logo.png" alt="Legacy Home Team" style={{ height: 38, width: 'auto' }} />
          </Link>

          <div className="nav-links">
            <Link href="/#contact" className="nav-link">Buy</Link>
            <a href="https://listings.legacyhomesearch.com/seller" className="nav-link" target="_blank" rel="noopener noreferrer">Sell</a>

            {/* Communities dropdown */}
            <div className="nav-dropdown-wrap">
              <button className="nav-link" style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
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

            <Link href="/team" className="nav-link">Our Team</Link>

            {/* Blog dropdown */}
            <div className="nav-dropdown-wrap">
              <button className="nav-link" style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                Blog
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ opacity: 0.5, marginTop: 1 }}>
                  <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <div className="nav-dropdown nav-dropdown--wide">
                <div className="nav-dropdown-label">Latest Posts</div>
                {recentPosts.map(p => (
                  <Link key={p.slug} href={`/blog/${p.slug}`} style={{ whiteSpace: 'normal', lineHeight: 1.4 }}>
                    {p.title}
                  </Link>
                ))}
                <div style={{ borderTop: '1px solid var(--border-light)', marginTop: 6, paddingTop: 6 }}>
                  <Link href="/blog" style={{ fontWeight: 700, color: 'var(--accent)' }}>
                    View All Posts →
                  </Link>
                </div>
              </div>
            </div>
            <a href="tel:+17578164037" className="nav-link" style={{ fontWeight: 600 }}>(757) 816-4037</a>
            <Link href="/#contact" className="nav-link nav-cta">Contact Us</Link>
          </div>

          <button
            className="nav-hamburger"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
            style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', padding: '8px' }}
          >
            <span style={{ display: 'block', width: 22, height: 2, background: 'var(--text)', marginBottom: 5 }} />
            <span style={{ display: 'block', width: 22, height: 2, background: 'var(--text)', marginBottom: 5 }} />
            <span style={{ display: 'block', width: 22, height: 2, background: 'var(--text)' }} />
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
          <Link href="/#contact" style={{ display: 'block', padding: '12px 0', color: 'var(--text-secondary)', textDecoration: 'none', borderBottom: '1px solid var(--border-light)' }} onClick={() => setMobileOpen(false)}>Buy</Link>
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

          {/* Mobile Blog dropdown */}
          <button
            onClick={() => setMobileBlogOpen(!mobileBlogOpen)}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '12px 0', color: 'var(--text-secondary)', background: 'none', border: 'none', borderBottom: '1px solid var(--border-light)', cursor: 'pointer', fontSize: 'inherit', fontFamily: 'inherit' }}
          >
            Blog
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ opacity: 0.5, transform: mobileBlogOpen ? 'rotate(180deg)' : 'none', transition: '0.18s' }}>
              <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          {mobileBlogOpen && (
            <div style={{ paddingLeft: 16, borderBottom: '1px solid var(--border-light)' }}>
              {recentPosts.map(p => (
                <Link key={p.slug} href={`/blog/${p.slug}`} style={{ display: 'block', padding: '10px 0', color: 'var(--text-secondary)', textDecoration: 'none', fontSize: 14, lineHeight: 1.4 }} onClick={() => { setMobileOpen(false); setMobileBlogOpen(false) }}>
                  {p.title}
                </Link>
              ))}
              <Link href="/blog" style={{ display: 'block', padding: '10px 0', color: 'var(--accent)', textDecoration: 'none', fontSize: 14, fontWeight: 700 }} onClick={() => { setMobileOpen(false); setMobileBlogOpen(false) }}>
                View All Posts →
              </Link>
            </div>
          )}
          <Link href="/#contact" style={{ display: 'block', padding: '12px 0', color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }} onClick={() => setMobileOpen(false)}>Contact Us</Link>
        </div>
      )}
    </>
  )
}
