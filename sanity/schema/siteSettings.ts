export default {
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  // Singleton — only one of these ever exists
  __experimental_actions: ['update', 'publish'],
  fields: [
    {
      name: 'agentName',
      title: 'Agent / Team Name',
      type: 'string',
      description: 'Full name as it appears on the site',
    },
    {
      name: 'phone',
      title: 'Phone Number',
      type: 'string',
    },
    {
      name: 'email',
      title: 'Email Address',
      type: 'string',
    },
    {
      name: 'licenseNumber',
      title: 'License Number',
      type: 'string',
    },
    {
      name: 'address',
      title: 'Office Address',
      type: 'string',
    },
    {
      name: 'brokerage',
      title: 'Brokerage Name',
      type: 'string',
    },
    {
      name: 'tagline',
      title: 'Tagline',
      type: 'string',
      description: 'Short tagline shown in footer and social sharing',
    },
  ],
  preview: {
    prepare: () => ({ title: 'Site Settings' }),
  },
}
