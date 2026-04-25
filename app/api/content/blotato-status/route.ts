import { NextResponse } from 'next/server'
import { getPostStatus } from '@/lib/blotato-client'
import { updateBlotatoStatus } from '@/lib/content-workflow'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  if (searchParams.get('secret') !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const postSubmissionId = searchParams.get('postSubmissionId')
  const postId = searchParams.get('postId')

  if (!postSubmissionId || !postId) {
    return NextResponse.json({ error: 'postSubmissionId and postId are required' }, { status: 400 })
  }

  try {
    const status = await getPostStatus(postSubmissionId)

    // Persist resolved status back to Sanity
    if (status.status === 'published' || status.status === 'failed') {
      await updateBlotatoStatus(postId, status.status, status.postUrl)
    }

    return NextResponse.json(status)
  } catch (err) {
    console.error('[blotato-status]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Status check failed' },
      { status: 500 },
    )
  }
}
