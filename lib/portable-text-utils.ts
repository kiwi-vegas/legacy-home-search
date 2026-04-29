/**
 * Shared Portable Text utilities.
 *
 * Handles converting markdown-flavored text (with [text](url) links, ## headings,
 * bullet points, and seller CTAs) into Sanity Portable Text blocks.
 *
 * All external links get _type: 'link' markDefs — the PortableText renderer
 * in components/PortableText.tsx opens them with target="_blank" automatically.
 */

import type { PortableTextBlock, PortableTextSpan } from './types'

const SELLER_URL = 'https://listings.legacyhomesearch.com/seller'
const SELLER_CTA_RE = /\[SELLER_CTA:\s*([^\]]+)\]/
const MD_LINK_RE = /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g

function makeKey(): string {
  return Math.random().toString(36).slice(2, 10)
}

/**
 * Parses a line of text that may contain:
 *   - [SELLER_CTA: link text]  → seller portal link
 *   - [display text](https://url)  → regular external link (opens in new tab)
 * Returns a Portable Text block with all links wired up as markDefs.
 */
export function lineToBlock(line: string, style: PortableTextBlock['style'] = 'normal'): PortableTextBlock {
  const markDefs: Array<{ _type: string; _key: string; href: string }> = []
  const children: PortableTextSpan[] = []

  // Seller CTA takes precedence if present (different syntax)
  const sellerMatch = SELLER_CTA_RE.exec(line)
  if (sellerMatch) {
    const linkText = sellerMatch[1].trim()
    const before = line.slice(0, sellerMatch.index).trimEnd()
    const after = line.slice(sellerMatch.index + sellerMatch[0].length).trimStart()
    const linkKey = makeKey()
    markDefs.push({ _type: 'link', _key: linkKey, href: SELLER_URL })
    if (before) children.push({ _type: 'span', _key: makeKey(), text: before + ' ', marks: [] })
    children.push({ _type: 'span', _key: makeKey(), text: linkText, marks: [linkKey] })
    if (after) children.push({ _type: 'span', _key: makeKey(), text: ' ' + after, marks: [] })

    return { _type: 'block', _key: makeKey(), style, markDefs, children }
  }

  // Scan for markdown links [text](url)
  let lastIndex = 0
  let match: RegExpExecArray | null
  MD_LINK_RE.lastIndex = 0

  while ((match = MD_LINK_RE.exec(line)) !== null) {
    // Plain text before this link
    if (match.index > lastIndex) {
      children.push({ _type: 'span', _key: makeKey(), text: line.slice(lastIndex, match.index), marks: [] })
    }
    const linkKey = makeKey()
    markDefs.push({ _type: 'link', _key: linkKey, href: match[2] })
    children.push({ _type: 'span', _key: makeKey(), text: match[1], marks: [linkKey] })
    lastIndex = match.index + match[0].length
  }

  // Remaining text after last link
  if (lastIndex < line.length) {
    children.push({ _type: 'span', _key: makeKey(), text: line.slice(lastIndex), marks: [] })
  }

  if (children.length === 0) {
    children.push({ _type: 'span', _key: makeKey(), text: line, marks: [] })
  }

  return { _type: 'block', _key: makeKey(), style, markDefs, children }
}

/**
 * Converts a multi-line markdown-style string to Portable Text blocks.
 * Handles: ## h2, ### h3, - bullets, • bullets, [text](url) links, [SELLER_CTA:...].
 */
export function markdownToPortableText(text: string): PortableTextBlock[] {
  return text
    .split('\n')
    .filter((l) => l.trim())
    .map((line) => {
      const trimmed = line.trim()

      if (trimmed.startsWith('## ')) {
        return lineToBlock(trimmed.slice(3), 'h2')
      }
      if (trimmed.startsWith('### ')) {
        return lineToBlock(trimmed.slice(4), 'h3')
      }
      if (trimmed.startsWith('> ')) {
        return lineToBlock(trimmed.slice(2), 'blockquote')
      }
      if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
        return lineToBlock('• ' + trimmed.slice(2))
      }

      return lineToBlock(trimmed)
    })
}

/**
 * Converts Portable Text blocks back to a markdown-like string.
 * Preserves heading styles, existing links as [text](url), and seller CTAs as [text](url).
 * Used when re-enriching existing post bodies.
 */
export function portableTextToMarkdown(blocks: any[]): string {
  return blocks
    .filter((b) => b._type === 'block')
    .map((block) => {
      const text = (block.children as any[])
        .map((child) => {
          let t: string = child.text ?? ''
          // Restore any existing links to [text](url) syntax
          const linkMarkKey = (child.marks as string[] ?? []).find((m) =>
            (block.markDefs as any[] ?? []).some((d: any) => d._key === m && d._type === 'link')
          )
          if (linkMarkKey) {
            const def = (block.markDefs as any[]).find((d: any) => d._key === linkMarkKey)
            t = `[${t.trim()}](${def.href})`
          }
          return t
        })
        .join('')
        .trim()

      if (block.style === 'h2') return `## ${text}`
      if (block.style === 'h3') return `### ${text}`
      if (block.style === 'blockquote') return `> ${text}`
      if (text.startsWith('• ')) return `- ${text.slice(2)}`
      return text
    })
    .join('\n')
}
