import { NextRequest, NextResponse } from 'next/server'
import { getPendingIdeas, getAllIdeas } from '@/lib/idea-store'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  if (searchParams.get('secret') !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const all = searchParams.get('all') === 'true'
  const ideas = all ? await getAllIdeas() : await getPendingIdeas()

  return NextResponse.json(ideas)
}
