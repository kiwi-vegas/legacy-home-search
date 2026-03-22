'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <nav id="nav" className={scrolled ? 'scrolled' : ''}>
        <div className="container nav-inner">
          <Link href="/" className="nav-logo-text">
            Legacy Home Search
          </Link>

          <div className="nav-links">
            <Link href="/#contact" className="nav-link">Buy</Link>
            <Link href="/#contact" className="nav-link">Sell</Link>
            <Link href="/blog" className="nav-link">Blog</Link>
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
          padding: '16px 24px', zIndex: 999,
          boxShadow: 'var(--shadow)',
        }}>
          <Link href="/blog" style={{ display: 'block', padding: '12px 0', color: 'var(--text-secondary)', textDecoration: 'none', borderBottom: '1px solid var(--border-light)' }} onClick={() => setMobileOpen(false)}>Blog</Link>
          <Link href="/#contact" style={{ display: 'block', padding: '12px 0', color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }} onClick={() => setMobileOpen(false)}>Contact Us</Link>
        </div>
      )}
    </>
  )
}
