'use client'
import { useState } from 'react'

const CITIES = ['Virginia Beach', 'Chesapeake', 'Norfolk', 'Suffolk', 'Hampton', 'Newport News']

export default function AgentHeroSearchBar({ subdomain }: { subdomain: string }) {
  const [query, setQuery] = useState('')

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const q = query.trim() || 'Virginia Beach'
    window.open(
      `${subdomain}/search?s[locations][0][city]=${encodeURIComponent(q)}&s[locations][0][state]=VA`,
      '_blank'
    )
  }

  return (
    <div>
      <form onSubmit={handleSearch} style={{ display: 'flex', maxWidth: 560, marginBottom: 20 }}>
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="City, neighborhood, or ZIP…"
          style={{
            flex: 1,
            padding: '17px 22px',
            fontSize: 15,
            border: 'none',
            borderRadius: '8px 0 0 8px',
            outline: 'none',
            background: '#fff',
            color: '#1a1a1a',
            boxShadow: '0 4px 28px rgba(0,0,0,0.22)',
          }}
        />
        <button
          type="submit"
          style={{
            padding: '17px 28px',
            background: '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: '0 8px 8px 0',
            fontSize: 15,
            fontWeight: 700,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            boxShadow: '0 4px 28px rgba(37,99,235,0.35)',
          }}
        >
          Search →
        </button>
      </form>

      {/* Quick city links */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {CITIES.map(city => (
          <a
            key={city}
            href={`${subdomain}/search?s[locations][0][city]=${encodeURIComponent(city)}&s[locations][0][state]=VA`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: '6px 15px',
              border: '1px solid rgba(255,255,255,0.22)',
              borderRadius: 99,
              color: 'rgba(255,255,255,0.72)',
              fontSize: 12,
              fontWeight: 600,
              textDecoration: 'none',
              transition: 'border-color 0.15s, color 0.15s',
              letterSpacing: '0.02em',
            }}
          >
            {city}
          </a>
        ))}
      </div>
    </div>
  )
}
