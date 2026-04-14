'use client'
import { motion } from 'motion/react'

const logos = [
  { src: '/News/3wtkr.jpg',             alt: 'WTKR News 3' },
  { src: '/News/Inman.png',             alt: 'Inman' },
  { src: '/News/daily%20press.png',     alt: 'Daily Press' },
  { src: '/News/virginia-pilot.jpg',    alt: 'The Virginian-Pilot' },
  { src: '/News/wavy10.png',            alt: 'WAVY 10' },
]

export default function LogoBar() {
  return (
    <section style={{
      background: '#fff',
      borderTop: '1px solid var(--border)',
      borderBottom: '1px solid var(--border)',
      padding: '40px 0',
    }}>
      <div className="container">
        {/* Label */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          viewport={{ once: true }}
          style={{
            textAlign: 'center',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
            marginBottom: 32,
          }}
        >
          As Featured In
        </motion.p>

        {/* Logos */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexWrap: 'wrap',
          gap: '24px 48px',
        }}>
          {logos.map((logo, i) => (
            <motion.div
              key={logo.src}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1, ease: 'easeOut' }}
              viewport={{ once: true }}
            >
              {/* CSS hover handled via className so filter transition works */}
              <img
                src={logo.src}
                alt={logo.alt}
                className="logo-bar-img"
                style={{ height: 36, width: 'auto', maxWidth: 130, objectFit: 'contain', display: 'block' }}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
