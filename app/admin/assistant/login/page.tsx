'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AssistantLoginPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/assistant/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (res.ok) {
        const hasAvatar = localStorage.getItem('assistant_avatar')
        router.push(hasAvatar ? '/admin/assistant' : '/admin/assistant/setup')
      } else {
        setError('Incorrect password. Please try again.')
      }
    } catch {
      setError('Connection error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#f8f7f4', fontFamily: 'Inter, system-ui, sans-serif',
    }}>
      <div style={{
        width: '100%', maxWidth: '400px', padding: '48px 40px',
        background: '#ffffff', border: '1px solid #e0ddd8',
        borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ color: '#2563eb', fontSize: '13px', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '12px' }}>
            Legacy Home Search
          </div>
          <h1 style={{ color: '#1a1a1a', fontSize: '22px', fontWeight: '600', margin: 0 }}>
            Content Assistant
          </h1>
          <p style={{ color: '#888884', fontSize: '14px', marginTop: '8px' }}>
            Sign in to manage your site content
          </p>
        </div>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{
              width: '100%', padding: '14px 16px', marginBottom: '16px',
              background: '#f8f7f4', border: '1.5px solid #e0ddd8',
              borderRadius: '8px', color: '#1a1a1a', fontSize: '15px',
              outline: 'none', boxSizing: 'border-box', fontFamily: 'Inter, system-ui, sans-serif',
            }}
          />
          {error && (
            <p style={{ color: '#dc2626', fontSize: '13px', marginBottom: '16px', marginTop: '-8px' }}>
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '14px', background: '#2563eb',
              border: 'none', borderRadius: '8px', color: '#ffffff',
              fontSize: '15px', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}
