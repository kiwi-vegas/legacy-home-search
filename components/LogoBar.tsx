'use client'
import { motion } from 'motion/react'
import Image from 'next/image'

const logos = [
  { src: '/News/3wtkr.jpg',           alt: 'WTKR News 3' },
  { src: '/News/Inman.png',           alt: 'Inman' },
  { src: '/News/daily press.png',     alt: 'Daily Press' },
  { src: '/News/virginia-pilot.jpg',  alt: 'The Virginian-Pilot' },
  { src: '/News/wavy10.png',          alt: 'WAVY 10' },
]

export default function LogoBar() {
  return (
    <section style={{
      background: '#fff',
      borderTop: '1px solid var(--border)',
      borderBottom: '1px solid var(--border)',
      padding: '36px 0',
    }}>
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true }}
        >
          <p style={{
            textAlign: 'center',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
            marginBottom: 28,
          }}>
            As Featured In
          </p>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: '40px 56px',
          }}>
            {logos.map((logo, i) => (
              <motion.div
                key={logo.src}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                viewport={{ once: true }}
                style={{
                  position: 'relative',
                  height: 36,
                  width: 120,
                  filter: 'grayscale(100%)',
                  opacity: 0.5,
                  transition: 'filter 0.3s ease, opacity 0.3s ease',
                }}
                whileHover={{ filter: 'grayscale(0%)', opacity: 1 } as any}
              >
                <Image
                  src={logo.src}
                  alt={logo.alt}
                  fill
                  sizes="120px"
                  style={{ objectFit: 'contain' }}
                />
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
