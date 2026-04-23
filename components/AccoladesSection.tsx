'use client'
import { useEffect, useRef, useState } from 'react'

const DEFAULT_ACCOLADES = [
  { num: 500, prefix: '', suffix: '+', label: 'Families Helped' },
  { num: 300, prefix: '$', suffix: 'M+', label: 'In Transactions' },
  { num: 10, prefix: '', suffix: '+', label: 'Years in Hampton Roads' },
  { num: 5, prefix: '', suffix: '★', label: 'Average Rating' },
]

function parseStatValue(value: string): { prefix: string; num: number; suffix: string } | null {
  const match = value.trim().match(/^([^\d]*)(\d+(?:\.\d+)?)(.*)$/)
  if (!match) return null
  const num = parseFloat(match[2])
  if (isNaN(num)) return null
  return { prefix: match[1], num, suffix: match[3] }
}

function CountUp({ target, prefix = '', suffix = '', duration = 2200, visible, hoverTrigger = 0 }: {
  target: number
  prefix?: string
  suffix?: string
  duration?: number
  visible: boolean
  hoverTrigger?: number
}) {
  const [count, setCount] = useState(0)
  const scrollFiredRef = useRef(false)
  const rafRef = useRef<number | null>(null)

  const runAnimation = (d: number) => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    const start = performance.now()
    const tick = (now: number) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / d, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.floor(eased * target))
      if (progress < 1) rafRef.current = requestAnimationFrame(tick)
      else { setCount(target); rafRef.current = null }
    }
    rafRef.current = requestAnimationFrame(tick)
  }

  useEffect(() => {
    if (!visible || scrollFiredRef.current) return
    scrollFiredRef.current = true
    runAnimation(duration)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible])

  useEffect(() => {
    if (hoverTrigger === 0) return
    runAnimation(700)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hoverTrigger])

  return <>{prefix}{count}{suffix}</>
}

export default function AccoladesSection({ cmsStats }: { cmsStats?: Array<{ value: string; label: string }> }) {
  const [visible, setVisible] = useState(false)
  const [hoverTriggers, setHoverTriggers] = useState<number[]>([0, 0, 0, 0])
  const sectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true) },
      { threshold: 0.05 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  let accolades = DEFAULT_ACCOLADES as Array<{ num: number; prefix: string; suffix: string; label: string }>
  if (cmsStats && cmsStats.length > 0) {
    const parsed = cmsStats
      .map(s => {
        const p = parseStatValue(s.value)
        if (!p) return null
        return { num: p.num, prefix: p.prefix, suffix: p.suffix, label: s.label }
      })
      .filter((x): x is NonNullable<typeof x> => x !== null)
    if (parsed.length > 0) accolades = parsed
  }

  const cols = 2
  const lastRowStart = Math.floor((accolades.length - 1) / cols) * cols

  return (
    <div ref={sectionRef} style={{ position: 'relative', overflow: 'hidden', padding: '88px 24px' }}>
      {/* Background photo */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'url(/community-photos/virginia-beach/Virginia_Beach2_cinematic.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center 30%',
      }} />
      {/* Dark overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'rgba(5, 11, 20, 0.87)',
      }} />

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 2, maxWidth: 1000, margin: '0 auto' }}>

        {/* Heading */}
        <p style={{
          fontFamily: "'Marcellus', serif",
          fontSize: 11,
          letterSpacing: '0.44em',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.40)',
          textAlign: 'center',
          marginBottom: 72,
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(20px)',
          transition: 'opacity 0.9s ease 0.1s, transform 0.9s ease 0.1s',
          willChange: 'opacity, transform',
        }}>
          Team Accolades
        </p>

        {/* Stat grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)' }}>
          {accolades.map((a, i) => {
            const isLeft = i % cols === 0
            const isLastRow = i >= lastRowStart
            const delay = `${i * 0.13}s`

            return (
              <div
                key={i}
                onMouseEnter={() => setHoverTriggers(prev => {
                  const next = [...prev]
                  next[i] = (next[i] ?? 0) + 1
                  return next
                })}
                style={{
                  padding: 'clamp(36px, 5vw, 60px) clamp(24px, 5vw, 56px)',
                  textAlign: 'center',
                  cursor: 'default',
                  borderRight: isLeft ? '1px solid rgba(255,255,255,0.10)' : 'none',
                  borderBottom: !isLastRow ? '1px solid rgba(255,255,255,0.10)' : 'none',
                  opacity: visible ? 1 : 0,
                  transform: visible ? 'translateY(0)' : 'translateY(48px)',
                  transition: `opacity 1s ease ${delay}, transform 1s cubic-bezier(0.16, 1, 0.3, 1) ${delay}`,
                  willChange: 'opacity, transform',
                }}
              >
                <div style={{
                  fontFamily: "'Marcellus', serif",
                  fontSize: 'clamp(2.6rem, 5.5vw, 4.2rem)',
                  fontWeight: 400,
                  color: '#fff',
                  letterSpacing: '0.04em',
                  lineHeight: 1,
                  marginBottom: 20,
                }}>
                  <CountUp target={a.num} prefix={a.prefix} suffix={a.suffix} visible={visible} hoverTrigger={hoverTriggers[i] ?? 0} />
                </div>
                <div style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 11,
                  letterSpacing: '0.24em',
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.50)',
                  fontWeight: 500,
                  lineHeight: 1.5,
                }}>
                  {a.label}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
