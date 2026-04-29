import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// This route handles client-side Vercel Blob uploads for video files.
// The client calls upload() from @vercel/blob/client with this URL — the video
// goes directly to Vercel Blob CDN (bypasses Next.js 4MB body limit).
export async function POST(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url)
  if (searchParams.get('secret') !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = (await request.json()) as HandleUploadBody

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (_pathname) => {
        return {
          allowedContentTypes: [
            'video/mp4', 'video/quicktime', 'video/webm', 'video/x-m4v',
            'image/jpeg', 'image/png', 'image/webp',
          ],
          maximumSizeInBytes: 500 * 1024 * 1024, // 500 MB
        }
      },
      onUploadCompleted: async () => {
        // No-op: the client receives the blob URL in the upload() response
      },
    })

    return NextResponse.json(jsonResponse)
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 })
  }
}
