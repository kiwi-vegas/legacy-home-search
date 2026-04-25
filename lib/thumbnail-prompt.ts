// Pure, client-safe helpers extracted from thumbnail-asset-resolver.ts
// (no fs/path imports — safe to use in 'use client' components)

export function detectCommunitySlug(title: string, slug: string): string | undefined {
  const text = `${title} ${slug}`.toLowerCase()
  const textNoHR = text.replace(/hampton[\s-]+roads?/gi, '')

  if (text.includes('virginia beach') || text.includes('virginia-beach')) return 'virginia-beach'
  if (text.includes('chesapeake')) return 'chesapeake'
  if (text.includes('norfolk')) return 'norfolk'
  if (textNoHR.includes('hampton')) return 'hampton'
  if (text.includes('newport news') || text.includes('newport-news')) return 'newport-news'
  if (text.includes('suffolk')) return 'suffolk'

  return undefined
}

export function buildDefaultThumbnailPrompt(params: {
  title: string
  category: string
  excerpt?: string
  community?: string
}): string {
  const { title, category, excerpt, community } = params

  const communityLine = community
    ? `Community: ${community.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}`
    : 'Region: Hampton Roads, Virginia'

  const categoryLabels: Record<string, string> = {
    'market-update': 'Real estate market update',
    'buying-tips': 'Home buying tips',
    'selling-tips': 'Home selling tips',
    'community-spotlight': 'Community spotlight',
    'investment': 'Real estate investment',
    'news': 'Real estate news',
  }

  return `YouTube-style real estate thumbnail for a blog post titled "${title}".
${communityLine}
Topic: ${categoryLabels[category] ?? category}
${excerpt ? `Context: ${excerpt.slice(0, 120)}` : ''}

Style: Bold, eye-catching thumbnail. Dark navy or deep charcoal background. Large bold text headline visible in the upper half of the image. Bright accent colors (electric blue, white, gold). Clean, professional real estate brand aesthetic.

Composition: Wide 16:9 landscape. Strong graphic elements. Real estate agent Barry Jenkins may appear on the right side. Text headline dominates the left side. Community landmark or home imagery in the background.

Do NOT include: logos, watermarks, for-sale signs, blurry images, or cluttered layouts.`
}
