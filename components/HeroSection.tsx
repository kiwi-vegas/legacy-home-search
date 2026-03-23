'use client'
import { useState } from 'react'

export default function HeroSection() {
  const [tab, setTab] = useState<'buy' | 'sell' | 'invest' | 'buy-before-sell'>('buy')
  const [city, setCity] = useState('')

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const q = city.trim() || 'Virginia Beach'
    window.open(
      `https://search.buyingva.com/search?s[locations][0][city]=${encodeURIComponent(q)}&s[locations][0][state]=VA`,
      '_blank'
    )
  }

  const headlineStyle = {
    color: '#fff',
    fontSize: 'clamp(2.5rem, 5.5vw, 4.25rem)' as const,
    fontWeight: 800,
    lineHeight: 1.05,
    letterSpacing: '-0.02em',
    marginBottom: 24,
    textTransform: 'uppercase' as const,
  }

  return (
    <section style={{
      position: 'relative',
      minHeight: 700,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-end',
      paddingTop: 'var(--nav-h)',
      paddingBottom: 80,
      overflow: 'hidden',
    }}>
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

        {/* ── Tab switcher — anchored above the content ── */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 40, width: 'fit-content' }}>
          {(['buy', 'sell', 'invest', 'buy-before-sell'] as const).map((t, i) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: '11px 32px',
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                border: 'none',
                cursor: 'pointer',
                background: tab === t ? 'var(--accent)' : 'rgba(255,255,255,0.12)',
                color: tab === t ? '#fff' : 'rgba(255,255,255,0.65)',
                backdropFilter: 'blur(8px)',
                transition: 'all 0.18s',
                borderRadius: i === 0 ? '8px 0 0 8px' : i === 3 ? '0 8px 8px 0' : '0',
              }}
            >
              {t === 'buy' ? 'Buy' : t === 'sell' ? 'Sell' : t === 'invest' ? 'Invest' : 'Buy-Before-Sell'}
            </button>
          ))}
        </div>

        {/* ── Tab content — fixed height so buttons never move ── */}
        <div style={{ minHeight: 320 }}>

        {/* ── BUY content ── */}
        {tab === 'buy' && (
          <div style={{ maxWidth: 780 }}>
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 16 }}>
              The Best Real Estate Agents in Virginia Beach, VA
            </p>
            <h1 style={headlineStyle}>
              Search All Homes<br />For Sale in<br />Virginia Beach
            </h1>
            <div style={{ width: 60, height: 4, background: 'var(--accent)', marginBottom: 28, borderRadius: 2 }} />
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 16, marginBottom: 36, maxWidth: 520, lineHeight: 1.7 }}>
              Let Barry Jenkins and the Legacy Home Team guide you through every step — from first search to closing day.
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
              <button type="submit" style={{
                padding: '16px 28px',
                background: 'var(--accent)',
                color: '#fff',
                border: 'none',
                borderRadius: '0 8px 8px 0',
                fontSize: 15,
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}>
                Search
              </button>
            </form>
          </div>
        )}

        {/* ── SELL content ── */}
        {tab === 'sell' && (
          <div style={{ maxWidth: 780 }}>
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 16 }}>
              Sell With Legacy Home Team
            </p>
            <h1 style={headlineStyle}>
              Sell Your Home For<br />The Highest Possible<br />Price On Your Timeline
            </h1>
            <div style={{ width: 60, height: 4, background: 'var(--accent)', marginBottom: 28, borderRadius: 2 }} />
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 16, marginBottom: 36, maxWidth: 520, lineHeight: 1.7 }}>
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

        {/* ── INVEST content ── */}
        {tab === 'invest' && (
          <div style={{ maxWidth: 780 }}>
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 16 }}>
              Investment Properties in Hampton Roads
            </p>
            <h1 style={headlineStyle}>
              Find Your Ideal<br />Investment in<br />Hampton Roads
            </h1>
            <div style={{ width: 60, height: 4, background: 'var(--accent)', marginBottom: 28, borderRadius: 2 }} />
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 16, marginBottom: 36, maxWidth: 520, lineHeight: 1.7 }}>
              From short-term rentals to long-term income properties, Barry and the Legacy Home Team know the Hampton Roads investment landscape inside and out.
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
              <button type="submit" style={{
                padding: '16px 28px',
                background: 'var(--accent)',
                color: '#fff',
                border: 'none',
                borderRadius: '0 8px 8px 0',
                fontSize: 15,
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}>
                Search
              </button>
            </form>
          </div>
        )}

        {/* ── BUY-BEFORE-SELL content ── */}
        {tab === 'buy-before-sell' && (
          <div style={{ maxWidth: 780 }}>
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 16 }}>
              Buy Before You Sell — With Legacy Home Team
            </p>
            <h1 style={headlineStyle}>
              For Such an Important<br />Life Event, Buy Before<br />You Sell Makes It Easy
            </h1>
            <div style={{ width: 60, height: 4, background: 'var(--accent)', marginBottom: 28, borderRadius: 2 }} />
            <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 16, marginBottom: 36, maxWidth: 520, lineHeight: 1.8 }}>
              <div>✔ Buy your new home before selling your old one.</div>
              <div>✔ Move on time and avoid paying for temporary housing.</div>
              <div>✔ Skip the hassle of showing your home while you, your family, or pets are still living in it.</div>
            </div>
            <a
              href="mailto:barry@yourfriendlyagent.net"
              className="btn-primary"
              style={{ fontSize: 16, padding: '16px 36px' }}
            >
              Learn More →
            </a>
          </div>
        )}

        </div>{/* end fixed-height content wrapper */}

      </div>
    </section>
  )
}
