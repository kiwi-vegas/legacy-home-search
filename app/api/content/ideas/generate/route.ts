import { NextRequest, NextResponse } from 'next/server'
import { fetchAndScoreIdeas } from '@/lib/research'
import { saveIdea, getCoveredTopics } from '@/lib/idea-store'

export const runtime = 'nodejs'
export const maxDuration = 120

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  if (searchParams.get('secret') !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const coveredTopics = await getCoveredTopics()
  const ideas = await fetchAndScoreIdeas(coveredTopics)

  for (const idea of ideas) {
    await saveIdea(idea)
  }

  return NextResponse.json({
    count: ideas.length,
    ideas: ideas.map((i) => ({ id: i.id, title: i.title, score: i.score.total })),
  })
}
