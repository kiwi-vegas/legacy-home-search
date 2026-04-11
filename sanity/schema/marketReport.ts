export default {
  name: 'marketReport',
  title: 'Market Reports',
  type: 'document',
  fields: [
    {
      name: 'community',
      title: 'Community Slug',
      type: 'string',
      options: {
        list: [
          { title: 'Virginia Beach', value: 'virginia-beach' },
          { title: 'Chesapeake', value: 'chesapeake' },
          { title: 'Norfolk', value: 'norfolk' },
          { title: 'Suffolk', value: 'suffolk' },
          { title: 'Hampton', value: 'hampton' },
          { title: 'Newport News', value: 'newport-news' },
        ],
      },
      validation: (R: any) => R.required(),
    },
    {
      name: 'communityName',
      title: 'Community Display Name',
      type: 'string',
      description: 'e.g. Virginia Beach',
    },
    {
      name: 'reportPeriod',
      title: 'Report Period',
      type: 'string',
      description: 'e.g. April 2026',
    },
    {
      name: 'slug',
      title: 'URL Slug',
      type: 'slug',
      options: { source: 'reportPeriod', maxLength: 96 },
      description: 'Auto-generated. e.g. virginia-beach-april-2026',
      validation: (R: any) => R.required(),
    },
    {
      name: 'published',
      title: 'Published',
      type: 'boolean',
      initialValue: false,
      description: 'Set to true to make this report visible on the site.',
    },
    {
      name: 'publishedAt',
      title: 'Published Date',
      type: 'datetime',
    },
    {
      name: 'altosEmailText',
      title: 'Altos Email Source Text',
      type: 'text',
      description: 'Raw text from the Altos email — stored for reference, not displayed publicly.',
      rows: 8,
    },
    // ── Extracted metrics ──────────────────────────────────────────────────
    {
      name: 'medianListPrice',
      title: 'Median List Price',
      type: 'string',
      description: 'e.g. $389,000',
    },
    {
      name: 'medianPriceChange',
      title: 'Median Price Change',
      type: 'string',
      description: 'e.g. +2.3% vs March',
    },
    {
      name: 'daysOnMarket',
      title: 'Days on Market',
      type: 'string',
      description: 'e.g. 18 days',
    },
    {
      name: 'activeInventory',
      title: 'Active Inventory',
      type: 'string',
      description: 'e.g. 312 homes',
    },
    {
      name: 'inventoryChange',
      title: 'Inventory Change',
      type: 'string',
      description: 'e.g. -8% vs last month',
    },
    {
      name: 'priceReductions',
      title: 'Price Reductions',
      type: 'string',
      description: 'e.g. 14% of listings',
    },
    // ── Claude-written sections ────────────────────────────────────────────
    {
      name: 'marketSummary',
      title: 'Market Overview',
      type: 'text',
      rows: 4,
    },
    {
      name: 'buyerSection',
      title: 'For Buyers',
      type: 'text',
      rows: 5,
    },
    {
      name: 'sellerSection',
      title: 'For Sellers',
      type: 'text',
      rows: 5,
    },
    {
      name: 'investorSection',
      title: 'For Investors',
      type: 'text',
      rows: 5,
    },
    {
      name: 'barrysTake',
      title: "Barry's Take",
      type: 'text',
      rows: 4,
    },
    // ── SEO + media ────────────────────────────────────────────────────────
    {
      name: 'coverImage',
      title: 'Cover Image',
      type: 'image',
      options: { hotspot: true },
    },
    {
      name: 'metaTitle',
      title: 'SEO Title',
      type: 'string',
    },
    {
      name: 'metaDescription',
      title: 'SEO Description',
      type: 'text',
      rows: 2,
    },
  ],
  preview: {
    select: { title: 'communityName', subtitle: 'reportPeriod', media: 'coverImage' },
    prepare({ title, subtitle, media }: any) {
      return { title: `${title ?? '?'} — ${subtitle ?? '?'}`, media }
    },
  },
  orderings: [
    {
      title: 'Published Date (Newest)',
      name: 'publishedAtDesc',
      by: [{ field: 'publishedAt', direction: 'desc' }],
    },
  ],
}
