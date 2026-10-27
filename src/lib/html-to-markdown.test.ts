import { describe, expect, it } from 'vitest'
import { htmlToMarkdown } from '~/lib/html-to-markdown'

describe('htmlToMarkdown', () => {
  it('handles empty input gracefully', () => {
    expect(htmlToMarkdown('')).toBe('')
    expect(htmlToMarkdown(null as any)).toBe('')
  })

  it('handles fallback in non-browser environment', () => {
    const html = '<p>Simple <strong>bold</strong> text</p>'
    expect(htmlToMarkdown(html)).toBe('Simple bold text')
  })
})
