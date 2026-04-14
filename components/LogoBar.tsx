'use client'
import { motion } from 'motion/react'

const logos = [
  { src: '/News/3wtkr.jpg',              alt: 'WTKR News 3' },
  { src: '/News/Inman.png',              alt: 'Inman' },
  { src: '/News/daily%20press.png',      alt: 'Daily Press' },
  { src: '/News/virginia-pilot.jpg',     alt: 'The Virginian-Pilot' },
  { src: '/News/wavy10.png',             alt: 'WAVY 10' },
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
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true }}
          style={{
            textAlign: 'center',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
            marginBottom: 28,
          }}
        >
          As Featured In
        </motion.p>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexWrap: 'wrap',
          gap: '32px 52px',
        }}>
          {logos.map((logo, i) => (
            <motion.img
              key={logo.src}
              src={logo.src}
              alt={logo.alt}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 0.45, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
              viewport={{ once: true }}
              whileHover={{ opacity: 1 }}
              style={{
                height: 36,
                width: 'auto',
                maxWidth: 120,
                objectFit: 'contain',
                filter: 'grayscale(100%)',
                cursor: 'default',
              }}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
