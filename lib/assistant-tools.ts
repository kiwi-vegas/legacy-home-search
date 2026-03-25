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
  // ── Site Settings ───────────────────────────────────────────────────────────
  {
    name: 'get_site_settings',
    description: 'Reads the current site-wide contact details: phone number, email, address, brokerage name, tagline, and agent/team name.',
    input_schema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'update_site_settings',
    description: 'Updates one or more site-wide fields. Allowed fields: phone, email, address, brokerage, tagline, agentName. Changes go live within 60 seconds.',
    input_schema: {
      type: 'object',
      properties: {
        fields: {
          type: 'object',
          description: 'Key/value pairs to update, e.g. { "phone": "(757) 555-1234", "email": "info@legacyhomesearch.com" }',
          properties: {
            phone: { type: 'string' },
            email: { type: 'string' },
            address: { type: 'string' },
            brokerage: { type: 'string' },
            tagline: { type: 'string' },
            agentName: { type: 'string' },
          },
        },
      },
      required: ['fields'],
    },
  },

  // ── Team Members ────────────────────────────────────────────────────────────
  {
    name: 'get_team_members',
    description: 'Returns the full list of team members (name, slug, title, phone, email, active status).',
    input_schema: { type: 'object', properties: {
      includeInactive: { type: 'boolean', description: 'Set true to include archived/inactive agents. Default false.' },
    }, required: [] },
  },
  {
    name: 'get_agent_details',
    description: 'Fetches all details for a specific agent by their slug.',
    input_schema: {
      type: 'object',
      properties: {
        slug: { type: 'string', description: 'Agent slug, e.g. "barry-jenkins"' },
      },
      required: ['slug'],
    },
  },
  {
    name: 'update_agent_info',
    description: 'Updates one or more fields for an existing agent. Updatable fields: name, title, phone, email, subdomain, years, transactions, bio (array of paragraph strings), specialties (array of strings), sortOrder.',
    input_schema: {
      type: 'object',
      properties: {
        slug: { type: 'string', description: 'Agent slug to update' },
        fields: {
          type: 'object',
          description: 'Fields to update. bio should be an array of paragraph strings. specialties should be an array of strings.',
          properties: {
            name: { type: 'string' },
            title: { type: 'string' },
            phone: { type: 'string' },
            email: { type: 'string' },
            subdomain: { type: 'string' },
            years: { type: 'string' },
            transactions: { type: 'string' },
            bio: { type: 'array', items: { type: 'string' } },
            specialties: { type: 'array', items: { type: 'string' } },
            sortOrder: { type: 'number' },
          },
        },
      },
      required: ['slug', 'fields'],
    },
  },
  {
    name: 'upload_agent_photo',
    description: 'Uploads an image and sets it as the headshot for an agent. The image is automatically extracted from the conversation — do NOT include imageBase64 or mimeType in your call.',
    input_schema: {
      type: 'object',
      properties: {
        slug: { type: 'string', description: 'Agent slug' },
        imageBase64: { type: 'string', description: 'Leave blank — auto-filled from conversation' },
        mimeType: { type: 'string', description: 'Leave blank — auto-filled from conversation' },
      },
      required: ['slug'],
    },
  },
  {
    name: 'add_team_member',
    description: 'Creates a new agent profile on the team. The agent will appear live on the /team page within 60 seconds. If the client uploads a photo in the same message, it will be attached automatically.',
    input_schema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Full name' },
        title: { type: 'string', description: 'Role, e.g. "REALTOR®"' },
        phone: { type: 'string' },
        email: { type: 'string' },
        subdomain: { type: 'string', description: 'Personal listings URL, e.g. https://jane.legacyhomesearch.com' },
        bio: { type: 'array', items: { type: 'string' }, description: 'Bio paragraphs' },
        specialties: { type: 'array', items: { type: 'string' } },
        years: { type: 'string', description: 'Years of experience, e.g. "5+"' },
        transactions: { type: 'string', description: 'Transaction count, e.g. "100+"' },
        imageBase64: { type: 'string', description: 'Leave blank — auto-filled from conversation if photo uploaded' },
        mimeType: { type: 'string', description: 'Leave blank — auto-filled from conversation' },
      },
      required: ['name'],
    },
  },
  {
    name: 'deactivate_team_member',
    description: 'Hides an agent from the website by marking them inactive. Their record is preserved — use reactivate_team_member to bring them back.',
    input_schema: {
      type: 'object',
      properties: {
        slug: { type: 'string', description: 'Agent slug to deactivate' },
      },
      required: ['slug'],
    },
  },
  {
    name: 'reactivate_team_member',
    description: 'Re-activates a previously deactivated agent so they appear on the site again.',
    input_schema: {
      type: 'object',
      properties: {
        slug: { type: 'string', description: 'Agent slug to reactivate' },
      },
      required: ['slug'],
    },
  },

  {
    name: 'update_homepage_stats',
    description: 'Updates the stats bar on the homepage (e.g. "500+ Families Helped", "12+ Years in Hampton Roads"). Pass the full set of stats you want displayed — this replaces all existing stats. Each stat needs a value (e.g. "12+", "$350M+", "5★") and a label (e.g. "Years in Hampton Roads").',
    input_schema: {
      type: 'object',
      properties: {
        stats: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              value: { type: 'string', description: 'The display value, e.g. "12+", "$350M+", "500+", "5★"' },
              label: { type: 'string', description: 'The label below the value, e.g. "Years in Hampton Roads"' },
            },
            required: ['value', 'label'],
          },
        },
      },
      required: ['stats'],
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

    case 'get_site_settings': {
      const doc = await client.fetch(
        `*[_type == "siteSettings" && _id == "siteSettings"][0]{
          agentName, phone, email, licenseNumber, address, brokerage, tagline
        }`
      )
      return doc ? JSON.stringify(doc, null, 2) : 'No site settings found in CMS.'
    }

    case 'update_site_settings': {
      const ALLOWED_SETTINGS = ['phone', 'email', 'address', 'brokerage', 'tagline', 'agentName']
      const fields = input.fields as Record<string, string>
      const updates: Record<string, string> = {}
      for (const [k, v] of Object.entries(fields)) {
        if (ALLOWED_SETTINGS.includes(k)) updates[k] = v
      }
      if (Object.keys(updates).length === 0) return 'No valid fields to update.'
      const existing = await client.fetch<{ _id: string } | null>(
        `*[_type == "siteSettings" && _id == "siteSettings"][0]{ _id }`
      )
      if (!existing?._id) {
        await writeClient.createIfNotExists({ _type: 'siteSettings', _id: 'siteSettings' })
      }
      await writeClient.patch('siteSettings').set(updates).commit()
      const summary = Object.entries(updates).map(([k, v]) => `${k}: "${v}"`).join(', ')
      return `Updated site settings — ${summary}. Live within 60 seconds.`
    }

    case 'get_team_members': {
      const includeInactive = input.includeInactive === true
      const query = includeInactive
        ? `*[_type == "teamMember"] | order(sortOrder asc, name asc){ _id, name, "slug": slug.current, title, phone, email, active, sortOrder }`
        : `*[_type == "teamMember" && active != false] | order(sortOrder asc, name asc){ _id, name, "slug": slug.current, title, phone, email, active, sortOrder }`
      const members = await client.fetch(query)
      return JSON.stringify(members, null, 2)
    }

    case 'get_agent_details': {
      const agent = await client.fetch(
        `*[_type == "teamMember" && slug.current == $slug][0]{
          _id, name, "slug": slug.current, title, phone, email,
          subdomain, bio, specialties, years, transactions, sortOrder, active,
          "hasPhoto": defined(photo)
        }`,
        { slug: input.slug }
      )
      if (!agent) return `No agent found with slug "${input.slug}".`
      return JSON.stringify(agent, null, 2)
    }

    case 'update_agent_info': {
      const ALLOWED_AGENT_FIELDS = ['name', 'title', 'phone', 'email', 'subdomain', 'years', 'transactions', 'bio', 'specialties', 'sortOrder']
      const agent = await client.fetch<{ _id: string } | null>(
        `*[_type == "teamMember" && slug.current == $slug][0]{ _id }`,
        { slug: input.slug }
      )
      if (!agent?._id) return `No agent found with slug "${input.slug}".`
      const fields = input.fields as Record<string, any>
      const updates: Record<string, any> = {}
      for (const [k, v] of Object.entries(fields)) {
        if (ALLOWED_AGENT_FIELDS.includes(k)) updates[k] = v
      }
      if (Object.keys(updates).length === 0) return 'No valid fields to update.'
      await writeClient.patch(agent._id).set(updates).commit()
      const summary = Object.keys(updates).join(', ')
      return `Updated ${summary} for ${input.slug}. Live within 60 seconds.`
    }

    case 'upload_agent_photo': {
      const agent = await client.fetch<{ _id: string } | null>(
        `*[_type == "teamMember" && slug.current == $slug][0]{ _id }`,
        { slug: input.slug }
      )
      if (!agent?._id) return `No agent found with slug "${input.slug}".`
      const buffer = Buffer.from(input.imageBase64, 'base64')
      const ext = (input.mimeType as string).split('/')[1] ?? 'jpg'
      const asset = await writeClient.assets.upload('image', buffer, {
        filename: `team-${input.slug}-${Date.now()}.${ext}`,
        contentType: input.mimeType,
      })
      await writeClient.patch(agent._id).set({
        photo: { _type: 'image', asset: { _type: 'reference', _ref: asset._id } },
      }).commit()
      return `Photo updated for ${input.slug}. It will appear on the site within 60 seconds.`
    }

    case 'add_team_member': {
      const slugText = (input.name as string).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      // Check for slug collision
      const existing = await client.fetch<{ _id: string } | null>(
        `*[_type == "teamMember" && slug.current == $slug][0]{ _id }`,
        { slug: slugText }
      )
      if (existing?._id) return `An agent with slug "${slugText}" already exists. Update them with update_agent_info instead.`

      const doc: Record<string, any> = {
        _type: 'teamMember',
        name: input.name,
        slug: { _type: 'slug', current: slugText },
        active: true,
        sortOrder: 99,
      }
      const optionalFields = ['title', 'phone', 'email', 'subdomain', 'bio', 'specialties', 'years', 'transactions']
      for (const f of optionalFields) {
        if (input[f] !== undefined) doc[f] = input[f]
      }

      const created = await writeClient.create(doc)

      // Attach photo if one was uploaded in the conversation
      if (input.imageBase64 && input.mimeType) {
        const buffer = Buffer.from(input.imageBase64 as string, 'base64')
        const ext = (input.mimeType as string).split('/')[1] ?? 'jpg'
        const asset = await writeClient.assets.upload('image', buffer, {
          filename: `team-${slugText}-${Date.now()}.${ext}`,
          contentType: input.mimeType as string,
        })
        await writeClient.patch(created._id).set({
          photo: { _type: 'image', asset: { _type: 'reference', _ref: asset._id } },
        }).commit()
      }

      return `Created agent profile for ${input.name} (slug: ${slugText}). Their profile is live at /team/${slugText} within 60 seconds.`
    }

    case 'deactivate_team_member': {
      const agent = await client.fetch<{ _id: string; name: string } | null>(
        `*[_type == "teamMember" && slug.current == $slug][0]{ _id, name }`,
        { slug: input.slug }
      )
      if (!agent?._id) return `No agent found with slug "${input.slug}".`
      await writeClient.patch(agent._id).set({ active: false }).commit()
      return `${agent.name} has been archived and removed from the site. Their record is preserved — use reactivate_team_member if they rejoin.`
    }

    case 'reactivate_team_member': {
      const agent = await client.fetch<{ _id: string; name: string } | null>(
        `*[_type == "teamMember" && slug.current == $slug][0]{ _id, name }`,
        { slug: input.slug }
      )
      if (!agent?._id) return `No agent found with slug "${input.slug}".`
      await writeClient.patch(agent._id).set({ active: true }).commit()
      return `${agent.name} is now active again and will appear on the site within 60 seconds.`
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

    case 'update_homepage_stats': {
      const stats = (input.stats as Array<{ value: string; label: string }>).map((s) => ({
        _type: 'object',
        _key: Math.random().toString(36).slice(2, 8),
        value: s.value,
        label: s.label,
      }))
      // Ensure homepage doc exists
      const existing = await client.fetch<{ _id: string } | null>(
        `*[_type == "homepage" && _id == "homepage"][0]{ _id }`
      )
      if (!existing?._id) {
        await writeClient.createIfNotExists({ _type: 'homepage', _id: 'homepage' })
      }
      await writeClient.patch('homepage').set({ trustStats: stats }).commit()
      const summary = (input.stats as Array<{ value: string; label: string }>)
        .map((s) => `${s.value} ${s.label}`).join(', ')
      return `Updated homepage stats: ${summary}. Live within 60 seconds.`
    }

    default:
      return `Unknown tool: ${name}`
  }
}
