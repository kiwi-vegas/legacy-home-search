import { NextResponse } from 'next/server'
import { client } from '@/sanity/client'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('secret')
  const id = searchParams.get('id')

  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  }

  const doc = await client.fetch(
    `*[_type == "marketReport" && _id == $id][0]{
      _id, community, communityName, reportPeriod, "slug": slug.current,
      published, publishedAt,
      medianListPrice, medianPriceChange, daysOnMarket, activeInventory,
      inventoryChange, priceReductions, marketSummary, buyerSection,
      sellerSection, investorSection, barrysTake, metaTitle, metaDescription
    }`,
    { id }
  )

  if (!doc) {
    return NextResponse.json({ error: 'Draft not found' }, { status: 404 })
  }

  return NextResponse.json(doc)
}
