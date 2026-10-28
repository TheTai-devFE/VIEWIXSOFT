// @vitest-environment happy-dom
import { Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Image } from '@tiptap/extension-image'
import { TableKit } from '@tiptap/extension-table'
import { describe, expect, it } from 'vitest'
import { htmlToMarkdown, markdownToHtml } from '~/lib/markdown-html'

// The same extensions as src/components/admin/blog/VisualEditor.tsx.
function throughEditor(markdown: string) {
  const editor = new Editor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3, 4] }, underline: false, link: { openOnClick: false } }),
      Image,
      TableKit.configure({ table: { resizable: false } }),
    ],
    content: markdownToHtml(markdown),
  })
  const result = htmlToMarkdown(editor.getHTML())
  editor.destroy()
  return result
}

const POST = `Remote signage lets you publish to [many screens](/products/cms) from **one** place.

## What is remote digital signage management?

It is *the process* of controlling displays through \`software\`, not ~~USB drives~~.

1. Mount the display.
2. Pair the player.

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

describe('visual editor round trip', () => {
  it('saves an untouched post exactly as it was loaded', () => {
    const { markdown, dropped } = throughEditor(POST)
    expect(dropped).toEqual([])
    expect(markdown).toBe(POST)
  })
})
