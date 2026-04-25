/**
 * Thumbnail asset resolver
 *
 * Maps community slugs → background image public paths.
 * Maps client image types → public paths.
 * Used by the VA media editor to populate asset pickers.
 *
 * All paths are relative to /public and served as static assets.
 * The community detection logic mirrors the blog post page's detectCommunities().
 */

import fs from 'fs'
import path from 'path'

const PUBLIC_DIR = path.join(process.cwd(), 'public')

// ─── Types ────────────────────────────────────────────────────────────────────

export type AssetImage = {
  url: string        // public path, e.g. /community-photos/virginia-beach/img.png
  label: string      // display name
  filePath: string   // absolute FS path
}

// ─── Community backgrounds ────────────────────────────────────────────────────

const COMMUNITY_DIRS: Record<string, string> = {
  'virginia-beach': 'community-photos/virginia-beach',
  'chesapeake':     'community-photos/chesapeake',
  'norfolk':        'community-photos/norfolk',
  'hampton':        'community-photos/hampton',
  'newport-news':   'community-photos/newport-news',
  'suffolk':        'community-photos/suffolk',
  'hampton-roads':  'community-photos/hampton-roads',
}

export function getCommunityBackgrounds(communitySlug?: string): AssetImage[] {
  const dirs: string[] = []

  if (communitySlug && COMMUNITY_DIRS[communitySlug]) {
    dirs.push(COMMUNITY_DIRS[communitySlug])
  }

  // Always include hampton-roads as a generic fallback set
  if (!dirs.includes(COMMUNITY_DIRS['hampton-roads'])) {
    dirs.push(COMMUNITY_DIRS['hampton-roads'])
  }

  // If no specific community, show all
  if (!communitySlug) {
    Object.values(COMMUNITY_DIRS).forEach(d => {
      if (!dirs.includes(d)) dirs.push(d)
    })
  }

  const images: AssetImage[] = []

  for (const relDir of dirs) {
    const absDir = path.join(PUBLIC_DIR, relDir)
    if (!fs.existsSync(absDir)) continue

    const files = fs.readdirSync(absDir).filter(f => /\.(png|jpg|jpeg|webp)$/i.test(f))
    for (const file of files) {
      images.push({
        url: `/${relDir}/${file}`,
        label: file.replace(/_/g, ' ').replace(/\.(png|jpg|jpeg|webp)$/i, ''),
        filePath: path.join(absDir, file),
      })
    }
  }

  return images
}

// ─── Client images (Barry + expressions) ─────────────────────────────────────

export function getClientImages(): AssetImage[] {
  const images: AssetImage[] = []

  // Barry transparent cutout
  const barryPath = path.join(PUBLIC_DIR, 'barry-transparent.png')
  if (fs.existsSync(barryPath)) {
    images.push({
      url: '/barry-transparent.png',
      label: 'Barry Jenkins',
      filePath: barryPath,
    })
  }

  // Expression variants
  const expDir = path.join(PUBLIC_DIR, 'expressions')
  if (fs.existsSync(expDir)) {
    const files = fs.readdirSync(expDir).filter(f => /\.(png|jpg|jpeg|webp)$/i.test(f))
    for (const file of files) {
      images.push({
        url: `/expressions/${file}`,
        label: file.replace(/_/g, ' ').replace(/\.(png|jpg|jpeg|webp)$/i, ''),
        filePath: path.join(expDir, file),
      })
    }
  }

  return images
}

// Pure helpers (detectCommunitySlug, buildDefaultThumbnailPrompt) live in
// lib/thumbnail-prompt.ts — client-safe, no fs imports.
