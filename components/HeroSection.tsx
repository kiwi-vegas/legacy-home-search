'use client'

import { useEffect, useState } from 'react'

const SLIDES = [
  {
    eyebrow: 'WELCOME TO',
    headline: 'LEGACY HOME TEAM',
    sub: 'Search our exclusive listings.',
    headlineSize: undefined as string | undefined,
  },
  {
    eyebrow: 'TECHNOLOGY + MARKETING =',
    headline: 'RESULTS',
    sub: 'Search our exclusive listings.',
    headlineSize: undefined as string | undefined,
  },
  {
    eyebrow: 'HAMPTON ROADS',
    headline: 'MARKETING EXPERTISE',
    sub: 'Search our exclusive listings.',
    headlineSize: undefined as string | undefined,
  },
  {
    eyebrow: 'PREMIER REAL ESTATE AGENTS IN THE',
    headline: 'HAMPTON ROADS AREA,\nVIRGINIA BEACH, SUFFOLK,\nNORFOLK, CHESAPEAKE,\nHAMPTON AND NEWPORT NEWS',
    sub: null,
    headlineSize: 'clamp(1.5rem, 3.2vw, 2.8rem)',
  },
]

const INTERVAL = 6000

export default function HeroSection({ posterUrl }: { posterUrl?: string }) {
  const [active, setActive] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setActive(prev => (prev + 1) % SLIDES.length)
        setVisible(true)
      }, 500)
    }, INTERVAL)
    return () => clearInterval(timer)
  }, [])

  const slide = SLIDES[active]

  return (
    <section style={{
      position: 'relative',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    }}>
      {/* Vimeo background video */}
      <div style={{
        position: 'absolute', inset: 0, overflow: 'hidden', zIndex: 0,
        background: posterUrl
          ? `url("${posterUrl}") center/cover no-repeat`
          : '#0d1b2a',
      }}>
        <iframe
          src="https://player.vimeo.com/video/1183182969?background=1&autoplay=1&loop=1&byline=0&title=0&muted=1"
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
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.42) 0%, rgba(0,0,0,0.58) 60%, rgba(0,0,0,0.65) 100%)',
        }} />
      </div>

      {/* Rotating content */}
      <div style={{
        position: 'relative', zIndex: 2,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        textAlign: 'center',
        padding: '0 24px',
        maxWidth: 1100,
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.5s ease',
      }}>

        {/* Eyebrow */}
        <p style={{
          fontSize: 13,
          fontWeight: 400,
          letterSpacing: '0.26em',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.75)',
          fontFamily: "'Montserrat', sans-serif",
          marginBottom: 20,
        }}>
          {slide.eyebrow}
        </p>

        {/* Main headline */}
        <h1 style={{
          color: '#fff',
          fontFamily: "'Montserrat', sans-serif",
          fontSize: slide.headlineSize ?? 'clamp(2.6rem, 6vw, 5rem)',
          fontWeight: 400,
          lineHeight: 1.15,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          marginBottom: slide.sub ? 28 : 44,
          whiteSpace: 'pre-line',
        }}>
          {slide.headline}
        </h1>

        {/* Thin rule */}
        {slide.sub && (
          <div style={{
            width: 40, height: 1,
            background: 'rgba(255,255,255,0.45)',
            marginBottom: 24,
          }} />
        )}

        {/* Sub */}
        {slide.sub && (
          <p style={{
            color: 'rgba(255,255,255,0.78)',
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 'clamp(1.1rem, 1.8vw, 1.35rem)',
            fontWeight: 300,
            fontStyle: 'italic',
            letterSpacing: '0.06em',
            lineHeight: 1.6,
            marginBottom: 44,
          }}>
            {slide.sub}
          </p>
        )}

        {/* CTA */}
        <a
          href="#listings"
          style={{
            display: 'inline-flex', alignItems: 'center',
            padding: '14px 48px',
            background: 'transparent',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.70)',
            fontSize: 12,
            fontWeight: 400,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            textDecoration: 'none',
            fontFamily: "'Montserrat', sans-serif",
            transition: 'background 0.2s, border-color 0.2s',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.12)'
            ;(e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(255,255,255,1)'
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLAnchorElement).style.background = 'transparent'
            ;(e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(255,255,255,0.70)'
          }}
        >
          Search All Homes
        </a>
      </div>

      {/* Slide indicators */}
      <div style={{
        position: 'absolute', bottom: 28, left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex', gap: 8, zIndex: 3,
      }}>
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => { setVisible(false); setTimeout(() => { setActive(i); setVisible(true) }, 300) }}
            style={{
              width: i === active ? 24 : 8,
              height: 2,
              background: i === active ? 'rgba(255,255,255,0.90)' : 'rgba(255,255,255,0.35)',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              transition: 'width 0.3s ease, background 0.3s ease',
            }}
          />
        ))}
      </div>
    </section>
  )
}
