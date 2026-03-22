'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const COLS = 7
const ROWS = 3

function AvatarSprite({ index, size = 36 }: { index: number; size?: number }) {
  const col = index % COLS
  const row = Math.floor(index / COLS)
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      backgroundImage: 'url(/avatars/grid.jpg)',
      backgroundSize: `${COLS * 100}% ${ROWS * 100}%`,
      backgroundPosition: `${(col / (COLS - 1)) * 100}% ${(row / (ROWS - 1)) * 100}%`,
      overflow: 'hidden',
    }} />
  )
}

type DisplayMessage = { role: 'user' | 'assistant'; text: string; imagePreview?: string }

export default function AssistantPage() {
  const [avatarIndex, setAvatarIndex] = useState<number | null>(null)
  const [assistantName, setAssistantName] = useState('Assistant')
  const [displayMessages, setDisplayMessages] = useState<DisplayMessage[]>([])
  const [apiMessages, setApiMessages] = useState<any[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingHasImage, setLoadingHasImage] = useState(false)
  const [pendingImage, setPendingImage] = useState<{ base64: string; mimeType: string; preview: string } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    const savedIndex = localStorage.getItem('assistant_avatar')
    const savedName = localStorage.getItem('assistant_name')
    const name = savedName ?? 'Assistant'
    if (savedIndex !== null) setAvatarIndex(Number(savedIndex))
    setAssistantName(name)
    setDisplayMessages([{
      role: 'assistant',
      text: `Hi! I'm ${name}, here to help you update your website. You can tell me things like:\n\n• "Change the drive time to the airport to 15 minutes"\n• "Update the median home price to $520,000"\n• "Change the hero headline on the downtown page"\n• "The hero image needs to change" (attach an image)\n\nWhat would you like to update?`,
    }])
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [displayMessages, loading])

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      const img = new Image()
      img.onload = () => {
        const MAX = 1200
        let { width, height } = img
        if (width > MAX || height > MAX) {
          if (width > height) { height = Math.round((height * MAX) / width); width = MAX }
          else { width = Math.round((width * MAX) / height); height = MAX }
        }
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        canvas.getContext('2d')!.drawImage(img, 0, 0, width, height)
        const resized = canvas.toDataURL('image/jpeg', 0.85)
        setPendingImage({ base64: resized.split(',')[1], mimeType: 'image/jpeg', preview: resized })
      }
      img.src = dataUrl
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  async function handleSend() {
    if (!input.trim() && !pendingImage) return
    const userText = input.trim()
    setInput('')

    const displayMsg: DisplayMessage = {
      role: 'user',
      text: userText || '(image attached)',
      imagePreview: pendingImage?.preview,
    }
    setDisplayMessages((prev) => [...prev, displayMsg])

    let newApiMessage: any
    if (pendingImage) {
      newApiMessage = {
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: pendingImage.mimeType, data: pendingImage.base64 } },
          ...(userText ? [{ type: 'text', text: userText }] : []),
        ],
      }
    } else {
      newApiMessage = { role: 'user', content: userText }
    }

    const newApiMessages = [...apiMessages, newApiMessage]
    const hadImage = !!pendingImage
    setPendingImage(null)
    setLoading(true)
    setLoadingHasImage(hadImage)

    try {
      const res = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newApiMessages }),
      })
      const data = await res.json()
      if (data.reply) {
        setDisplayMessages((prev) => [...prev, { role: 'assistant', text: data.reply }])
        setApiMessages(data.messages ?? newApiMessages)
      } else {
        setDisplayMessages((prev) => [...prev, { role: 'assistant', text: 'Something went wrong. Please try again.' }])
      }
    } catch {
      setDisplayMessages((prev) => [...prev, { role: 'assistant', text: 'Connection error. Please try again.' }])
    } finally {
      setLoading(false)
      setLoadingHasImage(false)
    }
  }

  async function handleLogout() {
    await fetch('/api/assistant/auth', { method: 'DELETE' })
    router.push('/admin/assistant/login')
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f8f7f4', fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* Header */}
      <div style={{
        padding: '14px 24px', borderBottom: '1px solid #e0ddd8',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#ffffff',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {avatarIndex !== null && (
            <div style={{ position: 'relative' }}>
              <AvatarSprite index={avatarIndex} size={42} />
              <div style={{
                position: 'absolute', bottom: 0, right: 0,
                width: '11px', height: '11px', borderRadius: '50%',
                background: '#16a34a', border: '2px solid #ffffff',
              }} />
            </div>
          )}
          <div>
            <div style={{ color: '#888884', fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase' }}>
              Legacy Home Search
            </div>
            <div style={{ color: '#1a1a1a', fontSize: '16px', fontWeight: '700', lineHeight: '1.2' }}>
              {assistantName}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={() => router.push('/admin/assistant/setup')}
            title="Change avatar or name"
            style={{
              background: 'none', border: '1px solid #e0ddd8',
              color: '#888884', padding: '7px 12px',
              borderRadius: '6px', cursor: 'pointer', fontSize: '14px',
            }}
          >
            Settings
          </button>
          <button
            onClick={handleLogout}
            style={{
              background: 'none', border: '1px solid #e0ddd8',
              color: '#888884', padding: '7px 14px',
              borderRadius: '6px', cursor: 'pointer', fontSize: '13px',
            }}
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 24px 8px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {displayMessages.map((msg, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: '10px' }}>
            {msg.role === 'assistant' && avatarIndex !== null && (
              <AvatarSprite index={avatarIndex} size={32} />
            )}
            {msg.role === 'assistant' && avatarIndex === null && (
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#eff6ff', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', color: '#2563eb' }}>
                A
              </div>
            )}
            <div style={{
              maxWidth: '72%', padding: '13px 17px',
              borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
              background: msg.role === 'user' ? '#2563eb' : '#ffffff',
              color: msg.role === 'user' ? '#fff' : '#1a1a1a',
              border: msg.role === 'assistant' ? '1px solid #e0ddd8' : 'none',
              fontSize: '14px', lineHeight: '1.65', whiteSpace: 'pre-wrap',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}>
              {msg.imagePreview && (
                <img src={msg.imagePreview} alt="uploaded" style={{ maxWidth: '200px', borderRadius: '8px', marginBottom: '8px', display: 'block' }} />
              )}
              {msg.text}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px' }}>
            {avatarIndex !== null
              ? <AvatarSprite index={avatarIndex} size={32} />
              : <div style={{ width: 32, height: 32 }} />
            }
            <div style={{
              padding: '13px 17px', borderRadius: '18px 18px 18px 4px',
              background: '#ffffff', border: '1px solid #e0ddd8',
              fontSize: '14px', display: 'flex', gap: '8px', alignItems: 'center',
            }}>
              {[0, 1, 2].map((n) => (
                <div key={n} style={{
                  width: 6, height: 6, borderRadius: '50%', background: '#2563eb',
                  opacity: 0.4,
                  animation: `pulse 1.2s ease-in-out ${n * 0.2}s infinite`,
                }} />
              ))}
              {loadingHasImage && (
                <span style={{ color: '#888884', fontSize: '12px', marginLeft: '4px' }}>
                  Uploading image...
                </span>
              )}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Image preview */}
      {pendingImage && (
        <div style={{ padding: '12px 24px', borderTop: '1px solid #e0ddd8', display: 'flex', alignItems: 'center', gap: '12px', background: '#ffffff' }}>
          <img src={pendingImage.preview} alt="pending" style={{ height: '48px', borderRadius: '6px' }} />
          <span style={{ color: '#555550', fontSize: '13px' }}>Image attached</span>
          <button onClick={() => setPendingImage(null)} style={{ background: 'none', border: 'none', color: '#888884', cursor: 'pointer', fontSize: '20px', marginLeft: 'auto', lineHeight: 1 }}>x</button>
        </div>
      )}

      {/* Input */}
      <div style={{ padding: '16px 24px', borderTop: '1px solid #e0ddd8', display: 'flex', gap: '10px', alignItems: 'flex-end', background: '#ffffff' }}>
        <input type="file" ref={fileRef} accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
        <button
          onClick={() => fileRef.current?.click()}
          style={{ background: '#f1f0ed', border: '1px solid #e0ddd8', color: '#555550', width: '44px', height: '44px', borderRadius: '8px', cursor: 'pointer', fontSize: '18px', flexShrink: 0 }}
        >
          +
        </button>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
          placeholder={`Message ${assistantName}...`}
          rows={1}
          style={{
            flex: 1, padding: '12px 16px',
            background: '#f8f7f4', border: '1px solid #e0ddd8',
            borderRadius: '8px', color: '#1a1a1a', fontSize: '14px',
            resize: 'none', outline: 'none', lineHeight: '1.5',
            maxHeight: '120px', overflowY: 'auto',
            fontFamily: 'Inter, system-ui, sans-serif',
          }}
        />
        <button
          onClick={handleSend}
          disabled={loading || (!input.trim() && !pendingImage)}
          style={{
            background: '#2563eb', border: 'none', borderRadius: '8px',
            color: '#fff', padding: '12px 20px', fontWeight: '700', fontSize: '14px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading || (!input.trim() && !pendingImage) ? 0.5 : 1,
            flexShrink: 0, transition: 'opacity 0.15s',
          }}
        >
          Send
        </button>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.25; transform: scale(0.9); }
          50% { opacity: 1; transform: scale(1.1); }
        }
      `}</style>
    </div>
  )
}
