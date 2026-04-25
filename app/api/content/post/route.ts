import { NextRequest, NextResponse } from 'next/server'
import { getVAQueuePost } from '@/sanity/queries'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  if (searchParams.get('secret') !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const postId = searchParams.get('postId')
  if (!postId) return NextResponse.json({ error: 'postId is required' }, { status: 400 })

  const post = await getVAQueuePost(postId)
  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json(post)
}
