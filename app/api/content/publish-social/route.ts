import { NextResponse } from 'next/server'
import { getVAQueuePost } from '@/sanity/queries'
import { publishSocialOnly } from '@/lib/publish-service'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url)
  if (searchParams.get('secret') !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { postId, socialCopy } = body as { postId: string; socialCopy?: string }

  if (!postId) {
    return NextResponse.json({ error: 'postId is required' }, { status: 400 })
  }

  const post = await getVAQueuePost(postId)
  if (!post) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 })
  }

  const result = await publishSocialOnly(post, socialCopy)

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 })
  }

  const fb = result.facebook
  return NextResponse.json({ ok: true, postSubmissionId: fb && 'postSubmissionId' in fb ? fb.postSubmissionId : undefined })
}
