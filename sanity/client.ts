import { createClient } from 'next-sanity'

export const client = createClient({
  projectId: (process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '2nr7n3lm').trim(),
  dataset: (process.env.NEXT_PUBLIC_SANITY_DATASET || 'production').trim(),
  apiVersion: '2024-01-01',
  useCdn: true,
  token: process.env.SANITY_API_TOKEN,
})
