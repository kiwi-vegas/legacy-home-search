'use client'
import { useState } from 'react'

export default function HeroSection() {
  const [tab, setTab] = useState<'buy' | 'sell'>('buy')
  const [city, setCity] = useState('')

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const q = city.trim() || 'Virginia Beach'
    window.open(
      `https://search.buyingva.com/search?s[locations][0][city]=${encodeURIComponent(q)}&s[locations][0][state]=VA`,
      '_blank'
    )
  }

  return (
    <section className="hero" style={{ minHeight: 700, alignItems: 'flex-start', paddingTop: 'calc(var(--nav-h) + 60px)', paddingBottom: 80 }}>
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
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.52)' }} />
      </div>

      <div className="container" style={{ position: 'relative', zIndex: 2, width: '100%' }}>

        {/* ── Tab switcher ── */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 48, width: 'fit-content' }}>
          {(['buy', 'sell'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: '12px 36px',
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                border: 'none',
                cursor: 'pointer',
                background: tab === t ? 'var(--accent)' : 'rgba(255,255,255,0.12)',
                color: tab === t ? '#fff' : 'rgba(255,255,255,0.7)',
                backdropFilter: 'blur(8px)',
                transition: 'all 0.18s',
                borderRadius: t === 'buy' ? '8px 0 0 8px' : '0 8px 8px 0',
              }}
            >
              {t === 'buy' ? 'Buy' : 'Sell'}
            </button>
          ))}
        </div>

        {/* ── BUY content ── */}
        {tab === 'buy' && (
          <div style={{ maxWidth: 780 }}>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 16 }}>
              The Best Real Estate Agents in Virginia Beach, VA
            </p>
            <h1 style={{
              color: '#fff',
              fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: '-0.02em',
              marginBottom: 24,
              textTransform: 'uppercase',
            }}>
              Search All Homes<br />For Sale in<br />Virginia Beach
            </h1>
            <div style={{ width: 60, height: 4, background: 'var(--accent)', marginBottom: 28, borderRadius: 2 }} />
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 16, marginBottom: 36, maxWidth: 520, lineHeight: 1.7 }}>
              Let Barry Jenkins and the Legacy Home Team guide you through the entire process — from first search to closing day.
            </p>
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: 0, maxWidth: 560 }}>
              <input
                type="text"
                value={city}
                onChange={e => setCity(e.target.value)}
                placeholder="Search by City, Neighborhood, or ZIP"
                style={{
                  flex: 1,
                  padding: '16px 20px',
                  fontSize: 15,
                  border: 'none',
                  borderRadius: '8px 0 0 8px',
                  outline: 'none',
                  background: '#fff',
                  color: 'var(--text)',
                }}
              />
              <button
                type="submit"
                style={{
                  padding: '16px 28px',
                  background: 'var(--accent)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '0 8px 8px 0',
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                Search
              </button>
            </form>
          </div>
        )}

        {/* ── SELL content ── */}
        {tab === 'sell' && (
          <div style={{ maxWidth: 720 }}>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 16 }}>
              Sell With Legacy Home Team
            </p>
            <h1 style={{
              color: '#fff',
              fontSize: 'clamp(2.2rem, 5vw, 4rem)',
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
              marginBottom: 24,
            }}>
              Sell Your Home For<br />The Highest Possible<br />Price On Your Timeline
            </h1>
            <div style={{ width: 60, height: 4, background: 'var(--accent)', marginBottom: 28, borderRadius: 2 }} />
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 17, marginBottom: 36, maxWidth: 520, lineHeight: 1.75 }}>
              Click below to take the first step by finding out what your home is worth.
            </p>
            <a
              href="https://listings.legacyhomesearch.com/seller"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
              style={{ fontSize: 16, padding: '16px 36px' }}
            >
              Start Selling →
            </a>
          </div>
        )}

      </div>
    </section>
  )
}
