import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { TOOLS, executeToolCall } from '@/lib/assistant-tools'
import { createHmac } from 'crypto'

const COOKIE_NAME = 'assistant_session'
const MAX_TOOL_ITERATIONS = 10

function verifyToken(token: string, secret: string): boolean {
  const lastDot = token.lastIndexOf('.')
  if (lastDot === -1) return false
  const payload = token.slice(0, lastDot)
  const sig = token.slice(lastDot + 1)
  const expected = createHmac('sha256', secret).update(payload).digest('hex')
  return sig === expected
}

const SYSTEM_PROMPT = `You are a content update assistant for Legacy Home Search's website, helping the operator make changes to the site. You have broad permissions to update the site — be confident and action-oriented.

You have access to tools that let you read and update:
- Site-wide contact info (phone, email, address, brokerage, tagline)
- Team member profiles (add, update, archive, reactivate, upload photos)
- Community page stats and text (distances, prices, headlines, meta)
- Community page images (hero background, section images)
- Homepage text fields and stats bar

WHAT YOU CAN DO:
1. SITE SETTINGS — phone number, email address, office address, brokerage name, tagline, team name
2. TEAM MANAGEMENT:
   - Update any agent's phone, email, name, title, bio, specialties, years, or transactions
   - Add a brand-new agent to the team (with or without a photo)
   - Archive/remove an agent who has left (they are hidden, not deleted)
   - Restore an agent who has returned
   - Update an agent's headshot photo when one is uploaded
3. COMMUNITY PAGES — stats, headlines, subheadlines, meta descriptions, images
4. HOMEPAGE — headlines, CTA text, stats bar

PHONE NUMBER CHANGES — when asked to update a phone number:
- Ask whether it's the main office number (site settings) or a specific agent's number
- If specific agent: use update_agent_info with { phone: "..." }
- If site-wide: use update_site_settings with { phone: "..." }

ADDING A NEW AGENT — when asked to add a new team member:
- Collect: name (required), title, phone, email, bio (can write from description), specialties
- If they upload a photo, attach it automatically
- Call add_team_member — the page updates within 60 seconds

REMOVING AN AGENT — when told an agent has left:
- Call deactivate_team_member — their record is preserved but hidden from the site
- Confirm you've archived them, not deleted them permanently

IMAGE UPLOADS — follow these rules exactly:
- When an image is attached, it is automatically available. NEVER ask to upload it again.
- For agent photos: ask which agent if not specified, then call upload_agent_photo with their slug
- For community page images: ask which page and section, then call upload_community_image
- Image uploads take up to 30 seconds — say so before calling the tool
- Confirm what was updated and that it will be live within 60 seconds

WHAT YOU CANNOT DO (decline politely):
- Delete agent records permanently (use deactivate instead)
- Change CSS styles, colors, fonts, or layouts
- Modify navigation structure or footer links
- Edit blog posts or reviews
- Change code or configuration files

Always confirm exactly what you changed. Be friendly, efficient, and specific. Speak in plain English.`

export const maxDuration = 120

export async function POST(req: NextRequest) {
  const secret = process.env.ADMIN_SECRET
  if (!secret) return NextResponse.json({ error: 'Not configured' }, { status: 500 })

  const token = req.cookies.get(COOKIE_NAME)?.value
  if (!token || !verifyToken(token, secret)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { messages?: any[] }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const { messages = [] } = body

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  let conversationMessages: Anthropic.MessageParam[] = messages

  // Find the most recent image in conversation messages (for auto-injection into upload tool)
  function findLatestImage(): { base64: string; mimeType: string } | null {
    for (let i = conversationMessages.length - 1; i >= 0; i--) {
      const msg = conversationMessages[i]
      if (msg.role !== 'user') continue
      const content = Array.isArray(msg.content) ? msg.content : []
      for (const block of content as any[]) {
        if (block.type === 'image' && block.source?.type === 'base64') {
          return { base64: block.source.data, mimeType: block.source.media_type }
        }
      }
    }
    return null
  }

  // Agentic tool-use loop
  for (let i = 0; i < MAX_TOOL_ITERATIONS; i++) {
    const response = await anthropic.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      tools: TOOLS,
      messages: conversationMessages,
    })

    // Append assistant response to conversation
    conversationMessages = [
      ...conversationMessages,
      { role: 'assistant', content: response.content },
    ]

    if (response.stop_reason !== 'tool_use') {
      // Done — extract final text
      const text = response.content
        .filter((b): b is Anthropic.TextBlock => b.type === 'text')
        .map((b) => b.text)
        .join('')

      return NextResponse.json({ reply: text, messages: conversationMessages })
    }

    // Execute all tool calls in this response
    const toolResults: Anthropic.ToolResultBlockParam[] = []
    for (const block of response.content) {
      if (block.type !== 'tool_use') continue
      try {
        const input = { ...(block.input as Record<string, any>) }
        // Auto-inject image data for any upload tool when Claude omits it
        const IMAGE_TOOLS = ['upload_community_image', 'upload_agent_photo', 'add_team_member']
        if (IMAGE_TOOLS.includes(block.name) && !input.imageBase64) {
          const img = findLatestImage()
          if (img) { input.imageBase64 = img.base64; input.mimeType = img.mimeType }
          else if (block.name !== 'add_team_member') {
            // add_team_member is valid without a photo, others require one
            toolResults.push({ type: 'tool_result', tool_use_id: block.id, content: 'Error: No image found in conversation. Ask the user to attach the image.', is_error: true }); continue
          }
        }
        const result = await executeToolCall(block.name, input)
        toolResults.push({ type: 'tool_result', tool_use_id: block.id, content: result })
      } catch (err) {
        toolResults.push({
          type: 'tool_result',
          tool_use_id: block.id,
          content: `Error: ${err instanceof Error ? err.message : 'Unknown error'}`,
          is_error: true,
        })
      }
    }

    conversationMessages = [
      ...conversationMessages,
      { role: 'user', content: toolResults },
    ]
  }

  return NextResponse.json({ reply: 'I hit the maximum number of steps. Please try a simpler request.', messages: conversationMessages })
}
