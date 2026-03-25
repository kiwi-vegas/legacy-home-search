export default {
  name: 'teamMember',
  title: 'Team Member',
  type: 'document',
  fields: [
    {
      name: 'name',
      title: 'Full Name',
      type: 'string',
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'slug',
      title: 'Slug (URL)',
      type: 'slug',
      options: { source: 'name', maxLength: 96 },
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'active',
      title: 'Active on Team',
      type: 'boolean',
      description: 'Uncheck to hide this agent from the site without deleting their record.',
      initialValue: true,
    },
    {
      name: 'sortOrder',
      title: 'Sort Order',
      type: 'number',
      description: 'Lower numbers appear first. Barry = 1, others = 10, 20, 30...',
    },
    {
      name: 'title',
      title: 'Title / Role',
      type: 'string',
      description: 'e.g. "REALTOR®" or "Team Owner & Lead Agent"',
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
      name: 'photo',
      title: 'Headshot Photo',
      type: 'image',
      description: 'Upload the agent headshot here. Replaces the local file photo.',
      options: { hotspot: true },
    },
    {
      name: 'photoPath',
      title: 'Local Photo Path (fallback)',
      type: 'string',
      description: 'Fallback if no Sanity photo is uploaded, e.g. /team/barry-jenkins-main.jpg',
    },
    {
      name: 'subdomain',
      title: 'Personal Listings URL',
      type: 'string',
      description: 'e.g. https://barry.legacyhomesearch.com',
    },
    {
      name: 'bio',
      title: 'Bio Paragraphs',
      type: 'array',
      of: [{ type: 'text', rows: 4 }],
      description: 'Each item is one paragraph. Add as many paragraphs as needed.',
    },
    {
      name: 'specialties',
      title: 'Specialties',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'e.g. "First-Time Buyers", "Military Relocation", "Investment Properties"',
    },
    {
      name: 'years',
      title: 'Years of Experience',
      type: 'string',
      description: 'e.g. "21+" — leave blank to hide',
    },
    {
      name: 'transactions',
      title: 'Transaction Count',
      type: 'string',
      description: 'e.g. "900+" — leave blank to hide',
    },
  ],
  preview: {
    select: { title: 'name', subtitle: 'title', active: 'active' },
    prepare({ title, subtitle, active }: any) {
      return {
        title: `${active === false ? '⚫ ' : ''}${title ?? 'Unnamed Agent'}`,
        subtitle: subtitle ?? '',
      }
    },
  },
  orderings: [
    {
      title: 'Sort Order',
      name: 'sortOrderAsc',
      by: [{ field: 'sortOrder', direction: 'asc' }],
    },
  ],
}
