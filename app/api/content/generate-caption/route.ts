import { NextRequest, NextResponse } from 'next/server'
import { generateSocialCopy } from '@/lib/publish-service'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  if (searchParams.get('secret') !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { title, excerpt, category } = await req.json()
    if (!title) return NextResponse.json({ error: 'title is required' }, { status: 400 })

    const caption = await generateSocialCopy({ title, excerpt, category })
    return NextResponse.json({ caption })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed' }, { status: 500 })
  }
}
