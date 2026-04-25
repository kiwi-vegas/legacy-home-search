import { NextRequest, NextResponse } from 'next/server'
import { getIdea, updateIdeaStatus } from '@/lib/idea-store'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  if (searchParams.get('secret') !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { ideaId } = await req.json().catch(() => ({}))
  if (!ideaId) return NextResponse.json({ error: 'ideaId is required' }, { status: 400 })

  const idea = await getIdea(ideaId)
  if (!idea) return NextResponse.json({ error: 'Idea not found' }, { status: 404 })

  await updateIdeaStatus(ideaId, 'deferred')
  return NextResponse.json({ success: true })
}
