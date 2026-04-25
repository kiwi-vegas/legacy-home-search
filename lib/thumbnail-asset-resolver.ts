/**
 * Thumbnail asset resolver
 *
 * Maps community slugs → background image public paths.
 * Static manifest — no fs reads. Community photos are 177MB and are served
 * as CDN static assets; they must NOT be bundled into serverless functions.
 */

export type AssetImage = {
  url: string    // public path, e.g. /community-photos/virginia-beach/img.png
  label: string  // display name
}

// ─── Static community background manifests ───────────────────────────────────

const COMMUNITY_BACKGROUNDS: Record<string, AssetImage[]> = {
  'virginia-beach': [
    { url: '/community-photos/virginia-beach/virginia_beach1_cinematic.png',  label: 'Virginia Beach 1' },
    { url: '/community-photos/virginia-beach/Virginia_Beach2_cinematic.png',  label: 'Virginia Beach 2' },
    { url: '/community-photos/virginia-beach/Virginia_Beach3_cinematic.png',  label: 'Virginia Beach 3' },
    { url: '/community-photos/virginia-beach/Virginia_Beach4_cinematic.png',  label: 'Virginia Beach 4' },
  ],
  'chesapeake': [
    { url: '/community-photos/chesapeake/Chesapeake1_cinematic.png', label: 'Chesapeake 1' },
    { url: '/community-photos/chesapeake/Chesapeake2_cinematic.png', label: 'Chesapeake 2' },
    { url: '/community-photos/chesapeake/Chesapeake3_cinematic.png', label: 'Chesapeake 3' },
    { url: '/community-photos/chesapeake/Chesapeake4_cinematic.png', label: 'Chesapeake 4' },
    { url: '/community-photos/chesapeake/Chesapeake5_cinematic.png', label: 'Chesapeake 5' },
  ],
  'norfolk': [
    { url: '/community-photos/norfolk/Norfolk_cinematic1.jpeg', label: 'Norfolk 1' },
    { url: '/community-photos/norfolk/Norfolk_cinematic2.jpeg', label: 'Norfolk 2' },
    { url: '/community-photos/norfolk/Norfolk_cinematic3.jpeg', label: 'Norfolk 3' },
    { url: '/community-photos/norfolk/Norfolk_cinematic4.png',  label: 'Norfolk 4' },
  ],
  'hampton': [
    { url: '/community-photos/hampton/Hampton1_cinematic.png',  label: 'Hampton 1' },
    { url: '/community-photos/hampton/Hampton2_cinematic.jpeg', label: 'Hampton 2' },
    { url: '/community-photos/hampton/Hampton3_cinematic.png',  label: 'Hampton 3' },
    { url: '/community-photos/hampton/Hampton4_cinematic.jpeg', label: 'Hampton 4' },
    { url: '/community-photos/hampton/Hampton5_cinematic.png',  label: 'Hampton 5' },
  ],
  'newport-news': [
    { url: '/community-photos/newport-news/Newport News1_cinematic.png', label: 'Newport News 1' },
    { url: '/community-photos/newport-news/Newport News2_cinematic.png', label: 'Newport News 2' },
    { url: '/community-photos/newport-news/Newport News3_cinematic.png', label: 'Newport News 3' },
    { url: '/community-photos/newport-news/Newport News4_cinematic.png', label: 'Newport News 4' },
  ],
  'suffolk': [
    { url: '/community-photos/suffolk/Suffolk_cinematic1.png',  label: 'Suffolk 1' },
    { url: '/community-photos/suffolk/Suffolk_cinematic2.jpeg', label: 'Suffolk 2' },
    { url: '/community-photos/suffolk/Suffolk_cinematic3.png',  label: 'Suffolk 3' },
    { url: '/community-photos/suffolk/Suffolk_cinematic4.png',  label: 'Suffolk 4' },
  ],
  'hampton-roads': [
    { url: '/community-photos/hampton-roads/Hampton_Roads-Cinematic1.png', label: 'Hampton Roads 1' },
    { url: '/community-photos/hampton-roads/Hampton_Roads-Cinematic2.png', label: 'Hampton Roads 2' },
    { url: '/community-photos/hampton-roads/Hampton_Roads-Cinematic3.png', label: 'Hampton Roads 3' },
    { url: '/community-photos/hampton-roads/Hampton_Roads-Cinematic4.png', label: 'Hampton Roads 4' },
  ],
}

export function getCommunityBackgrounds(communitySlug?: string): AssetImage[] {
  if (communitySlug && COMMUNITY_BACKGROUNDS[communitySlug]) {
    const specific = COMMUNITY_BACKGROUNDS[communitySlug]
    const generic  = COMMUNITY_BACKGROUNDS['hampton-roads'] ?? []
    return [...specific, ...generic]
  }
  if (!communitySlug) {
    return Object.values(COMMUNITY_BACKGROUNDS).flat()
  }
  return COMMUNITY_BACKGROUNDS['hampton-roads'] ?? []
}

export function getClientImages(): AssetImage[] {
  return [
    { url: '/barry-transparent.png', label: 'Barry Jenkins' },
  ]
}
