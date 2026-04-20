/**
 * Font preview page — localhost only
 * Visit: http://localhost:3000/font-preview
 */

export default function FontPreviewPage() {
  const fonts = [
    {
      name: 'Playfair Display',
      description: 'Classic luxury real estate — bold, editorial, confident',
      family: "'Playfair Display', serif",
      weight: 700,
      import: 'Playfair+Display:wght@700',
    },
    {
      name: 'Cormorant Garamond',
      description: 'Fashion-house elegant — ultra-refined, high-contrast, couture',
      family: "'Cormorant Garamond', serif",
      weight: 400,
      import: 'Cormorant+Garamond:wght@300;400;600',
    },
    {
      name: 'DM Serif Display',
      description: 'Modern editorial — contemporary, confident, a little quirky',
      family: "'DM Serif Display', serif",
      weight: 400,
      import: 'DM+Serif+Display',
    },
    {
      name: 'Libre Baskerville',
      description: 'Trustworthy & established — gravitas, timeless, authoritative',
      family: "'Libre Baskerville', serif",
      weight: 700,
      import: 'Libre+Baskerville:wght@400;700',
    },
    {
      name: 'Raleway',
      description: 'Elegant geometric sans — Art Deco, minimal, premium',
      family: "'Raleway', sans-serif",
      weight: 300,
      import: 'Raleway:wght@300;400;600',
    },
  ]

  const googleFontsUrl =
    'https://fonts.googleapis.com/css2?' +
    fonts.map(f => `family=${f.import}`).join('&') +
    '&display=swap'

  return (
    <>
      <style>{`@import url('${googleFontsUrl}');`}</style>

      <div style={{
        minHeight: '100vh',
        background: '#0d1b2a',
        padding: '48px 24px 80px',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}>
        {/* Page header */}
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <p style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '0.18em',
            textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)',
            marginBottom: 12,
          }}>
            Hero Font Preview
          </p>
          <h1 style={{
            color: '#fff', fontSize: 28, fontWeight: 700,
            letterSpacing: '-0.02em', marginBottom: 8,
          }}>
            Pick Your Font
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14 }}>
            Each card shows your exact hero text in that font
          </p>
        </div>

        {/* Font cards */}
        <div style={{
          maxWidth: 900,
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}>
          {fonts.map((font, i) => (
            <div key={font.name} style={{
              position: 'relative',
              borderRadius: 12,
              overflow: 'hidden',
              background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
              border: '1px solid rgba(255,255,255,0.10)',
              padding: '52px 56px',
              marginBottom: 20,
            }}>
              {/* Font label */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12,
                marginBottom: 32,
              }}>
                <span style={{
                  background: 'rgba(37,99,235,0.9)',
                  color: '#fff',
                  fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  padding: '4px 10px', borderRadius: 4,
                }}>
                  Option {i + 1}
                </span>
                <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: 15, fontWeight: 600 }}>
                  {font.name}
                </span>
                <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>
                  — {font.description}
                </span>
              </div>

              {/* Eyebrow */}
              <p style={{
                fontSize: 11, fontWeight: 700, letterSpacing: '0.18em',
                textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)',
                marginBottom: 18,
                fontFamily: 'Inter, system-ui, sans-serif',
              }}>
                Virginia Beach &amp; Hampton Roads
              </p>

              {/* Headline */}
              <h2 style={{
                fontFamily: font.family,
                fontWeight: font.weight,
                fontSize: 'clamp(2rem, 4vw, 3.25rem)',
                color: '#fff',
                lineHeight: 1.1,
                letterSpacing: '-0.015em',
                marginBottom: 18,
              }}>
                Hampton Roads' Most Trusted<br />Real Estate Team
              </h2>

              {/* Divider */}
              <div style={{
                width: 40, height: 2,
                background: 'rgba(255,255,255,0.35)',
                borderRadius: 1,
                marginBottom: 18,
              }} />

              {/* Sub-headline */}
              <p style={{
                fontFamily: font.family,
                fontWeight: font.name === 'Raleway' ? 400 : font.weight,
                fontSize: 17,
                color: 'rgba(255,255,255,0.65)',
                lineHeight: 1.6,
                letterSpacing: font.name === 'Raleway' ? '0.04em' : '0.01em',
                marginBottom: 36,
              }}>
                Thousands of homes. Zero pressure. Always available.
              </p>

              {/* Buttons */}
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <div style={{
                  padding: '12px 28px',
                  background: '#2563eb',
                  color: '#fff',
                  borderRadius: 6,
                  fontSize: 13, fontWeight: 600, letterSpacing: '0.04em',
                  fontFamily: 'Inter, system-ui, sans-serif',
                  display: 'inline-block',
                }}>
                  View Properties
                </div>
                <div style={{
                  padding: '12px 28px',
                  background: 'rgba(255,255,255,0.08)',
                  color: '#fff',
                  border: '1.5px solid rgba(255,255,255,0.4)',
                  borderRadius: 6,
                  fontSize: 13, fontWeight: 600, letterSpacing: '0.04em',
                  fontFamily: 'Inter, system-ui, sans-serif',
                  display: 'inline-block',
                }}>
                  Search All New Homes
                </div>
              </div>
            </div>
          ))}
        </div>

        <p style={{
          textAlign: 'center', marginTop: 48,
          color: 'rgba(255,255,255,0.25)', fontSize: 12,
        }}>
          Tell Claude which option number you want and it will be applied to the hero.
        </p>
      </div>
    </>
  )
}
