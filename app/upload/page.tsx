import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'

async function loginAction(formData: FormData) {
  'use server'
  const pin = (formData.get('pin') as string ?? '').trim()
  const secret = process.env.ADMIN_SECRET ?? ''
  // ADMIN_PIN lets you set a short memorable password separately from the long ADMIN_SECRET
  const validPin = process.env.ADMIN_PIN ?? secret

  if (pin === validPin) {
    const cookieStore = await cookies()
    cookieStore.set('admin_session', secret, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
      sameSite: 'lax',
    })
    redirect(`/admin/market-reports/upload?secret=${secret}`)
  }

  redirect('/upload?error=1')
}

export default async function UploadGatewayPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  // If a valid session cookie exists, skip the login form entirely
  const cookieStore = await cookies()
  const session = cookieStore.get('admin_session')
  const secret = process.env.ADMIN_SECRET ?? ''

  if (session?.value === secret && secret) {
    redirect(`/admin/market-reports/upload?secret=${secret}`)
  }

  const { error } = await searchParams

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f8f7f4',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Inter, -apple-system, sans-serif',
    }}>
      <div style={{ width: '100%', maxWidth: 360, padding: '0 24px' }}>

        {/* Logo / brand */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 56,
            height: 56,
            background: '#2563eb',
            borderRadius: 14,
            marginBottom: 16,
          }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
              <path d="M4 16v-2.5M4 8v2.5M4 10.5h16M4 13.5h16M8 19l4 2 4-2V5l-4-2-4 2v14z" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#2563eb', marginBottom: 6 }}>
            Legacy Home Search
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1a1a1a', margin: 0, letterSpacing: '-0.02em' }}>
            Market Reports
          </h1>
          <p style={{ fontSize: 14, color: '#888884', marginTop: 6, marginBottom: 0 }}>
            Enter your password to continue
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div style={{
            background: 'rgba(220,38,38,0.08)',
            border: '1px solid rgba(220,38,38,0.2)',
            color: '#dc2626',
            padding: '10px 14px',
            borderRadius: 8,
            fontSize: 13,
            marginBottom: 20,
            textAlign: 'center',
          }}>
            Incorrect password — try again
          </div>
        )}

        {/* Login form */}
        <form action={loginAction}>
          <div style={{ marginBottom: 12 }}>
            <input
              type="password"
              name="pin"
              placeholder="Password"
              autoFocus
              autoComplete="current-password"
              required
              style={{
                width: '100%',
                padding: '13px 16px',
                fontSize: 15,
                border: '1.5px solid #e0ddd8',
                borderRadius: 10,
                background: '#fff',
                outline: 'none',
                fontFamily: 'Inter, sans-serif',
                color: '#1a1a1a',
                boxSizing: 'border-box',
              }}
            />
          </div>
          <button
            type="submit"
            style={{
              width: '100%',
              padding: '13px',
              background: '#2563eb',
              color: '#fff',
              fontSize: 15,
              fontWeight: 700,
              border: 'none',
              borderRadius: 10,
              cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
              letterSpacing: '-0.01em',
            }}
          >
            Continue →
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 12, color: '#aaa9a4', marginTop: 24 }}>
          Session stays active for 7 days
        </p>
      </div>
    </div>
  )
}
