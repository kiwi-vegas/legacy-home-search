'use client'
import { useEffect, useRef, useState } from 'react'

const DEFAULT_STATS = [
  { num: 500, suffix: '+', label: 'Families Helped' },
  { num: 300, prefix: '$', suffix: 'M+', label: 'In Transactions' },
  { num: 10, suffix: '+', label: 'Years in Hampton Roads' },
  { num: 5, suffix: '★', label: 'Average Rating' },
]

// Parse a formatted stat string like "25+", "$300M+", "5★" into parts
function parseStatValue(value: string): { prefix: string; num: number; suffix: string } | null {
  const match = value.trim().match(/^([^\d]*)(\d+(?:\.\d+)?)(.*)$/)
  if (!match) return null
  const num = parseFloat(match[2])
  if (isNaN(num)) return null
  return { prefix: match[1], num, suffix: match[3] }
}

function CountUp({ target, prefix = '', suffix = '', duration = 1800 }: {
  target: number
  prefix?: string
  suffix?: string
  duration?: number
}) {
  const [count, setCount] = useState(0)
  const [started, setStarted] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStarted(true) },
      { threshold: 0.5 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!started) return
    const start = performance.now()
    const tick = (now: number) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.floor(eased * target))
      if (progress < 1) requestAnimationFrame(tick)
      else setCount(target)
    }
    requestAnimationFrame(tick)
  }, [started, target, duration])

  return (
    <div ref={ref} className="stat-num">
      {prefix}{count}{suffix}
    </div>
  )
}

export default function StatsBar({ cmsStats }: { cmsStats?: Array<{ value: string; label: string }> }) {
  const stats = cmsStats && cmsStats.length > 0 ? cmsStats : null

  if (stats) {
    return (
      <div className="stats-bar">
        <div className="container">
          <div className="stats-grid">
            {stats.map((s) => {
              const parsed = parseStatValue(s.value)
              return (
                <div key={s.label} className="stat-item">
                  {parsed ? (
                    <CountUp target={parsed.num} prefix={parsed.prefix} suffix={parsed.suffix} />
                  ) : (
                    <div className="stat-num">{s.value}</div>
                  )}
                  <div className="stat-lbl">{s.label}</div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="stats-bar">
      <div className="container">
        <div className="stats-grid">
          {DEFAULT_STATS.map((s) => (
            <div key={s.label} className="stat-item">
              <CountUp target={s.num} prefix={s.prefix} suffix={s.suffix} />
              <div className="stat-lbl">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
