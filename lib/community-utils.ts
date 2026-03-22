/**
 * Merges Sanity quickStats overrides into a hardcoded stats array.
 *
 * Each hardcoded stat is a tuple: [label, value] or [label, value, cssClass]
 * Sanity overrides match by key (case-insensitive).
 * New keys from Sanity that aren't in the hardcoded list are appended.
 */
export function mergeQuickStats(
  hardcoded: Array<[string, string] | [string, string, string]>,
  sanityOverrides?: Array<{ key: string; value: string }> | null
): Array<[string, string] | [string, string, string]> {
  if (!sanityOverrides?.length) return hardcoded

  const overrideMap = new Map(
    sanityOverrides.map((s) => [s.key.toLowerCase().trim(), s.value])
  )
  const hardcodedKeys = new Set(hardcoded.map(([label]) => label.toLowerCase().trim()))

  const merged = hardcoded.map((entry) => {
    const override = overrideMap.get(entry[0].toLowerCase().trim())
    if (!override) return entry
    return entry.length === 3
      ? [entry[0], override, entry[2]] as [string, string, string]
      : [entry[0], override] as [string, string]
  })

  // Append Sanity stats not in hardcoded list
  for (const s of sanityOverrides) {
    if (!hardcodedKeys.has(s.key.toLowerCase().trim())) {
      merged.push([s.key, s.value])
    }
  }

  return merged
}

/**
 * Given a community's sectionImages array from Sanity,
 * returns the Sanity image object for the given role (or null).
 */
export function getSectionImage(
  sectionImages?: Array<{ role: string; image: any }> | null,
  role?: string
): any | null {
  if (!sectionImages?.length || !role) return null
  return sectionImages.find((s) => s.role.toLowerCase() === role.toLowerCase())?.image ?? null
}

/**
 * Merges Sanity quickStats overrides into a hardcoded drive times array.
 * The override key is the destination string (case-insensitive match).
 * e.g. quickStats key "to Harry Reid Airport" overrides the time for that card.
 */
export function mergeDriveTimes(
  hardcoded: Array<{ time: string; destination: string; route: string }>,
  quickStats?: Array<{ key: string; value: string }> | null
): Array<{ time: string; destination: string; route: string }> {
  if (!quickStats?.length) return hardcoded
  const overrides = new Map(quickStats.map((s) => [s.key.toLowerCase().trim(), s.value]))
  return hardcoded.map((dt) => ({
    ...dt,
    time: overrides.get(dt.destination.toLowerCase().trim()) ?? dt.time,
  }))
}

/**
 * Returns the direct Sanity CDN URL for a section image role (or null).
 * Prefer this over getSectionImage + urlFor for reliable image display.
 */
export function getSectionImageUrl(
  sectionImages?: Array<{ role: string; image: any; imageUrl?: string }> | null,
  role?: string
): string | null {
  if (!sectionImages?.length || !role) return null
  return sectionImages.find((s) => s.role.toLowerCase() === role.toLowerCase())?.imageUrl ?? null
}
