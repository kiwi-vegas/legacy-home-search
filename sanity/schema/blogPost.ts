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
      name: 'status',
      title: 'Status (Legacy)',
      type: 'string',
      options: { list: ['pending_thumbnail', 'published'] },
      initialValue: 'published',
      description: 'Legacy field — new posts use workflowStatus instead',
    },
    {
      name: 'workflowStatus',
      title: 'Workflow Status',
      type: 'string',
      options: {
        list: [
          { title: 'Media Pending (hidden)', value: 'media_pending' },
          { title: 'Media Ready', value: 'media_ready' },
          { title: 'Publish Pending', value: 'publish_pending' },
          { title: 'Publishing', value: 'publishing' },
          { title: 'Published (live)', value: 'published' },
          { title: 'Publish Failed', value: 'publish_failed' },
        ],
      },
      description: 'Controls visibility and publish state for the content machine workflow',
    },
    {
      name: 'blotatoPostSubmissionId',
      title: 'Blotato Submission ID',
      type: 'string',
      description: 'Returned by Blotato after Facebook post is submitted',
    },
    {
      name: 'blotatoPublishStatus',
      title: 'Blotato Publish Status',
      type: 'string',
      options: { list: ['pending', 'published', 'failed'] },
      description: 'Polled from Blotato after submission',
    },
    {
      name: 'blotatoPublishedAt',
      title: 'Blotato Published At',
      type: 'datetime',
      description: 'When Blotato confirmed the Facebook post went live',
    },
    {
      name: 'facebookPostUrl',
      title: 'Facebook Post URL',
      type: 'url',
      description: 'URL of the published Facebook post (returned by Blotato)',
    },
    {
      name: 'socialCopy',
      title: 'Social Media Copy',
      type: 'text',
      rows: 3,
      description: 'Auto-generated Facebook post caption (editable by VA before publishing)',
    },
    {
      name: 'socialDeclined',
      title: 'Social Posting Declined',
      type: 'boolean',
      description: 'Set to true when this post has been deliberately skipped for Facebook posting',
    },
    {
      name: 'coverImage',
      title: 'Cover Image',
      type: 'image',
      options: { hotspot: true },
      description: 'Thumbnail shown in blog listing and at top of post',
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
