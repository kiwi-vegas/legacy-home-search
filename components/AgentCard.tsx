'use client'
import Link from 'next/link'
import { useState } from 'react'

type Agent = {
  slug: string
  name: string
  title: string
  phone: string
  email: string
  photo: string
  bio: string
}

export default function AgentCard({ agent }: { agent: Agent }) {
  const [hovered, setHovered] = useState(false)

  return (
    <Link href={`/team/${agent.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background: '#fff',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-xl)',
          overflow: 'hidden',
          cursor: 'pointer',
          transition: 'box-shadow 0.2s, transform 0.2s',
          boxShadow: hovered ? '0 8px 32px rgba(0,0,0,0.12)' : 'none',
          transform: hovered ? 'translateY(-4px)' : 'none',
        }}
      >
        {/* Headshot */}
        <div style={{ aspectRatio: '4/3', overflow: 'hidden', background: 'var(--light-gray)' }}>
          <img
            src={agent.photo}
            alt={agent.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }}
          />
        </div>

        {/* Info */}
        <div style={{ padding: '24px 24px 28px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 6 }}>
            {agent.title}
          </div>
          <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 10, color: 'var(--text)' }}>
            {agent.name}
          </h3>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.65, marginBottom: 20 }}>
            {agent.bio.slice(0, 110)}…
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <a
              href={`tel:+1${agent.phone.replace(/\D/g, '')}`}
              onClick={e => e.preventDefault()}
              style={{ fontSize: 13, color: 'var(--text-secondary)', textDecoration: 'none' }}
            >
              📞 {agent.phone}
            </a>
            <a
              href={`mailto:${agent.email}`}
              onClick={e => e.preventDefault()}
              style={{ fontSize: 13, color: 'var(--text-secondary)', textDecoration: 'none' }}
            >
              ✉️ {agent.email}
            </a>
          </div>
          <div style={{ marginTop: 20, fontSize: 13, fontWeight: 600, color: 'var(--accent)' }}>
            View Profile →
          </div>
        </div>
      </div>
    </Link>
  )
}
