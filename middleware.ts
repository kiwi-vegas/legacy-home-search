import { NextRequest, NextResponse } from 'next/server'

const COOKIE_NAME = 'assistant_session'
const LOGIN_PATH = '/admin/assistant/login'
const PROTECTED_PREFIX = '/admin/assistant'

async function verifyToken(token: string, secret: string): Promise<boolean> {
  const lastDot = token.lastIndexOf('.')
  if (lastDot === -1) return false
  const payload = token.slice(0, lastDot)
  const sig = token.slice(lastDot + 1)

  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, enc.encode(payload))
  const expectedSig = Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

  return sig === expectedSig
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (!pathname.startsWith(PROTECTED_PREFIX)) return NextResponse.next()
  if (pathname === LOGIN_PATH || pathname.startsWith(LOGIN_PATH + '/')) return NextResponse.next()

  const secret = process.env.ADMIN_SECRET
  if (!secret) return NextResponse.next() // misconfigured — fail open in dev

  const token = req.cookies.get(COOKIE_NAME)?.value
  if (token && (await verifyToken(token, secret))) return NextResponse.next()

  const loginUrl = req.nextUrl.clone()
  loginUrl.pathname = LOGIN_PATH
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: ['/admin/assistant/:path*'],
}
