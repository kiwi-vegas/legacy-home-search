'use client'

import Link from 'next/link'

const STEPS = [
  { key: 'ideas',    label: 'Idea Review',  path: '/admin/idea-review', num: 1 },
  { key: 'va-queue', label: 'Media Queue',  path: '/admin/va-queue',    num: 2 },
] as const

type Step = (typeof STEPS)[number]['key']

export function AdminWorkflowNav({ current, secret }: { current: Step; secret: string }) {
  return (
    <div style={{
      background: '#1E3A5F',
      padding: '0 24px',
      display: 'flex',
      alignItems: 'stretch',
      borderBottom: '1px solid rgba(255,255,255,0.08)',
    }}>
      <span style={{
        fontSize: 11, color: 'rgba(255,255,255,0.35)',
        letterSpacing: '0.14em', textTransform: 'uppercase',
        alignSelf: 'center', marginRight: 28, flexShrink: 0,
      }}>
        Legacy Home Team
      </span>

      {STEPS.map((s, i) => (
        <span key={s.key} style={{ display: 'flex', alignItems: 'stretch' }}>
          {i > 0 && (
            <span style={{
              alignSelf: 'center', color: 'rgba(255,255,255,0.18)',
              fontSize: 18, margin: '0 2px', userSelect: 'none',
            }}>›</span>
          )}
          <Link
            href={`${s.path}?secret=${encodeURIComponent(secret)}`}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '0 14px', height: 48,
              color: current === s.key ? '#fff' : 'rgba(255,255,255,0.42)',
              fontWeight: current === s.key ? 700 : 400,
              fontSize: 13, textDecoration: 'none',
              borderBottom: current === s.key ? '2px solid #60a5fa' : '2px solid transparent',
              transition: 'color 0.15s',
            }}
          >
            <span style={{
              width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
              background: current === s.key ? '#60a5fa' : 'rgba(255,255,255,0.12)',
              color: current === s.key ? '#1E3A5F' : 'rgba(255,255,255,0.45)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, fontWeight: 800,
            }}>
              {s.num}
            </span>
            {s.label}
          </Link>
        </span>
      ))}

      <a
        href="/blog"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          marginLeft: 'auto', alignSelf: 'center',
          color: 'rgba(255,255,255,0.28)', fontSize: 12, textDecoration: 'none',
        }}
      >
        View Blog →
      </a>
    </div>
  )
}
