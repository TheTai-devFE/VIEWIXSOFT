import { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Image as ImageIcon } from 'lucide-react'
import { htmlToMarkdown, markdownToHtml } from '~/lib/markdown-html'
import type { ContentEditorHandle } from './VisualEditor'

/**
 * The post as HTML. It starts from the Markdown when the tab opens; every edit
 * or paste is read back into Markdown, keeping only what the published page
 * can draw, and lists what was left out.
 */
export const HtmlSourceEditor = forwardRef<
  ContentEditorHandle,
  { markdown: string; onChange: (markdown: string) => void; onRequestImage: () => void; templatesMenu: ReactNode; footer?: ReactNode }
>(function HtmlSourceEditor({ markdown, onChange, onRequestImage, templatesMenu, footer }, ref) {
  const [html, setHtml] = useState(() => markdownToHtml(markdown))
  const [dropped, setDropped] = useState<string[]>([])
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const update = (next: string) => {
    setHtml(next)
    const result = htmlToMarkdown(next)
    setDropped(result.dropped)
    onChange(result.markdown)
  }

  useImperativeHandle(ref, () => ({
    insertMarkdown: (md: string) => {
      const el = textareaRef.current
      const snippet = `\n${markdownToHtml(md.trim())}\n`
      const start = el?.selectionStart ?? html.length
      const end = el?.selectionEnd ?? html.length
      update(html.slice(0, start) + snippet + html.slice(end))
    },
  }))

  return (
    <div className="mt-3 flex flex-col overflow-hidden rounded-xl border border-border bg-background shadow-xs">
      <div className="relative flex flex-wrap items-center gap-1 border-b border-border bg-ink-950/30 p-2">
        <button
          type="button"
          onClick={onRequestImage}
          title="Chèn ảnh (tải lên / thư viện / URL)"
          aria-label="Chèn ảnh"
          className="inline-flex size-8 items-center justify-center rounded text-foreground hover:bg-accent"
        >
          <ImageIcon className="size-4" />
        </button>
        <p className="text-xs text-muted-foreground">Dán hoặc sửa HTML; bài được lưu lại dưới dạng Markdown.</p>
        {templatesMenu}
      </div>
      {dropped.length > 0 && (
        <p role="status" className="border-b border-warning/40 bg-warning/10 px-4 py-2 text-xs text-foreground">
          Trang bài viết không hiển thị được, nên đã bỏ: <strong>{dropped.map((t) => `<${t}>`).join(', ')}</strong>. Phần chữ bên trong (nếu có) vẫn được giữ.
        </p>
      )}
      <label htmlFor="post-content-html" className="sr-only">
        Nội dung bài viết (HTML)
      </label>
      <textarea
        id="post-content-html"
        ref={textareaRef}
        value={html}
        onChange={(e) => update(e.target.value)}
        rows={24}
        spellCheck={false}
        placeholder="<h2>What is digital signage software?</h2>&#10;<p>Digital signage software lets you…</p>"
        className="w-full resize-y bg-transparent p-4 font-mono text-xs leading-relaxed outline-none"
      />
      {footer}
    </div>
  )
})
