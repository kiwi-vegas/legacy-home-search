'use client'
import React from 'react'
import { motion } from 'motion/react'

export type Testimonial = {
  text: string
  image: string
  name: string
  role: string
}

export const TestimonialsColumn = ({
  testimonials,
  duration = 15,
  className,
}: {
  testimonials: Testimonial[]
  duration?: number
  className?: string
}) => {
  return (
    <div className={className} style={{ overflow: 'hidden', flexShrink: 0, width: 300 }}>
      <motion.div
        animate={{ translateY: '-50%' }}
        transition={{
          duration,
          repeat: Infinity,
          ease: 'linear',
          repeatType: 'loop',
        }}
        style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 20 }}
      >
        {[...Array(2)].map((_, idx) => (
          <React.Fragment key={idx}>
            {testimonials.map((t, i) => (
              <div
                key={i}
                style={{
                  padding: '24px 22px',
                  borderRadius: 20,
                  border: '1px solid var(--border)',
                  boxShadow: '0 4px 20px rgba(37,99,235,0.07)',
                  background: '#fff',
                  width: '100%',
                }}
              >
                <p style={{ fontSize: 14, lineHeight: 1.75, color: 'var(--text-secondary)', margin: '0 0 20px' }}>
                  &ldquo;{t.text}&rdquo;
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <img
                    src={t.image}
                    alt={t.name}
                    width={40}
                    height={40}
                    style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                  />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)', lineHeight: 1.3 }}>{t.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </React.Fragment>
        ))}
      </motion.div>
    </div>
  )
}
