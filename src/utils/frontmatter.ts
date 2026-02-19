/**
 * Parse and build YAML-like frontmatter for policy markdown bodies.
 * Format: ---\nkey: value\n...\n---\ncontent
 */

export const RESERVED_FRONTMATTER_KEYS = ['slug', 'last_review_date', 'document_control_id'] as const

export interface ParsedFrontmatter {
  frontmatter: Record<string, string>
  content: string
}

/**
 * Parse body into frontmatter object and content. Keys are lowercased.
 */
export function parseFrontmatter(body: string): ParsedFrontmatter {
  const trimmed = (body || '').trim()
  const result: Record<string, string> = {}
  let content = trimmed

  if (trimmed.startsWith('---')) {
    const rest = trimmed.slice(3)
    const end = rest.indexOf('---')
    if (end !== -1) {
      const block = rest.slice(0, end).trim()
      content = rest.slice(end + 3).trimStart()
      for (const line of block.split(/\r?\n/)) {
        const colonIndex = line.indexOf(':')
        if (colonIndex > 0) {
          const key = line.slice(0, colonIndex).trim().toLowerCase()
          let value = line.slice(colonIndex + 1).trim()
          if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1)
          }
          result[key] = value
        }
      }
    }
  }

  return { frontmatter: result, content }
}

/**
 * Build body from frontmatter and content. Escapes values that contain colons/newlines by quoting.
 */
export function buildBody(frontmatter: Record<string, string>, content: string): string {
  const lines: string[] = []
  for (const [k, v] of Object.entries(frontmatter)) {
    if (v === undefined || v === null) continue
    const s = String(v)
    const needsQuotes = /[\n\r:]/.test(s) || s.trim() !== s
    lines.push(needsQuotes ? `${k}: "${s.replace(/"/g, '\\"')}"` : `${k}: ${s}`)
  }
  if (lines.length === 0) return content
  return `---\n${lines.join('\n')}\n---\n${content || ''}`
}

/**
 * Check if frontmatter contains any reserved keys. Returns list of reserved keys found.
 */
export function getReservedKeysInFrontmatter(frontmatter: Record<string, string>): string[] {
  return RESERVED_FRONTMATTER_KEYS.filter((key) => key in frontmatter)
}
