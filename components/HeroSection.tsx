'use client'

export default function HeroSection({ posterUrl }: { posterUrl?: string }) {
  return (
    <section style={{
      position: 'relative',
      minHeight: 680,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: 'var(--nav-h)',
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
        {/* Gradient overlay — slightly lighter at top for elegance */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.38) 0%, rgba(0,0,0,0.55) 60%, rgba(0,0,0,0.62) 100%)',
        }} />
      </div>

      {/* Content */}
      <div style={{
        position: 'relative', zIndex: 2,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        textAlign: 'center',
        padding: '0 24px',
        maxWidth: 760,
      }}>
        {/* Eyebrow */}
        <p style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.55)',
          marginBottom: 20,
        }}>
          Virginia Beach &amp; Hampton Roads
        </p>

        {/* Main headline */}
        <h1 style={{
          color: '#fff',
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 'clamp(2.6rem, 5.5vw, 4.5rem)',
          fontWeight: 400,
          lineHeight: 1.1,
          letterSpacing: '0.01em',
          marginBottom: 20,
        }}>
          Hampton Roads' Most Trusted<br />Real Estate Team
        </h1>

        {/* Thin rule */}
        <div style={{
          width: 48, height: 2,
          background: 'rgba(255,255,255,0.4)',
          borderRadius: 1,
          marginBottom: 20,
        }} />

        {/* Sub-headline */}
        <p style={{
          color: 'rgba(255,255,255,0.72)',
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 'clamp(1.15rem, 2vw, 1.45rem)',
          fontWeight: 300,
          letterSpacing: '0.04em',
          lineHeight: 1.6,
          marginBottom: 44,
        }}>
          Thousands of homes. Zero pressure. Always available.
        </p>

        {/* CTA buttons */}
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
          <a
            href="https://search.buyingva.com/search?s[locations][0][state]=VA"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex', alignItems: 'center',
              padding: '14px 32px',
              background: 'var(--accent)',
              color: '#fff',
              border: '1.5px solid var(--accent)',
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 600,
              letterSpacing: '0.04em',
              textDecoration: 'none',
              transition: 'background 0.18s, transform 0.18s, box-shadow 0.18s',
              boxShadow: '0 2px 16px rgba(37,99,235,0.30)',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLAnchorElement).style.background = 'var(--accent-hover)'
              ;(e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-1px)'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLAnchorElement).style.background = 'var(--accent)'
              ;(e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(0)'
            }}
          >
            View Properties
          </a>
          <a
            href="https://search.buyingva.com/search?s[isNewConstruction]=true&s[locations][0][state]=VA"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex', alignItems: 'center',
              padding: '14px 32px',
              background: 'rgba(255,255,255,0.08)',
              color: '#fff',
              border: '1.5px solid rgba(255,255,255,0.45)',
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 600,
              letterSpacing: '0.04em',
              textDecoration: 'none',
              backdropFilter: 'blur(6px)',
              transition: 'background 0.18s, border-color 0.18s, transform 0.18s',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.15)'
              ;(e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(255,255,255,0.7)'
              ;(e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-1px)'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.08)'
              ;(e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(255,255,255,0.45)'
              ;(e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(0)'
            }}
          >
            Search All New Homes
          </a>
        </div>
      </div>
    </section>
  )
}
