import { Link } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { slugifyHeading, stripHeadingMarkdown } from '~/lib/toc'

export function parseInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = []
  // Matches [text](url), **bold**, *italic*, `code`
  const regex = /(\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`)/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index))
    }

    const [full, , linkText, linkUrl, boldText, italicText, codeText] = match

    if (linkText && linkUrl) {
      if (linkUrl.startsWith('/') && !linkUrl.startsWith('//')) {
        nodes.push(
          <Link
            key={match.index}
            to={linkUrl}
            className="font-normal text-ink-50 underline decoration-ink-600 underline-offset-4 transition-colors hover:text-signal-300 hover:decoration-signal-400"
          >
            {linkText}
          </Link>,
        )
      } else {
        nodes.push(
          <a
            key={match.index}
            href={linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-normal text-ink-50 underline decoration-ink-600 underline-offset-4 transition-colors hover:text-signal-300 hover:decoration-signal-400"
          >
            {linkText}
          </a>,
        )
      }
    } else if (boldText) {
      nodes.push(
        <strong key={match.index} className="font-semibold text-ink-50">
          {boldText}
        </strong>,
      )
    } else if (italicText) {
      nodes.push(
        <em key={match.index} className="italic text-ink-100">
          {italicText}
        </em>,
      )
    } else if (codeText) {
      nodes.push(
        <code key={match.index} className="rounded bg-ink-900 px-1.5 py-0.5 font-mono text-sm text-ink-100">
          {codeText}
        </code>,
      )
    } else {
      nodes.push(full)
    }

    lastIndex = regex.lastIndex
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex))
  }

  return nodes.length > 0 ? nodes : [text]
}

export function MarkdownRenderer({ content, className }: { content: string; className?: string }) {
  if (!content) return null

  const lines = content.replace(/\r\n/g, '\n').split('\n')
  const elements: ReactNode[] = []
  const usedHeadingIds = new Map<string, number>()

  let inCodeBlock = false
  let codeBlockLines: string[] = []
  let codeBlockLang = ''

  let inList = false
  let isOrderedList = false
  let listItems: string[] = []

  let inTable = false
  let tableRows: string[][] = []

  let paragraphLines: string[] = []
  let quoteLines: string[] = []

  const flushParagraph = () => {
    if (paragraphLines.length === 0) return
    const key = `p-${elements.length}`
    const fullText = paragraphLines.join(' ')
    elements.push(
      <p key={key} className="my-5 text-base leading-relaxed text-ink-300 sm:text-lg">
        {parseInline(fullText)}
      </p>,
    )
    paragraphLines = []
  }

  const flushQuote = () => {
    if (quoteLines.length === 0) return
    const key = `quote-${elements.length}`
    elements.push(
      <blockquote
        key={key}
        className="my-6 rounded-r-xl border-l-4 border-signal-500 bg-signal-950/20 py-3 pl-4 pr-3 italic text-ink-200"
      >
        {quoteLines.map((ql, idx) => (
          <p key={idx} className={idx > 0 ? 'mt-2' : ''}>
            {parseInline(ql)}
          </p>
        ))}
      </blockquote>,
    )
    quoteLines = []
  }

  const flushList = () => {
    if (!inList) return
    const key = `list-${elements.length}`
    if (isOrderedList) {
      elements.push(
        <ol key={key} className="my-4 list-decimal space-y-2 pl-6 text-ink-300 marker:text-signal-400">
          {listItems.map((item, i) => (
            <li key={i} className="pl-1 leading-relaxed">
              {parseInline(item)}
            </li>
          ))}
        </ol>,
      )
    } else {
      elements.push(
        <ul key={key} className="my-4 list-disc space-y-2 pl-6 text-ink-300 marker:text-signal-400">
          {listItems.map((item, i) => (
            <li key={i} className="pl-1 leading-relaxed">
              {parseInline(item)}
            </li>
          ))}
        </ul>,
      )
    }
    inList = false
    listItems = []
  }

  const flushTable = () => {
    if (!inTable) return
    const key = `table-${elements.length}`
    if (tableRows.length > 0) {
      const [headerRow, ...bodyRows] = tableRows
      elements.push(
        <div key={key} className="my-6 overflow-x-auto rounded-xl border border-ink-800">
          <table className="w-full border-collapse text-left text-sm">
            {headerRow && (
              <thead>
                <tr className="border-b border-ink-800 bg-ink-900">
                  {headerRow.map((cell, i) => (
                    <th key={i} className="px-4 py-2.5 font-semibold text-ink-50">
                      {parseInline(cell)}
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody>
              {bodyRows.map((row, rIdx) => (
                <tr key={rIdx} className="border-b border-ink-800 last:border-0 hover:bg-ink-900/50">
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="px-4 py-2.5 text-ink-300">
                      {parseInline(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      )
    }
    inTable = false
    tableRows = []
  }

  const flushAll = () => {
    flushParagraph()
    flushQuote()
    flushList()
    flushTable()
  }

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i] ?? ''
    const line = rawLine.trim()

    // Handle Code Blocks
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        elements.push(
          <pre
            key={`code-${elements.length}`}
            className="my-6 overflow-x-auto rounded-xl border border-ink-800 bg-ink-900 p-4 font-mono text-sm text-ink-100"
          >
            <code>{codeBlockLines.join('\n')}</code>
          </pre>,
        )
        inCodeBlock = false
        codeBlockLines = []
        codeBlockLang = ''
      } else {
        flushAll()
        inCodeBlock = true
        codeBlockLang = line.slice(3).trim()
      }
      continue
    }

    if (inCodeBlock) {
      codeBlockLines.push(rawLine)
      continue
    }

    // Handle Tables
    if (line.startsWith('|') && line.endsWith('|')) {
      flushParagraph()
      flushQuote()
      flushList()
      // Skip separator row like |---|---|
      if (/^\|[\s\-:|]+\|$/.test(line)) {
        continue
      }
      const cells = line
        .slice(1, -1)
        .split('|')
        .map((c) => c.trim())
      inTable = true
      tableRows.push(cells)
      continue
    } else if (inTable) {
      flushTable()
    }

    // Handle Lists
    const isUnordered = /^[-*]\s+/.test(line)
    const isOrdered = /^\d+\.\s+/.test(line)

    if (isUnordered || isOrdered) {
      flushParagraph()
      flushQuote()
      if (!inList || isOrderedList !== isOrdered) {
        flushList()
        inList = true
        isOrderedList = isOrdered
      }
      const itemText = line.replace(/^[-*]\s+|\d+\.\s+/, '')
      listItems.push(itemText)
      continue
    } else if (inList) {
      flushList()
    }

    // Handle Blockquotes
    if (line.startsWith('> ')) {
      flushParagraph()
      flushList()
      flushTable()
      quoteLines.push(line.slice(2))
      continue
    } else if (quoteLines.length > 0) {
      flushQuote()
    }

    // Blank line -> ends paragraphs and other blocks
    if (!line) {
      flushAll()
      continue
    }

    // Headings
    if (line.startsWith('#### ')) {
      flushAll()
      const headingText = line.slice(5)
      const cleanText = stripHeadingMarkdown(headingText)
      const base = slugifyHeading(cleanText) || 'section'
      const count = usedHeadingIds.get(base) ?? 0
      usedHeadingIds.set(base, count + 1)
      const id = count === 0 ? base : `${base}-${count}`

      elements.push(
        <h4 id={id} key={`h4-${elements.length}`} className="mt-8 scroll-mt-24 font-display text-lg font-semibold text-ink-50">
          {parseInline(headingText)}
        </h4>,
      )
      continue
    } else if (line.startsWith('### ')) {
      flushAll()
      const headingText = line.slice(4)
      const cleanText = stripHeadingMarkdown(headingText)
      const base = slugifyHeading(cleanText) || 'section'
      const count = usedHeadingIds.get(base) ?? 0
      usedHeadingIds.set(base, count + 1)
      const id = count === 0 ? base : `${base}-${count}`

      elements.push(
        <h3 id={id} key={`h3-${elements.length}`} className="group mt-10 scroll-mt-24 font-display text-xl font-semibold text-ink-50 sm:text-2xl">
          <a href={`#${id}`} className="hover:underline">
            {parseInline(headingText)}
          </a>
        </h3>,
      )
      continue
    } else if (line.startsWith('## ')) {
      flushAll()
      const headingText = line.slice(3)
      const cleanText = stripHeadingMarkdown(headingText)
      const base = slugifyHeading(cleanText) || 'section'
      const count = usedHeadingIds.get(base) ?? 0
      usedHeadingIds.set(base, count + 1)
      const id = count === 0 ? base : `${base}-${count}`

      elements.push(
        <h2
          id={id}
          key={`h2-${elements.length}`}
          className="group mt-14 mb-4 scroll-mt-24 font-display text-2xl font-bold tracking-tight text-ink-50 sm:text-3xl"
        >
          <a href={`#${id}`} className="hover:underline">
            {parseInline(headingText)}
          </a>
        </h2>,
      )
      continue
    } else if (line.startsWith('# ')) {
      flushAll()
      const headingText = line.slice(2)
      elements.push(
        <h1 key={`h1-${elements.length}`} className="mt-14 font-display text-3xl font-bold tracking-tight text-ink-50 sm:text-4xl">
          {parseInline(headingText)}
        </h1>,
      )
      continue
    } else if (line.startsWith('---') || line === '***') {
      flushAll()
      elements.push(<hr key={`hr-${elements.length}`} className="my-10 border-ink-800" />)
      continue
    } else if (line.startsWith('![') && line.includes('](')) {
      flushAll()
      const match = /^!\[([^\]]*)\]\(([^)]+)\)$/.exec(line)
      if (match && match[2]) {
        elements.push(
          <figure key={`img-${elements.length}`} className="my-8">
            <img
              src={match[2]}
              alt={match[1] || ''}
              loading="lazy"
              decoding="async"
              className="max-h-[520px] w-full rounded-2xl border border-ink-800 object-cover shadow-sm"
            />
            {match[1] && <figcaption className="mt-2.5 text-center text-xs text-ink-400">{match[1]}</figcaption>}
          </figure>,
        )
      } else {
        paragraphLines.push(line)
      }
      continue
    }

    // Normal text line -> add to current paragraph buffer
    paragraphLines.push(line)
  }

  flushAll()

  return <div className={className}>{elements}</div>
}
