export interface TocEntry {
  depth: 2 | 3
  text: string
  id: string
}

export type TocItem = TocEntry

/**
 * Creates a clean, URL-safe anchor slug for headings, supporting Unicode (Vietnamese, accents, numbers).
 */
export function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * Strips inline markdown tokens like bold, italic, code, links from a heading string.
 */
export function stripHeadingMarkdown(text: string): string {
  return text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // [text](url) -> text
    .replace(/[*_`~]/g, '') // bold, italic, code, strike
    .trim()
}

/**
 * Parses markdown text to extract all H2 and H3 headings into a Table of Contents (TOC).
 * Guarantees unique IDs even when headings share identical names.
 */
export function extractTocFromMarkdown(content: string): TocEntry[] {
  if (!content) return []

  const lines = content.replace(/\r\n/g, '\n').split('\n')
  const toc: TocEntry[] = []
  const usedIds = new Map<string, number>()

  let inCodeBlock = false

  for (const rawLine of lines) {
    const line = rawLine.trim()

    if (line.startsWith('```')) {
      inCodeBlock = !inCodeBlock
      continue
    }
    if (inCodeBlock) continue

    if (line.startsWith('## ') || line.startsWith('### ')) {
      const depth = line.startsWith('## ') ? (2 as const) : (3 as const)
      const rawHeading = depth === 2 ? line.slice(3) : line.slice(4)
      const cleanText = stripHeadingMarkdown(rawHeading)

      if (!cleanText) continue

      const base = slugifyHeading(cleanText) || 'section'
      const count = usedIds.get(base) ?? 0
      usedIds.set(base, count + 1)
      const id = count === 0 ? base : `${base}-${count}`

      toc.push({ depth, text: cleanText, id })
    }
  }

  return toc
}

/**
 * Generates an in-content Markdown Table of Contents box that authors can insert into their posts.
 */
export function generateMarkdownToc(content: string): string {
  const entries = extractTocFromMarkdown(content)
  if (entries.length === 0) {
    return `\n\n> 📑 **Mục lục bài viết**\n> *(Chưa có thẻ Heading ## hoặc ### nào trong bài viết)*\n\n`
  }

  const lines = entries.map((e) => {
    const indent = e.depth === 3 ? '  - ' : '- '
    return `> ${indent}[${e.text}](#${e.id})`
  })

  return `\n\n> 📑 **Mục lục bài viết**\n${lines.join('\n')}\n\n`
}
