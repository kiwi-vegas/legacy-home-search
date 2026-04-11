export default {
  name: 'homepage',
  title: 'Homepage',
  type: 'document',
  __experimental_actions: ['update', 'publish'],
  fields: [
    {
      name: 'heroHeadline',
      title: 'Hero Headline',
      type: 'string',
      description: 'Main headline in the hero section',
    },
    {
      name: 'heroSubheadline',
      title: 'Hero Subheadline',
      type: 'string',
      description: 'Smaller text below the main headline',
    },
    {
      name: 'ctaStripHeadline',
      title: 'CTA Section Headline',
      type: 'string',
      description: 'Headline in the call-to-action section',
    },
    {
      name: 'ctaStripBody',
      title: 'CTA Section Body Text',
      type: 'text',
      rows: 3,
    },
    {
      name: 'agentBioHeadline',
      title: 'Meet Barry — Section Headline',
      type: 'string',
      description: 'e.g. "Helping Families Move Since 2014"',
    },
    {
      name: 'agentBio',
      title: 'Meet Barry — Bio Paragraphs',
      type: 'array',
      of: [{ type: 'text', rows: 3 }],
      description: 'Each item is one paragraph in the homepage bio section.',
    },
    {
      name: 'trustStats',
      title: 'Trust Bar Stats',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'value', title: 'Value (e.g. #1, 500+)', type: 'string' },
            { name: 'label', title: 'Label (e.g. Homes Sold)', type: 'string' },
            { name: 'isStatic', title: 'Static (no count-up animation)', type: 'boolean' },
          ],
          preview: {
            select: { title: 'value', subtitle: 'label' },
          },
        },
      ],
      description: 'The stat items in the stats bar',
    },
  ],
  preview: {
    prepare: () => ({ title: 'Homepage Content' }),
  },
}
