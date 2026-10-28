/**
 * Converts blog post bodies between Markdown (how posts are stored, read by
 * MarkdownRenderer, the TOC, the SEO checklist and the .md / llms files) and
 * HTML (the admin's HTML tab and the visual editor). Both directions cover
 * exactly what MarkdownRenderer draws: h1–h4, paragraphs, flat lists,
 * blockquotes, tables, fenced code, images on their own line, rules, and
 * inline links, bold, italic, strikethrough and code. Anything else in pasted
 * HTML is unwrapped or dropped and reported, never kept as raw HTML.
 */

const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

// Same tokens as parseInline in MarkdownRenderer, plus ~~strike~~ from the editor toolbar.
const INLINE = /(\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`|~~([^~]+)~~)/g

function inlineToHtml(text: string) {
  let out = ''
  let last = 0
  for (const m of text.matchAll(INLINE)) {
    out += escapeHtml(text.slice(last, m.index))
    const [full, , linkText, href, bold, italic, code, strike] = m
    if (linkText && href) out += `<a href="${escapeHtml(href)}">${escapeHtml(linkText)}</a>`
    else if (bold) out += `<strong>${escapeHtml(bold)}</strong>`
    else if (italic) out += `<em>${escapeHtml(italic)}</em>`
    else if (code) out += `<code>${escapeHtml(code)}</code>`
    else if (strike) out += `<s>${escapeHtml(strike)}</s>`
    else out += escapeHtml(full)
    last = (m.index ?? 0) + full.length
  }
  return out + escapeHtml(text.slice(last))
}

/** Markdown to clean HTML, block by block with MarkdownRenderer's rules. */
export function markdownToHtml(markdown: string): string {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n')
  const blocks: string[] = []
  let paragraph: string[] = []
  let quote: string[] = []
  let list: { ordered: boolean; items: string[] } | null = null
  let table: string[][] = []
  let code: { lang: string; lines: string[] } | null = null

  const flushParagraph = () => {
    if (paragraph.length) blocks.push(`<p>${inlineToHtml(paragraph.join(' '))}</p>`)
    paragraph = []
  }
  const flushQuote = () => {
    if (quote.length) blocks.push(`<blockquote>${quote.map((q) => `<p>${inlineToHtml(q)}</p>`).join('')}</blockquote>`)
    quote = []
  }
  const flushList = () => {
    if (list) {
      const tag = list.ordered ? 'ol' : 'ul'
      blocks.push(`<${tag}>${list.items.map((i) => `<li><p>${inlineToHtml(i)}</p></li>`).join('')}</${tag}>`)
    }
    list = null
  }
  const flushTable = () => {
    if (table.length) {
      const [head = [], ...body] = table
      const row = (cells: string[], tag: 'th' | 'td') => `<tr>${cells.map((c) => `<${tag}><p>${inlineToHtml(c)}</p></${tag}>`).join('')}</tr>`
      blocks.push(`<table><thead>${row(head, 'th')}</thead><tbody>${body.map((r) => row(r, 'td')).join('')}</tbody></table>`)
    }
    table = []
  }
  const flushAll = () => {
    flushParagraph()
    flushQuote()
    flushList()
    flushTable()
  }

  for (const raw of lines) {
    const line = raw.trim()

    if (line.startsWith('```')) {
      if (code) {
        const cls = code.lang ? ` class="language-${escapeHtml(code.lang)}"` : ''
        blocks.push(`<pre><code${cls}>${escapeHtml(code.lines.join('\n'))}</code></pre>`)
        code = null
      } else {
        flushAll()
        code = { lang: line.slice(3).trim(), lines: [] }
      }
      continue
    }
    if (code) {
      code.lines.push(raw)
      continue
    }

    if (line.startsWith('|') && line.endsWith('|')) {
      flushParagraph()
      flushQuote()
      flushList()
      if (!/^\|[\s\-:|]+\|$/.test(line)) table.push(line.slice(1, -1).split('|').map((c) => c.trim()))
      continue
    } else if (table.length) {
      flushTable()
    }

    const unordered = /^[-*]\s+/.test(line)
    const ordered = /^\d+\.\s+/.test(line)
    if (unordered || ordered) {
      flushParagraph()
      flushQuote()
      if (!list || list.ordered !== ordered) {
        flushList()
        list = { ordered, items: [] }
      }
      list.items.push(line.replace(/^[-*]\s+|\d+\.\s+/, ''))
      continue
    } else if (list) {
      flushList()
    }

    if (line.startsWith('> ')) {
      flushParagraph()
      flushList()
      flushTable()
      quote.push(line.slice(2))
      continue
    } else if (quote.length) {
      flushQuote()
    }

    if (!line) {
      flushAll()
      continue
    }

    const heading = line.match(/^(#{1,4}) (.*)$/)
    if (heading?.[1] && heading[2] !== undefined) {
      flushAll()
      const level = heading[1].length
      blocks.push(`<h${level}>${inlineToHtml(heading[2])}</h${level}>`)
      continue
    }
    if (line.startsWith('---') || line === '***') {
      flushAll()
      blocks.push('<hr>')
      continue
    }
    const image = line.match(/^!\[([^\]]*)\]\(([^)\s]+)\)$/)
    if (image) {
      flushAll()
      blocks.push(`<img src="${escapeHtml(image[2] ?? '')}" alt="${escapeHtml(image[1] ?? '')}">`)
      continue
    }
    paragraph.push(line)
  }
  if (code) blocks.push(`<pre><code>${escapeHtml(code.lines.join('\n'))}</code></pre>`)
  flushAll()
  return blocks.join('\n')
}

// ─── HTML → Markdown ──────────────────────────────────────────────────────────

/** Elements removed with their content: nothing in them belongs in a post. */
const DROPPED = new Set(['script', 'style', 'iframe', 'object', 'embed', 'video', 'audio', 'canvas', 'svg', 'form', 'input', 'button', 'select', 'textarea', 'noscript', 'template'])
/** Containers whose content is kept and whose wrapper is dropped silently. */
const WRAPPERS = new Set(['div', 'section', 'article', 'main', 'header', 'footer', 'aside', 'figure', 'body', 'html', 'center', 'tbody', 'thead', 'tfoot'])
/** Inline elements read as plain text silently (common in pasted Google Docs or Word HTML). */
const PLAIN_INLINE = new Set(['span', 'font', 'abbr', 'cite', 'small', 'label', 'time', 'bdi', 'bdo', 'q', 'dfn', 'kbd', 'samp', 'var', 'big', 'wbr'])

export interface HtmlToMarkdownResult {
  markdown: string
  /** Tags MarkdownRenderer cannot draw, which were unwrapped or removed. */
  dropped: string[]
}

const tagOf = (node: Node) => (node.nodeType === 1 ? (node as Element).tagName.toLowerCase() : '')
const squash = (s: string) => s.replace(/\s+/g, ' ')
/** Characters MarkdownRenderer would read as syntax are kept away from the separators it splits on. */
const cellText = (s: string) => s.replace(/\|/g, '/').trim()

class Converter {
  dropped = new Set<string>()

  inline(nodes: Iterable<Node>): string {
    let out = ''
    for (const node of nodes) out += this.inlineNode(node)
    return out
  }

  private wrap(mark: string, node: Node) {
    const inner = this.inline(node.childNodes)
    const text = inner.trim()
    if (!text) return inner
    // MarkdownRenderer can't nest marks; the inner formatting (a link, code) wins.
    if (/[[`*~]/.test(text)) return inner
    const lead = inner.match(/^\s*/)?.[0] ?? ''
    const trail = inner.match(/\s*$/)?.[0] ?? ''
    return `${lead}${mark}${text}${mark}${trail}`
  }

  private inlineNode(node: Node): string {
    if (node.nodeType === 3) return squash(node.textContent ?? '')
    if (node.nodeType !== 1) return ''
    const el = node as Element
    const tag = tagOf(node)
    if (DROPPED.has(tag)) {
      this.dropped.add(tag)
      return ''
    }
    switch (tag) {
      case 'strong':
      case 'b':
        return this.wrap('**', node)
      case 'em':
      case 'i':
        return this.wrap('*', node)
      case 's':
      case 'strike':
      case 'del':
        return this.wrap('~~', node)
      case 'code': {
        const text = squash(el.textContent ?? '').trim()
        return text ? `\`${text.replace(/`/g, "'")}\`` : ''
      }
      case 'a': {
        const text = squash(el.textContent ?? '').trim()
        const href = el.getAttribute('href')?.trim()
        return text && href ? `[${text.replace(/[[\]]/g, '')}](${href.replace(/[()\s]/g, encodeURIComponent)})` : text
      }
      case 'br':
        return ' '
      case 'img':
        // Images only render on their own line; block() lifts them out.
        return ''
      default:
        if (!PLAIN_INLINE.has(tag)) this.dropped.add(tag)
        return this.inline(node.childNodes)
    }
  }

  /** Images inside a paragraph or list item, which Markdown keeps on lines of their own. */
  private images(node: Node): string[] {
    const found: string[] = []
    const walk = (n: Node) => {
      if (tagOf(n) === 'img') {
        const img = n as Element
        const src = img.getAttribute('src')?.trim()
        if (src && !src.startsWith('data:')) found.push(`![${(img.getAttribute('alt') ?? '').replace(/[[\]]/g, '')}](${src})`)
        else if (src) this.dropped.add('img (data:)')
      } else n.childNodes.forEach(walk)
    }
    walk(node)
    return found
  }

  /** The inline text of a cell or list item, whose lines may be wrapped in <p>. */
  private paragraphs(el: Element, skip: (n: Node) => boolean = () => false) {
    return Array.from(el.childNodes)
      .filter((c) => !skip(c))
      .map((c) => (tagOf(c) === 'p' ? this.inline(c.childNodes) : this.inlineNode(c)))
      .join(' ')
  }

  private listItems(list: Element, ordered: boolean, out: string[]) {
    let n = 0
    for (const li of Array.from(list.children)) {
      if (tagOf(li) !== 'li') continue
      // Nested lists flatten into the same level: MarkdownRenderer draws one level.
      const text = this.paragraphs(li, (c) => ['ul', 'ol'].includes(tagOf(c))).trim()
      if (text) out.push(`${ordered ? `${++n}.` : '-'} ${squash(text)}`)
      for (const child of Array.from(li.children)) {
        const tag = tagOf(child)
        if (tag === 'ul' || tag === 'ol') this.listItems(child, tag === 'ol', out)
      }
    }
  }

  block(node: Node, out: string[]) {
    if (node.nodeType === 3) {
      const text = squash(node.textContent ?? '').trim()
      if (text) out.push(text)
      return
    }
    if (node.nodeType !== 1) return
    const el = node as Element
    const tag = tagOf(node)
    if (DROPPED.has(tag)) {
      this.dropped.add(tag)
      return
    }
    switch (tag) {
      case 'h1':
      case 'h2':
      case 'h3':
      case 'h4':
      case 'h5':
      case 'h6': {
        const text = this.inline(el.childNodes).trim()
        if (text) out.push(`${'#'.repeat(Math.min(Number(tag[1]), 4))} ${squash(text)}`)
        return
      }
      case 'p':
      case 'figcaption': {
        const text = this.inline(el.childNodes).trim()
        if (text) out.push(squash(text))
        out.push(...this.images(el))
        return
      }
      case 'img':
        out.push(...this.images(el))
        return
      case 'hr':
        out.push('---')
        return
      case 'pre': {
        const codeEl = el.querySelector('code')
        const lang = codeEl?.getAttribute('class')?.match(/language-([\w+-]+)/)?.[1] ?? ''
        const text = (codeEl ?? el).textContent?.replace(/\n$/, '') ?? ''
        out.push(`\`\`\`${lang}\n${text}\n\`\`\``)
        return
      }
      case 'ul':
      case 'ol': {
        const items: string[] = []
        this.listItems(el, tag === 'ol', items)
        if (items.length) out.push(items.join('\n'))
        return
      }
      case 'blockquote': {
        const inner: string[] = []
        for (const child of Array.from(el.childNodes)) this.block(child, inner)
        const lines = inner.flatMap((b) => b.split('\n')).filter((l) => l.trim())
        if (lines.length) out.push(lines.map((l) => `> ${l}`).join('\n'))
        return
      }
      case 'table': {
        const rows = Array.from(el.querySelectorAll('tr')).map((tr) =>
          Array.from(tr.children)
            .filter((c) => ['td', 'th'].includes(tagOf(c)))
            .map((c) => cellText(squash(this.paragraphs(c))) || ' '),
        )
        const [head, ...body] = rows.filter((r) => r.length)
        if (!head) return
        const line = (cells: string[]) => `| ${cells.join(' | ')} |`
        out.push([line(head), line(head.map(() => '---')), ...body.map(line)].join('\n'))
        return
      }
      case 'li':
        out.push(`- ${squash(this.inline(el.childNodes)).trim()}`)
        return
      default: {
        if (!WRAPPERS.has(tag) && !PLAIN_INLINE.has(tag)) this.dropped.add(tag)
        // Inline runs between blocks become paragraphs; blocks keep their own shape.
        let run: Node[] = []
        const flush = () => {
          const text = squash(this.inline(run)).trim()
          if (text) out.push(text)
          run = []
        }
        for (const child of Array.from(el.childNodes)) {
          const childTag = tagOf(child)
          const isBlock = child.nodeType === 1 && !PLAIN_INLINE.has(childTag) && !['strong', 'b', 'em', 'i', 's', 'strike', 'del', 'code', 'a', 'br', 'u', 'sup', 'sub', 'mark'].includes(childTag)
          if (isBlock) {
            flush()
            this.block(child, out)
          } else run.push(child)
        }
        flush()
      }
    }
  }
}

/**
 * HTML (pasted, typed in the HTML tab, or from the visual editor) to Markdown.
 * `parse` is injectable so tests can run without a browser.
 */
export function htmlToMarkdown(html: string, parse: (html: string) => Document = (h) => new DOMParser().parseFromString(h, 'text/html')): HtmlToMarkdownResult {
  const doc = parse(html)
  const converter = new Converter()
  const out: string[] = []
  converter.block(doc.body, out)
  converter.dropped.delete('body')
  converter.dropped.delete('html')
  return { markdown: out.join('\n\n').trim(), dropped: [...converter.dropped].sort() }
}
