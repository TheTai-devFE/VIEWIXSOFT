import { describe, expect, it } from 'vitest'
import { extractTocFromMarkdown, generateMarkdownToc, slugifyHeading } from '~/lib/toc'

describe('toc utilities', () => {
  it('slugifies headings with Vietnamese characters properly', () => {
    expect(slugifyHeading('Khái niệm Digital Signage')).toBe('khái-niệm-digital-signage')
    expect(slugifyHeading('Lợi ích 100% của giải pháp')).toBe('lợi-ích-100-của-giải-pháp')
    expect(slugifyHeading('What is Edge AI?')).toBe('what-is-edge-ai')
  })

  it('extracts TOC with duplicate heading disambiguation', () => {
    const md = `
# Title

## Overview
Some intro.

### Architecture
Details.

## Architecture
Another architecture.

\`\`\`
## Not a heading
\`\`\`
    `
    const toc = extractTocFromMarkdown(md)
    expect(toc).toEqual([
      { depth: 2, text: 'Overview', id: 'overview' },
      { depth: 3, text: 'Architecture', id: 'architecture' },
      { depth: 2, text: 'Architecture', id: 'architecture-1' },
    ])
  })

  it('generates markdown TOC block', () => {
    const md = `
## Giới thiệu
## Tính năng
### Vận hành từ xa
    `
    const generated = generateMarkdownToc(md)
    expect(generated).toContain('> 📑 **Mục lục bài viết**')
    expect(generated).toContain('> - [Giới thiệu](#giới-thiệu)')
    expect(generated).toContain('> - [Tính năng](#tính-năng)')
    expect(generated).toContain('>   - [Vận hành từ xa](#vận-hành-từ-xa)')
  })
})
