'use client'
import { useState, useEffect, useRef } from 'react'
import { motion, useAnimation, useInView } from 'motion/react'
import { Star, Quote } from 'lucide-react'

export interface Testimonial {
  id: number
  name: string
  role: string
  company: string
  content: string
  rating: number
  avatar: string
}

export interface AnimatedTestimonialsProps {
  testimonials: Testimonial[]
  autoRotateInterval?: number
}

export function AnimatedTestimonials({
  testimonials,
  autoRotateInterval = 6000,
}: AnimatedTestimonialsProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const sectionRef = useRef(null)
  const isInView = useInView(sectionRef, { once: true, amount: 0.2 })
  const controls = useAnimation()

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.15 } },
  }
  const itemVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
  }

  useEffect(() => {
    if (isInView) controls.start('visible')
  }, [isInView, controls])

  useEffect(() => {
    if (autoRotateInterval <= 0 || testimonials.length <= 1) return
    const interval = setInterval(() => {
      setActiveIndex((c) => (c + 1) % testimonials.length)
    }, autoRotateInterval)
    return () => clearInterval(interval)
  }, [autoRotateInterval, testimonials.length])

  if (testimonials.length === 0) return null

  return (
    <section
      ref={sectionRef}
      style={{ padding: '96px 0', overflow: 'hidden', background: 'var(--off-white)' }}
    >
      <div className="container">
        <motion.div
          initial="hidden"
          animate={controls}
          variants={containerVariants}
          className="testimonials-grid"
        >
          {/* ── Left: heading + nav dots ── */}
          <motion.div
            variants={itemVariants}
            style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* Badge */}
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '6px 14px', borderRadius: 999, width: 'fit-content',
                background: 'rgba(37,99,235,0.08)', color: 'var(--accent)',
                fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
              }}>
                <Star size={11} fill="currentColor" />
                <span>Trusted by Hampton Roads Families</span>
              </div>

              {/* Heading */}
              <h2 style={{
                fontSize: 'clamp(28px, 3.5vw, 48px)', fontWeight: 800,
                letterSpacing: '-0.025em', lineHeight: 1.1, margin: 0,
              }}>
                What Our Clients Say
              </h2>

              {/* Subtitle */}
              <p style={{
                fontSize: 17, color: 'var(--text-secondary)',
                lineHeight: 1.75, maxWidth: 460, margin: 0,
              }}>
                Real stories from Hampton Roads families who bought, sold, and invested
                with the Legacy Home Team.
              </p>

              {/* Nav dots */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 8 }}>
                {testimonials.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveIndex(i)}
                    aria-label={`View testimonial ${i + 1}`}
                    style={{
                      height: 10, borderRadius: 999, border: 'none', cursor: 'pointer',
                      padding: 0, transition: 'width 0.35s ease, background 0.35s ease',
                      background: i === activeIndex ? 'var(--accent)' : 'rgba(136,136,132,0.28)',
                      width: i === activeIndex ? 40 : 10,
                    }}
                  />
                ))}
              </div>
            </div>
          </motion.div>

          {/* ── Right: rotating cards ── */}
          <motion.div
            variants={itemVariants}
            style={{ position: 'relative', minHeight: 400 }}
          >
            {testimonials.map((t, i) => (
              <motion.div
                key={t.id}
                style={{ position: 'absolute', inset: 0, zIndex: i === activeIndex ? 10 : 0 }}
                initial={{ opacity: 0, x: 80 }}
                animate={{
                  opacity: i === activeIndex ? 1 : 0,
                  x: i === activeIndex ? 0 : 80,
                  scale: i === activeIndex ? 1 : 0.96,
                }}
                transition={{ duration: 0.5, ease: 'easeInOut' }}
              >
                <div style={{
                  background: '#fff',
                  border: '1px solid var(--border)',
                  borderRadius: 20,
                  padding: '36px 32px',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: '0 8px 40px rgba(0,0,0,0.07)',
                }}>
                  {/* Stars */}
                  <div style={{ display: 'flex', gap: 4, marginBottom: 24 }}>
                    {Array(t.rating).fill(0).map((_, si) => (
                      <Star key={si} size={18} fill="#f59e0b" color="#f59e0b" />
                    ))}
                  </div>

                  {/* Quote block */}
                  <div style={{ position: 'relative', flex: 1, marginBottom: 24 }}>
                    <Quote
                      size={34}
                      style={{
                        position: 'absolute', top: -6, left: -6,
                        color: 'rgba(37,99,235,0.12)', transform: 'rotate(180deg)',
                      }}
                    />
                    <p style={{
                      position: 'relative', zIndex: 1,
                      fontSize: 16, fontWeight: 500, lineHeight: 1.8,
                      color: 'var(--text)', margin: 0,
                    }}>
                      &ldquo;{t.content}&rdquo;
                    </p>
                  </div>

                  {/* Divider */}
                  <div style={{ height: 1, background: 'var(--border)', marginBottom: 20 }} />

                  {/* Avatar + identity */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <img
                      src={t.avatar}
                      alt={t.name}
                      style={{
                        width: 48, height: 48, borderRadius: '50%',
                        objectFit: 'cover', border: '2px solid var(--border)',
                        flexShrink: 0,
                      }}
                    />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>
                        {t.name}
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
                        {t.role} &middot; {t.company}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Decorative corner accents */}
            <div style={{
              position: 'absolute', bottom: -20, left: -20,
              width: 80, height: 80, borderRadius: 14,
              background: 'rgba(37,99,235,0.05)', zIndex: 0,
            }} />
            <div style={{
              position: 'absolute', top: -20, right: -20,
              width: 80, height: 80, borderRadius: 14,
              background: 'rgba(37,99,235,0.05)', zIndex: 0,
            }} />
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
