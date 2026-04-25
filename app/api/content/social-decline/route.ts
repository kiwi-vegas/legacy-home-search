import { NextResponse } from 'next/server'
import { markSocialDeclined } from '@/lib/content-workflow'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url)
  if (searchParams.get('secret') !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { postId } = body as { postId: string }

  if (!postId) {
    return NextResponse.json({ error: 'postId is required' }, { status: 400 })
  }

  await markSocialDeclined(postId)
  return NextResponse.json({ ok: true })
}
