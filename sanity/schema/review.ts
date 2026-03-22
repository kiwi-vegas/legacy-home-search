export default {
  name: 'review',
  title: 'Client Reviews',
  type: 'document',
  fields: [
    {
      name: 'platform',
      title: 'Platform',
      type: 'string',
      options: {
        list: [
          { title: 'Google', value: 'google' },
          { title: 'Zillow', value: 'zillow' },
        ],
        layout: 'radio',
      },
      validation: (R: any) => R.required(),
    },
    {
      name: 'reviewerName',
      title: 'Reviewer Name',
      type: 'string',
      description: 'e.g. Sarah M.',
      validation: (R: any) => R.required(),
    },
    {
      name: 'reviewText',
      title: 'Review Text',
      type: 'text',
      rows: 4,
      validation: (R: any) => R.required(),
    },
    {
      name: 'featured',
      title: 'Featured on Homepage',
      type: 'boolean',
      description: 'Show this review on the homepage',
      initialValue: true,
    },
    {
      name: 'sortOrder',
      title: 'Sort Order',
      type: 'number',
      description: 'Lower number = shown first',
      initialValue: 99,
    },
  ],
  preview: {
    select: { title: 'reviewerName', subtitle: 'platform' },
  },
  orderings: [
    {
      title: 'Sort Order',
      name: 'sortOrderAsc',
      by: [{ field: 'sortOrder', direction: 'asc' }],
    },
  ],
}
