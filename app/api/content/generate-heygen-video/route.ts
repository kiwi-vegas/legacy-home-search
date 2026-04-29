import { NextResponse } from 'next/server'
import { generateHeyGenVideo } from '@/lib/heygen-client'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url)
  if (searchParams.get('secret') !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { script } = await request.json()
  if (!script?.trim()) {
    return NextResponse.json({ error: 'script is required' }, { status: 400 })
  }

  try {
    const videoId = await generateHeyGenVideo(script.trim())
    return NextResponse.json({ videoId })
  } catch (err) {
    console.error('[generate-heygen-video]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to start video generation' },
      { status: 500 },
    )
  }
}
