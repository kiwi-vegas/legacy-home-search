export default {
  name: 'blogPost',
  title: 'Blog Posts',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Post Title',
      type: 'string',
      validation: (R: any) => R.required(),
    },
    {
      name: 'slug',
      title: 'URL Slug',
      type: 'slug',
      options: { source: 'title', maxLength: 96 },
      validation: (R: any) => R.required(),
    },
    {
      name: 'publishedAt',
      title: 'Published Date',
      type: 'datetime',
    },
    {
      name: 'category',
      title: 'Category',
      type: 'string',
      options: {
        list: [
          { title: 'Market Update', value: 'market-update' },
          { title: 'Buying Tips', value: 'buying-tips' },
          { title: 'Selling Tips', value: 'selling-tips' },
          { title: 'Community Spotlight', value: 'community-spotlight' },
          { title: 'Investment', value: 'investment' },
          { title: 'News', value: 'news' },
        ],
      },
    },
    {
      name: 'excerpt',
      title: 'Excerpt',
      type: 'text',
      rows: 3,
      description: 'Short summary shown in blog listing and SEO description',
    },
    {
      name: 'coverImage',
      title: 'Cover Image',
      type: 'image',
      options: { hotspot: true },
      description: 'YouTube-style thumbnail (1536×1024) — Barry on right, text on left',
    },
    {
  name: 'heroBannerImage',
  title: 'Hero Banner Image',
  type: 'image',
},
    {
      name: 'heroBannerImage',
      title: 'Hero Banner Image',
      type: 'image',
      options: { hotspot: true },
      description: 'Wide 4:1 banner (1920×480) shown at the top of the blog post page',
    },
    {
      name: 'body',
      title: 'Post Body',
      type: 'array',
      of: [
        { type: 'block' },
        {
          type: 'image',
          options: { hotspot: true },
          fields: [
            { name: 'alt', title: 'Alt Text', type: 'string' },
            { name: 'caption', title: 'Caption', type: 'string' },
          ],
        },
      ],
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
    {
      name: 'aiGenerated',
      title: 'AI Generated',
      type: 'boolean',
      description: 'Mark if this post was created by the AI blog agent',
      initialValue: false,
    },
  ],
  preview: {
    select: { title: 'title', subtitle: 'publishedAt', media: 'coverImage' },
    prepare({ title, subtitle, media }: any) {
      return {
        title,
        subtitle: subtitle ? new Date(subtitle).toLocaleDateString() : 'Draft',
        media,
      }
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
