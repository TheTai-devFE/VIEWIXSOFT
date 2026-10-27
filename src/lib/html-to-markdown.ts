/**
 * Converts rich HTML from clipboard (e.g. copied from Google Docs, Microsoft Word,
 * Notion, ChatGPT, or web pages) into clean, standard Markdown.
 */
export function htmlToMarkdown(html: string): string {
  if (!html || typeof html !== 'string') return ''

  if (typeof DOMParser === 'undefined') {
    return html.replace(/<[^>]+>/g, '').trim()
  }

  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    return parseNode(doc.body).replace(/\n{3,}/g, '\n\n').trim()
  } catch {
    return html.replace(/<[^>]+>/g, '').trim()
  }
}

function parseNode(
  node: Node,
  context: { inList?: boolean; inTable?: boolean } = {},
): string {
  if (node.nodeType === 3 /* Node.TEXT_NODE */) {
    const text = node.textContent || ''
    return text.replace(/\s+/g, ' ')
  }

  if (node.nodeType !== 1 /* Node.ELEMENT_NODE */) {
    return ''
  }

  const el = node as HTMLElement
  const tag = el.tagName.toUpperCase()

  // Google Docs & Word inline styles
  const isBold =
    tag === 'B' ||
    tag === 'STRONG' ||
    el.style.fontWeight === 'bold' ||
    parseInt(el.style.fontWeight || '0', 10) >= 600

  const isItalic =
    tag === 'I' ||
    tag === 'EM' ||
    el.style.fontStyle === 'italic'

  const isStrike =
    tag === 'S' ||
    tag === 'STRIKE' ||
    tag === 'DEL' ||
    el.style.textDecoration?.includes('line-through')

  const isCode = tag === 'CODE'

  const parseChildren = (customCtx = context) => {
    let result = ''
    for (let i = 0; i < el.childNodes.length; i++) {
      const child = el.childNodes[i]
      if (child) {
        result += parseNode(child, customCtx)
      }
    }
    return result
  }

  switch (tag) {
    case 'H1':
      return `\n\n# ${parseChildren().trim()}\n\n`
    case 'H2':
      return `\n\n## ${parseChildren().trim()}\n\n`
    case 'H3':
      return `\n\n### ${parseChildren().trim()}\n\n`
    case 'H4':
      return `\n\n#### ${parseChildren().trim()}\n\n`
    case 'H5':
    case 'H6':
      return `\n\n##### ${parseChildren().trim()}\n\n`

    case 'P': {
      const inner = parseChildren().trim()
      return inner ? `\n\n${inner}\n\n` : ''
    }

    case 'BR':
      return '\n'

    case 'HR':
      return '\n\n---\n\n'

    case 'A': {
      const href = el.getAttribute('href') || ''
      const inner = parseChildren().trim()
      if (!href) return inner
      return `[${inner || href}](${href})`
    }

    case 'IMG': {
      const src = el.getAttribute('src') || ''
      const alt = el.getAttribute('alt') || 'Image'
      if (!src) return ''
      return `\n\n![${alt}](${src})\n\n`
    }

    case 'BLOCKQUOTE': {
      const inner = parseChildren().trim()
      if (!inner) return ''
      const quoted = inner
        .split('\n')
        .map((line) => `> ${line}`)
        .join('\n')
      return `\n\n${quoted}\n\n`
    }

    case 'PRE': {
      const code = el.textContent || ''
      return `\n\n\`\`\`\n${code.trim()}\n\`\`\`\n\n`
    }

    case 'UL': {
      let output = '\n'
      for (let i = 0; i < el.children.length; i++) {
        const li = el.children[i]
        if (li && li.tagName === 'LI') {
          const itemText = parseNode(li, { ...context, inList: true }).trim()
          output += `- ${itemText}\n`
        }
      }
      return `${output}\n`
    }

    case 'OL': {
      let output = '\n'
      let count = 1
      for (let i = 0; i < el.children.length; i++) {
        const li = el.children[i]
        if (li && li.tagName === 'LI') {
          const itemText = parseNode(li, { ...context, inList: true }).trim()
          output += `${count}. ${itemText}\n`
          count++
        }
      }
      return `${output}\n`
    }

    case 'LI':
      return parseChildren()

    case 'TABLE': {
      return `\n\n${parseTable(el)}\n\n`
    }

    default: {
      let content = parseChildren()

      if (isCode && !context.inTable) {
        content = `\`${content.trim()}\``
      }
      if (isStrike && content.trim()) {
        content = `~~${content.trim()}~~`
      }
      if (isBold && content.trim()) {
        content = `**${content.trim()}**`
      }
      if (isItalic && content.trim()) {
        content = `*${content.trim()}*`
      }

      if (tag === 'DIV') {
        return `\n${content}\n`
      }

      return content
    }
  }
}

function parseTable(table: HTMLElement): string {
  const rows: string[][] = []
  const trElements = table.querySelectorAll('tr')

  trElements.forEach((tr) => {
    const row: string[] = []
    const cells = tr.querySelectorAll('th, td')
    cells.forEach((cell) => {
      const text = (cell.textContent || '').replace(/\r?\n/g, ' ').replace(/\|/g, '\\|').trim()
      row.push(text || ' ')
    })
    if (row.length > 0) {
      rows.push(row)
    }
  })

  if (rows.length === 0) return ''

  const colCount = Math.max(...rows.map((r) => r.length))
  const normalizedRows = rows.map((r) => {
    const rowCopy = [...r]
    while (rowCopy.length < colCount) rowCopy.push(' ')
    return rowCopy
  })

  const header = normalizedRows[0]
  if (!header) return ''

  const separator = Array(colCount).fill('---')
  const body = normalizedRows.slice(1)

  const headerLine = `| ${header.join(' | ')} |`
  const separatorLine = `| ${separator.join(' | ')} |`
  const bodyLines = body.length > 0 ? '\n' + body.map((r) => `| ${r.join(' | ')} |`).join('\n') : ''

  return `${headerLine}\n${separatorLine}${bodyLines}`
}
