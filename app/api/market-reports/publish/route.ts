import { NextResponse } from 'next/server'
import { getSanityWriteClient } from '@/lib/sanity-write'
import { client } from '@/sanity/client'

const EDITABLE_FIELDS = [
  'medianListPrice', 'medianPriceChange', 'daysOnMarket', 'activeInventory',
  'inventoryChange', 'priceReductions', 'marketSummary', 'buyerSection',
  'sellerSection', 'investorSection', 'barrysTake', 'metaTitle', 'metaDescription',
]

export async function POST(request: Request) {
  const adminSecret = process.env.ADMIN_SECRET
  if (!adminSecret) return NextResponse.json({ error: 'Not configured' }, { status: 500 })

  const body = await request.json().catch(() => ({}))
  if (body.secret !== adminSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id, fields } = body as { id: string; fields: Record<string, string> }
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  // Verify the document exists
  const existing = await client.fetch<{ _id: string; slug: string } | null>(
    `*[_type == "marketReport" && _id == $id][0]{ _id, "slug": slug.current }`,
    { id }
  )
  if (!existing?._id) return NextResponse.json({ error: 'Report not found' }, { status: 404 })

  // Build update — only allow editable fields + publish flags
  const updates: Record<string, any> = {
    published: true,
    publishedAt: new Date().toISOString(),
  }
  if (fields) {
    for (const [k, v] of Object.entries(fields)) {
      if (EDITABLE_FIELDS.includes(k)) updates[k] = v
    }
  }

  const writeClient = getSanityWriteClient()
  await writeClient.patch(existing._id).set(updates).commit()

  return NextResponse.json({
    success: true,
    slug: existing.slug,
    url: `/market-reports/${existing.slug}`,
  })
}
