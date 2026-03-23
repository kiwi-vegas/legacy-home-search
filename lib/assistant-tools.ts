import Anthropic from '@anthropic-ai/sdk'
import { client } from '@/sanity/client'
import { getSanityWriteClient } from './sanity-write'

// ─── Community registry ───────────────────────────────────────────────────────

const COMMUNITY_PAGES: Array<{
  slug: string
  name: string
  driveTimes: string[]
}> = [
  { slug: 'virginia-beach', name: 'Virginia Beach', driveTimes: ['to Norfolk', 'to Chesapeake', 'to Hampton', 'to Richmond'] },
  { slug: 'chesapeake', name: 'Chesapeake', driveTimes: ['to Norfolk', 'to Virginia Beach', 'to Suffolk', 'to Richmond'] },
  { slug: 'norfolk', name: 'Norfolk', driveTimes: ['to Chesapeake', 'to Virginia Beach', 'to Hampton', 'to Washington DC'] },
  { slug: 'suffolk', name: 'Suffolk', driveTimes: ['to Chesapeake', 'to Norfolk', 'to Virginia Beach', 'to Richmond'] },
  { slug: 'hampton', name: 'Hampton', driveTimes: ['to Newport News', 'to Norfolk', 'to Williamsburg', 'to Virginia Beach'] },
  { slug: 'newport-news', name: 'Newport News', driveTimes: ['to Hampton', 'to Williamsburg', 'to Norfolk', 'to Richmond'] },
]

// ─── Tool definitions (Anthropic tool_use format) ─────────────────────────────

export const TOOLS: Anthropic.Tool[] = [
  {
    name: 'list_community_pages',
    description: 'Returns the list of all community pages on the site with their slugs and names.',
    input_schema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'get_community_content',
    description: 'Fetches the current CMS content for a specific community page — headlines, stats, meta fields, and the available drive time destination keys.',
    input_schema: {
      type: 'object',
      properties: {
        slug: { type: 'string', description: 'Community slug, e.g. downtown, westside' },
      },
      required: ['slug'],
    },
  },
  {
    name: 'update_community_stats',
    description: 'Updates one or more "At a Glance" stats for a community page. Stats are flexible key/value pairs. Existing keys are updated; new keys are added. The change goes live within 60 seconds.',
    input_schema: {
      type: 'object',
      properties: {
        slug: { type: 'string', description: 'Community slug' },
        stats: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              key: { type: 'string', description: 'Stat label, e.g. Distance to Airport' },
              value: { type: 'string', description: 'Stat value, e.g. ~15 min' },
            },
            required: ['key', 'value'],
          },
        },
      },
      required: ['slug', 'stats'],
    },
  },
  {
    name: 'update_community_text',
    description: 'Updates a text field on a community page. Allowed fields: heroHeadline, heroSubheadline, overviewTitle, metaTitle, metaDescription.',
    input_schema: {
      type: 'object',
      properties: {
        slug: { type: 'string' },
        field: {
          type: 'string',
          enum: ['heroHeadline', 'heroSubheadline', 'overviewTitle', 'metaTitle', 'metaDescription'],
        },
        value: { type: 'string' },
      },
      required: ['slug', 'field', 'value'],
    },
  },
  {
    name: 'upload_community_image',
    description: 'Uploads an image and applies it to a community page. The image is automatically extracted from the conversation — do NOT include imageBase64 or mimeType in your call. Use role="hero" for the hero background banner at the top of the page, or role="lifestyle" for the lifestyle section image. For any other section, use a descriptive role name (e.g. "neighborhood", "amenities").',
    input_schema: {
      type: 'object',
      properties: {
        slug: { type: 'string' },
        role: { type: 'string', description: 'Where to place the image: "hero", "lifestyle", or another section name' },
        imageBase64: { type: 'string', description: 'Leave blank — auto-filled from conversation' },
        mimeType: { type: 'string', description: 'Leave blank — auto-filled from conversation' },
      },
      required: ['slug', 'role'],
    },
  },
  {
    name: 'get_homepage_content',
    description: 'Fetches the current homepage CMS content — hero headline, subheadline, CTA text.',
    input_schema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'update_homepage_field',
    description: 'Updates a text field on the homepage. Allowed fields: heroHeadline, heroSubheadline, ctaStripHeadline, ctaStripBody.',
    input_schema: {
      type: 'object',
      properties: {
        field: {
          type: 'string',
          enum: ['heroHeadline', 'heroSubheadline', 'ctaStripHeadline', 'ctaStripBody'],
        },
        value: { type: 'string' },
      },
      required: ['field', 'value'],
    },
  },
]

// ─── Helper: get or create communityPage doc ──────────────────────────────────

async function getOrCreateCommunityDoc(slug: string): Promise<string> {
  const writeClient = getSanityWriteClient()
  const existing = await client.fetch<{ _id: string } | null>(
    `*[_type == "communityPage" && slug.current == $slug][0]{ _id }`,
    { slug }
  )
  if (existing?._id) return existing._id

  const community = COMMUNITY_PAGES.find((c) => c.slug === slug)
  const doc = await writeClient.create({
    _type: 'communityPage',
    name: community?.name ?? slug,
    slug: { _type: 'slug', current: slug },
  })
  return doc._id
}

// ─── Tool executor ────────────────────────────────────────────────────────────

export async function executeToolCall(name: string, input: Record<string, any>): Promise<string> {
  const writeClient = getSanityWriteClient()

  switch (name) {
    case 'list_community_pages': {
      return JSON.stringify(COMMUNITY_PAGES)
    }

    case 'get_community_content': {
      const doc = await client.fetch(
        `*[_type == "communityPage" && slug.current == $slug][0]{
          name, heroHeadline, heroSubheadline, overviewTitle, metaTitle, metaDescription,
          quickStats[]{ key, value },
          "hasHeroImage": defined(heroImage),
          sectionImages[]{ role }
        }`,
        { slug: input.slug }
      )
      const community = COMMUNITY_PAGES.find((c) => c.slug === input.slug)
      const result = {
        ...(doc ?? { note: `No CMS overrides found for "${input.slug}". Page uses hardcoded defaults.` }),
        driveTimeKeys: community?.driveTimes ?? [],
        driveTimeNote: 'To update a drive time, use update_community_stats with key = the destination string and value = the time (e.g. "~5 min")',
      }
      return JSON.stringify(result, null, 2)
    }

    case 'update_community_stats': {
      const docId = await getOrCreateCommunityDoc(input.slug)
      const current = await client.fetch<{ quickStats?: Array<{ key: string; value: string }> }>(
        `*[_id == $id][0]{ quickStats[]{ key, value } }`,
        { id: docId }
      )
      const existing = current?.quickStats ?? []
      const updateMap = new Map((input.stats as Array<{ key: string; value: string }>).map((s) => [s.key.toLowerCase(), s]))
      const merged = existing.map((s) => updateMap.has(s.key.toLowerCase()) ? updateMap.get(s.key.toLowerCase())! : s)
      const mergedKeys = new Set(merged.map((s) => s.key.toLowerCase()))
      for (const s of input.stats as Array<{ key: string; value: string }>) {
        if (!mergedKeys.has(s.key.toLowerCase())) merged.push(s)
      }
      await writeClient.patch(docId).set({ quickStats: merged }).commit()
      const changed = (input.stats as Array<{ key: string; value: string }>).map((s) => `${s.key}: ${s.value}`).join(', ')
      return `Updated stats for ${input.slug}: ${changed}. Live within 60 seconds.`
    }

    case 'update_community_text': {
      const ALLOWED = ['heroHeadline', 'heroSubheadline', 'overviewTitle', 'metaTitle', 'metaDescription']
      if (!ALLOWED.includes(input.field)) return `Field "${input.field}" is not editable via this tool.`
      const docId = await getOrCreateCommunityDoc(input.slug)
      await writeClient.patch(docId).set({ [input.field]: input.value }).commit()
      return `Updated ${input.field} for ${input.slug}. Live within 60 seconds.`
    }

    case 'upload_community_image': {
      const buffer = Buffer.from(input.imageBase64, 'base64')
      const ext = input.mimeType.split('/')[1] ?? 'jpg'
      const asset = await writeClient.assets.upload('image', buffer, {
        filename: `${input.slug}-${input.role}-${Date.now()}.${ext}`,
        contentType: input.mimeType,
      })
      const imageRef = { _type: 'image', asset: { _type: 'reference', _ref: asset._id } }
      const docId = await getOrCreateCommunityDoc(input.slug)

      if (input.role === 'hero') {
        await writeClient.patch(docId).set({ heroImage: imageRef }).commit()
        return `Hero image updated for ${input.slug}. Live within 60 seconds.`
      } else {
        const current = await client.fetch<{ sectionImages?: Array<{ role: string; image: any }> }>(
          `*[_id == $id][0]{ sectionImages[]{ role, image } }`,
          { id: docId }
        )
        const existing = (current?.sectionImages ?? []).filter((s) => s.role !== input.role)
        existing.push({ role: input.role, image: imageRef })
        await writeClient.patch(docId).set({ sectionImages: existing }).commit()
        return `"${input.role}" section image updated for ${input.slug}. Live within 60 seconds.`
      }
    }

    case 'get_homepage_content': {
      const doc = await client.fetch(
        `*[_type == "homepage" && _id == "homepage"][0]{
          heroHeadline, heroSubheadline, ctaStripHeadline, ctaStripBody,
          trustStats[]{ value, label }
        }`
      )
      return doc ? JSON.stringify(doc, null, 2) : 'Homepage document not found in CMS.'
    }

    case 'update_homepage_field': {
      const ALLOWED = ['heroHeadline', 'heroSubheadline', 'ctaStripHeadline', 'ctaStripBody']
      if (!ALLOWED.includes(input.field)) return `Field "${input.field}" is not editable.`
      await writeClient.patch('homepage').set({ [input.field]: input.value }).commit()
      return `Updated homepage ${input.field}. Live within 60 seconds.`
    }

    default:
      return `Unknown tool: ${name}`
  }
}
