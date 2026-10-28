import { Window } from 'happy-dom'
import { describe, expect, it } from 'vitest'
import { htmlToMarkdown, markdownToHtml } from '~/lib/markdown-html'

const window = new Window()
const parse = (html: string) => new window.DOMParser().parseFromString(html, 'text/html') as unknown as Document
const toMd = (html: string) => htmlToMarkdown(html, parse)
const roundTrip = (md: string) => toMd(markdownToHtml(md)).markdown

// A post using every block MarkdownRenderer draws, written the way the editor writes it.
const POST = `Remote signage lets you publish to [many screens](/products/cms) from **one** place.

## What is remote digital signage management?

It is *the process* of controlling displays through \`software\`, not ~~USB drives~~.

### Steps

1. Mount the display.
2. Pair the player with a **one-time token**.

- Fast setup
- Works offline

> 💡 **Pro Tip:**
> Encode videos in H.264.

| Feature | Viewixsoft | Manual |
| --- | --- | --- |
| Central control | ✅ Cloud dashboard | ❌ USB |

\`\`\`json
{ "screens": 10 }
\`\`\`

![Lobby screen](https://cdn.example/lobby.webp)

---

#### Small heading

Last paragraph.`

describe('markdownToHtml', () => {
  it('writes clean, escaped HTML for each block', () => {
    const html = markdownToHtml(POST)
    expect(html).toContain('<h2>What is remote digital signage management?</h2>')
    expect(html).toContain('<a href="/products/cms">many screens</a>')
    expect(html).toContain('<ol><li><p>Mount the display.</p></li>')
    expect(html).toContain('<thead><tr><th><p>Feature</p></th>')
    expect(html).toContain('<pre><code class="language-json">{ &quot;screens&quot;: 10 }</code></pre>')
    expect(html).toContain('<img src="https://cdn.example/lobby.webp" alt="Lobby screen">')
    expect(html).toContain('<s>USB drives</s>')
  })

  it('never lets text become markup', () => {
    expect(markdownToHtml('Use <script>alert(1)</script> & "quotes"')).toBe('<p>Use &lt;script&gt;alert(1)&lt;/script&gt; &amp; &quot;quotes&quot;</p>')
    expect(markdownToHtml('[x](javascript:"><img)')).not.toContain('"><img')
  })

  it('joins wrapped paragraph lines like the renderer', () => {
    expect(markdownToHtml('one\ntwo\n\nthree')).toBe('<p>one two</p>\n<p>three</p>')
  })
})

describe('htmlToMarkdown', () => {
  it('round-trips every block the renderer draws', () => {
    expect(roundTrip(POST)).toBe(POST)
  })

  it('round-trips the editor templates', () => {
    const takeaways = '> 📌 **Key Takeaways**\n> - **Insight 1**: Core direct answer.\n> - **Insight 2**: A benchmark.'
    expect(roundTrip(takeaways)).toBe(takeaways)
    const checklist = '- [ ] Order players\n- [x] Book install'
    expect(roundTrip(checklist)).toBe(checklist)
  })

  it('reads what the visual editor writes', () => {
    const { markdown } = toMd(
      '<h2>Title</h2><p>Hello <strong>bold</strong> and <em>soft</em><br>next line</p><ul><li><p>One</p></li><li><p>Two</p><ul><li><p>Nested</p></li></ul></li></ul>',
    )
    expect(markdown).toBe('## Title\n\nHello **bold** and *soft* next line\n\n- One\n- Two\n- Nested')
  })

  it('cleans pasted Google Docs and Word HTML', () => {
    const { markdown, dropped } = toMd(
      '<div style="x"><p><span style="font-weight:700">Bold?</span> <b>Real bold</b></p><h5>Deep</h5><p><img src="/a.webp" alt="A"> caption</p></div>',
    )
    expect(markdown).toBe('Bold? **Real bold**\n\n#### Deep\n\ncaption\n\n![A](/a.webp)')
    expect(dropped).toEqual([])
  })

  it('drops what the renderer cannot draw and says so', () => {
    const { markdown, dropped } = toMd('<p>Keep <u>this</u></p><script>alert(1)</script><iframe src="https://evil.example"></iframe><p><img src="data:image/png;base64,AAA"></p>')
    expect(markdown).toBe('Keep this')
    expect(dropped).toEqual(['iframe', 'img (data:)', 'script', 'u'])
  })

  it('keeps nested marks readable instead of breaking the syntax', () => {
    expect(toMd('<p><strong><a href="/x">link</a></strong></p>').markdown).toBe('[link](/x)')
    expect(toMd('<p><strong> spaced </strong>word</p>').markdown).toBe('**spaced** word')
  })

  it('keeps table cells from splitting on pipes', () => {
    expect(toMd('<table><tr><th>a|b</th><th>c</th></tr><tr><td>1</td><td></td></tr></table>').markdown).toBe('| a/b | c |\n| --- | --- |\n| 1 |   |')
  })
})
