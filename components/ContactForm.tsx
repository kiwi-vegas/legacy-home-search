'use client'
import { useState } from 'react'

type Status = 'idle' | 'submitting' | 'success' | 'error'

export default function ContactForm() {
  const [status, setStatus] = useState<Status>('idle')
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    interest: 'Buy a home',
    message: '',
  })

  function set(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(prev => ({ ...prev, [field]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('submitting')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error('Failed')
      setStatus('success')
      setForm({ firstName: '', lastName: '', email: '', phone: '', interest: 'Buy a home', message: '' })
    } catch {
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div style={{
        background: 'var(--off-white)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-xl)',
        padding: '48px 32px',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>✓</div>
        <h3 style={{ marginBottom: 12, color: 'var(--accent)' }}>Message Sent!</h3>
        <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.7 }}>
          Barry received your message and will get back to you within a few hours.
        </p>
        <button
          onClick={() => setStatus('idle')}
          style={{ background: 'none', border: 'none', color: 'var(--accent)', fontWeight: 700, fontSize: 14, cursor: 'pointer', textDecoration: 'underline' }}
        >
          Send another message
        </button>
      </div>
    )
  }

  return (
    <div style={{
      background: 'var(--off-white)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-xl)',
      padding: '36px 32px',
    }}>
      <h3 style={{ marginBottom: 24 }}>Send Barry a Message</h3>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="contact-name-row">
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">First Name *</label>
            <input className="form-input" type="text" placeholder="Jane" required value={form.firstName} onChange={set('firstName')} />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Last Name</label>
            <input className="form-input" type="text" placeholder="Smith" value={form.lastName} onChange={set('lastName')} />
          </div>
        </div>
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label">Email *</label>
          <input className="form-input" type="email" placeholder="jane@example.com" required value={form.email} onChange={set('email')} />
        </div>
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label">Phone</label>
          <input className="form-input" type="tel" placeholder="(757) 555-0000" value={form.phone} onChange={set('phone')} />
        </div>
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label">I&apos;m looking to…</label>
          <select className="form-input" style={{ cursor: 'pointer' }} value={form.interest} onChange={set('interest')}>
            <option>Buy a home</option>
            <option>Sell my home</option>
            <option>Buy and sell</option>
            <option>Get a home valuation</option>
            <option>Just exploring</option>
          </select>
        </div>
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label">Message *</label>
          <textarea
            className="form-input"
            rows={4}
            placeholder="Tell Barry a bit about what you're looking for…"
            style={{ resize: 'vertical' }}
            required
            value={form.message}
            onChange={set('message')}
          />
        </div>

        {status === 'error' && (
          <p style={{ fontSize: 13, color: '#dc2626', margin: 0 }}>
            Something went wrong — please try again or call <a href="tel:+17578164037" style={{ color: '#dc2626' }}>(757) 816-4037</a>.
          </p>
        )}

        <button
          type="submit"
          disabled={status === 'submitting'}
          className="btn-primary"
          style={{ justifyContent: 'center', opacity: status === 'submitting' ? 0.7 : 1, cursor: status === 'submitting' ? 'not-allowed' : 'pointer' }}
        >
          {status === 'submitting' ? 'Sending…' : 'Send Message'}
        </button>
      </form>
    </div>
  )
}
