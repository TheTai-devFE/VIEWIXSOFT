/**
 * Build-time remark plugin for blog MDX. It adds `readingMinutes` and `toc`
 * to the post's frontmatter and gives every H2/H3 an `id`, so the table of
 * contents and reading time exist without parsing anything at runtime.
 * Must run after remark-frontmatter and before remark-mdx-frontmatter.
 */

interface MdNode {
  type: string
  value?: string
  depth?: number
  children?: MdNode[]
  data?: { hProperties?: Record<string, unknown> }
}

export interface TocEntry {
  depth: 2 | 3
  text: string
  id: string
}

const WORDS_PER_MINUTE = 230

export function slugifyHeading(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function textOf(node: MdNode): string {
  if (node.type === 'text' || node.type === 'inlineCode') return node.value ?? ''
  return (node.children ?? []).map(textOf).join('')
}

export default function remarkBlogMeta() {
  return (tree: MdNode) => {
    let words = 0
    const toc: TocEntry[] = []
    const used = new Map<string, number>()

    const walk = (node: MdNode) => {
      if ((node.type === 'text' || node.type === 'inlineCode') && node.value) {
        words += node.value.split(/\s+/).filter(Boolean).length
      }
      if (node.type === 'heading' && (node.depth === 2 || node.depth === 3)) {
        const text = textOf(node).trim()
        const base = slugifyHeading(text) || 'section'
        const n = used.get(base) ?? 0
        used.set(base, n + 1)
        const id = n === 0 ? base : `${base}-${n}`
        node.data = { ...node.data, hProperties: { ...node.data?.hProperties, id } }
        toc.push({ depth: node.depth, text, id })
      }
      node.children?.forEach(walk)
    }
    walk(tree)

    const yaml = tree.children?.find((n) => n.type === 'yaml')
    if (yaml) {
      // JSON is valid YAML, so the generated values need no escaping rules of their own.
      const minutes = Math.max(1, Math.round(words / WORDS_PER_MINUTE))
      yaml.value = `${yaml.value ?? ''}\nreadingMinutes: ${minutes}\ntoc: ${JSON.stringify(toc)}`
    }
  }
}
