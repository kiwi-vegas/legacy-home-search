'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const AVATAR_COUNT = 21
const COLS = 7
const ROWS = 3

function AvatarSprite({
  index,
  size = 64,
  selected = false,
  onClick,
}: {
  index: number
  size?: number
  selected?: boolean
  onClick?: () => void
}) {
  const col = index % COLS
  const row = Math.floor(index / COLS)
  return (
    <div
      onClick={onClick}
      title={`Avatar ${index + 1}`}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        cursor: onClick ? 'pointer' : 'default',
        backgroundImage: 'url(/avatars/grid.jpg)',
        backgroundSize: `${COLS * 100}% ${ROWS * 100}%`,
        backgroundPosition: `${(col / (COLS - 1)) * 100}% ${(row / (ROWS - 1)) * 100}%`,
        border: selected ? '3px solid #2563eb' : '3px solid #e0ddd8',
        boxShadow: selected ? '0 0 0 3px rgba(37,99,235,0.2)' : 'none',
        transition: 'border-color 0.15s, box-shadow 0.15s, transform 0.15s',
        transform: selected ? 'scale(1.1)' : 'scale(1)',
        flexShrink: 0,
        overflow: 'hidden',
      }}
    />
  )
}

export { AvatarSprite }

export default function AssistantSetupPage() {
  const [selected, setSelected] = useState<number | null>(null)
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const savedIndex = localStorage.getItem('assistant_avatar')
    const savedName = localStorage.getItem('assistant_name')
    if (savedIndex !== null) setSelected(Number(savedIndex))
    if (savedName) setName(savedName)
  }, [])

  function handleSave() {
    if (selected === null || !name.trim()) return
    setSaving(true)
    localStorage.setItem('assistant_avatar', String(selected))
    localStorage.setItem('assistant_name', name.trim())
    router.push('/admin/assistant')
  }

  const canSave = selected !== null && name.trim().length > 0

  return (
    <div style={{
      minHeight: '100vh', background: '#f8f7f4', fontFamily: 'Inter, system-ui, sans-serif',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '40px 24px',
    }}>
      <div style={{ width: '100%', maxWidth: '580px' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div style={{ color: '#2563eb', fontSize: '11px', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '14px' }}>
            Legacy Home Search
          </div>
          <h1 style={{ color: '#1a1a1a', fontSize: '26px', fontWeight: '700', margin: '0 0 10px' }}>
            Meet Your Assistant
          </h1>
          <p style={{ color: '#555550', fontSize: '14px', lineHeight: '1.7', margin: 0 }}>
            Choose a face, give them a name, and they&apos;ll be ready to help<br />update your site whenever you need.
          </p>
        </div>

        {/* Avatar grid */}
        <div style={{
          background: '#ffffff', border: '1px solid #e0ddd8',
          borderRadius: '12px', padding: '28px', marginBottom: '20px',
        }}>
          <p style={{ color: '#888884', fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', margin: '0 0 20px' }}>
            Choose an avatar
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '14px', justifyItems: 'center' }}>
            {Array.from({ length: AVATAR_COUNT }, (_, i) => (
              <AvatarSprite
                key={i}
                index={i}
                size={62}
                selected={selected === i}
                onClick={() => setSelected(i)}
              />
            ))}
          </div>
        </div>

        {/* Name input */}
        <div style={{
          background: '#ffffff', border: '1px solid #e0ddd8',
          borderRadius: '12px', padding: '24px', marginBottom: '20px',
        }}>
          <p style={{ color: '#888884', fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', margin: '0 0 12px' }}>
            Name your assistant
          </p>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && canSave) handleSave() }}
            placeholder="e.g. Alex, Jordan, Riley..."
            maxLength={20}
            autoFocus
            style={{
              width: '100%', padding: '14px 16px',
              background: '#f8f7f4', border: '1.5px solid #e0ddd8',
              borderRadius: '8px', color: '#1a1a1a', fontSize: '16px',
              outline: 'none', boxSizing: 'border-box',
              fontFamily: 'Inter, system-ui, sans-serif',
            }}
          />
        </div>

        {/* Preview */}
        {selected !== null && name.trim() && (
          <div style={{
            background: '#ffffff', border: '1px solid #e0ddd8',
            borderRadius: '12px', padding: '18px 24px', marginBottom: '20px',
            display: 'flex', alignItems: 'center', gap: '16px',
          }}>
            <AvatarSprite index={selected} size={52} />
            <div>
              <div style={{ color: '#2563eb', fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '4px' }}>
                Preview
              </div>
              <div style={{ color: '#1a1a1a', fontSize: '16px', fontWeight: '700' }}>{name}</div>
              <div style={{ color: '#888884', fontSize: '13px' }}>Your content assistant</div>
            </div>
            <div style={{ marginLeft: 'auto', color: '#888884', fontSize: '13px', fontStyle: 'italic' }}>
              Looks great!
            </div>
          </div>
        )}

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={!canSave || saving}
          style={{
            width: '100%', padding: '16px',
            background: canSave ? '#2563eb' : '#e5e3de',
            border: 'none', borderRadius: '8px',
            color: canSave ? '#ffffff' : '#888884',
            fontSize: '15px', fontWeight: '700',
            cursor: canSave && !saving ? 'pointer' : 'not-allowed',
            transition: 'background 0.2s, color 0.2s',
            letterSpacing: '0.02em',
          }}
        >
          {saving ? 'Saving...' : selected === null ? 'Select an avatar to continue' : !name.trim() ? 'Enter a name to continue' : `Start chatting with ${name} \u2192`}
        </button>

      </div>
    </div>
  )
}
