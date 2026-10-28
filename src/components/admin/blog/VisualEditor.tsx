import { forwardRef, useImperativeHandle, useRef } from 'react'
import type { ReactNode } from 'react'
import { EditorContent, useEditor, useEditorState } from '@tiptap/react'
import type { Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Image } from '@tiptap/extension-image'
import { TableKit } from '@tiptap/extension-table'
import {
  AlertCircle,
  Bold,
  Code,
  FileCode,
  Heading2,
  Heading3,
  Heading4,
  Image as ImageIcon,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Minus,
  Pilcrow,
  Quote,
  Redo2,
  Strikethrough,
  Table as TableIcon,
  Undo2,
} from 'lucide-react'
import { htmlToMarkdown, markdownToHtml } from '~/lib/markdown-html'
import { cn } from '~/lib/cn'

export interface ContentEditorHandle {
  /** Inserts Markdown (a template, an image line) at the cursor. */
  insertMarkdown: (markdown: string) => void
}

// The published page's look (MarkdownRenderer), applied to the editable document.
const DOCUMENT_CLASS = cn(
  'min-h-[520px] p-6 outline-none text-base leading-relaxed text-ink-300',
  '[&_p]:my-4 [&_h1]:mt-10 [&_h1]:font-display [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:text-ink-50',
  '[&_h2]:mt-12 [&_h2]:mb-4 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:tracking-tight [&_h2]:text-ink-50',
  '[&_h3]:mt-10 [&_h3]:font-display [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-ink-50',
  '[&_h4]:mt-8 [&_h4]:font-display [&_h4]:text-lg [&_h4]:font-semibold [&_h4]:text-ink-50',
  '[&_strong]:font-semibold [&_strong]:text-ink-50 [&_em]:italic',
  '[&_a]:text-ink-50 [&_a]:underline [&_a]:decoration-ink-600 [&_a]:underline-offset-4',
  '[&_:not(pre)>code]:rounded [&_:not(pre)>code]:bg-ink-900 [&_:not(pre)>code]:px-1.5 [&_:not(pre)>code]:py-0.5 [&_:not(pre)>code]:font-mono [&_:not(pre)>code]:text-sm',
  '[&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:my-1 [&_li]:marker:text-signal-400 [&_li_p]:my-0',
  '[&_blockquote]:my-6 [&_blockquote]:rounded-r-xl [&_blockquote]:border-l-4 [&_blockquote]:border-signal-500 [&_blockquote]:bg-signal-950/20 [&_blockquote]:py-3 [&_blockquote]:pr-3 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-ink-200 [&_blockquote_p]:my-1',
  '[&_pre]:my-6 [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:border [&_pre]:border-ink-800 [&_pre]:bg-ink-900 [&_pre]:p-4 [&_pre]:font-mono [&_pre]:text-sm [&_pre]:text-ink-100',
  '[&_table]:my-6 [&_table]:w-full [&_table]:border-collapse [&_table]:text-left [&_table]:text-sm [&_th]:border [&_th]:border-ink-800 [&_th]:bg-ink-900 [&_th]:px-3 [&_th]:py-2 [&_th]:font-semibold [&_th]:text-ink-50 [&_td]:border [&_td]:border-ink-800 [&_td]:px-3 [&_td]:py-2 [&_th_p]:my-0 [&_td_p]:my-0',
  '[&_img]:my-6 [&_img]:max-h-[520px] [&_img]:rounded-2xl [&_img]:border [&_img]:border-ink-800 [&_img.ProseMirror-selectednode]:ring-2 [&_img.ProseMirror-selectednode]:ring-signal-400',
  '[&_hr]:my-10 [&_hr]:border-ink-800',
)

function ToolButton({ label, active, disabled, onClick, children }: { label: string; active?: boolean; disabled?: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      // Keeps the selection in the document while clicking.
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn(
        'inline-flex size-8 items-center justify-center rounded text-foreground hover:bg-accent disabled:opacity-40',
        active && 'bg-accent text-signal-400',
      )}
    >
      {children}
    </button>
  )
}

const Divider = () => <div aria-hidden="true" className="mx-0.5 h-4 w-px bg-border" />

function Toolbar({ editor, onRequestImage, insertMarkdown, templatesMenu }: { editor: Editor; onRequestImage: () => void; insertMarkdown: (md: string) => void; templatesMenu: ReactNode }) {
  const state = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      h2: e.isActive('heading', { level: 2 }),
      h3: e.isActive('heading', { level: 3 }),
      h4: e.isActive('heading', { level: 4 }),
      paragraph: e.isActive('paragraph'),
      bold: e.isActive('bold'),
      italic: e.isActive('italic'),
      strike: e.isActive('strike'),
      code: e.isActive('code'),
      bullet: e.isActive('bulletList'),
      ordered: e.isActive('orderedList'),
      quote: e.isActive('blockquote'),
      codeBlock: e.isActive('codeBlock'),
      link: e.isActive('link'),
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
    }),
  })
  const chain = () => editor.chain().focus()

  const toggleLink = () => {
    if (state.link) return chain().unsetLink().run()
    const href = window.prompt('Địa chỉ link (https://… hoặc /products/cms)', 'https://')?.trim()
    if (!href || href === 'https://') return
    if (editor.state.selection.empty) chain().insertContent(`<a href="${href.replace(/"/g, '%22')}">${href}</a>`).run()
    else chain().setLink({ href }).run()
  }

  return (
    <div className="relative flex flex-wrap items-center gap-1 border-b border-border bg-ink-950/30 p-2">
      <ToolButton label="Đoạn văn" active={state.paragraph} onClick={() => chain().setParagraph().run()}>
        <Pilcrow className="size-4" />
      </ToolButton>
      <ToolButton label="Tiêu đề cấp 2 (H2)" active={state.h2} onClick={() => chain().toggleHeading({ level: 2 }).run()}>
        <Heading2 className="size-4" />
      </ToolButton>
      <ToolButton label="Tiêu đề cấp 3 (H3)" active={state.h3} onClick={() => chain().toggleHeading({ level: 3 }).run()}>
        <Heading3 className="size-4" />
      </ToolButton>
      <ToolButton label="Tiêu đề cấp 4 (H4)" active={state.h4} onClick={() => chain().toggleHeading({ level: 4 }).run()}>
        <Heading4 className="size-4" />
      </ToolButton>
      <Divider />
      <ToolButton label="In đậm (Ctrl+B)" active={state.bold} onClick={() => chain().toggleBold().run()}>
        <Bold className="size-4" />
      </ToolButton>
      <ToolButton label="In nghiêng (Ctrl+I)" active={state.italic} onClick={() => chain().toggleItalic().run()}>
        <Italic className="size-4" />
      </ToolButton>
      <ToolButton label="Gạch ngang (Ctrl+Shift+S)" active={state.strike} onClick={() => chain().toggleStrike().run()}>
        <Strikethrough className="size-4" />
      </ToolButton>
      <ToolButton label="Code trong dòng (Ctrl+E)" active={state.code} onClick={() => chain().toggleCode().run()}>
        <Code className="size-4" />
      </ToolButton>
      <Divider />
      <ToolButton label="Danh sách gạch đầu dòng" active={state.bullet} onClick={() => chain().toggleBulletList().run()}>
        <List className="size-4" />
      </ToolButton>
      <ToolButton label="Danh sách đánh số" active={state.ordered} onClick={() => chain().toggleOrderedList().run()}>
        <ListOrdered className="size-4" />
      </ToolButton>
      <ToolButton label="Trích dẫn" active={state.quote} onClick={() => chain().toggleBlockquote().run()}>
        <Quote className="size-4" />
      </ToolButton>
      <ToolButton label="Khối code" active={state.codeBlock} onClick={() => chain().toggleCodeBlock().run()}>
        <FileCode className="size-4" />
      </ToolButton>
      <ToolButton label="Đường kẻ ngang" onClick={() => chain().setHorizontalRule().run()}>
        <Minus className="size-4" />
      </ToolButton>
      <Divider />
      <ToolButton label={state.link ? 'Bỏ link' : 'Chèn link (Ctrl+K)'} active={state.link} onClick={toggleLink}>
        <LinkIcon className="size-4" />
      </ToolButton>
      <ToolButton label="Chèn ảnh (tải lên / thư viện / URL)" onClick={onRequestImage}>
        <ImageIcon className="size-4" />
      </ToolButton>
      <ToolButton label="Chèn bảng" onClick={() => chain().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>
        <TableIcon className="size-4" />
      </ToolButton>
      <ToolButton label="Chèn khung ghi chú" onClick={() => insertMarkdown('> 💡 **Pro Tip / Best Practice:**\n> Enter key recommendation here.')}>
        <AlertCircle className="size-4" />
      </ToolButton>
      <Divider />
      <ToolButton label="Hoàn tác (Ctrl+Z)" disabled={!state.canUndo} onClick={() => chain().undo().run()}>
        <Undo2 className="size-4" />
      </ToolButton>
      <ToolButton label="Làm lại (Ctrl+Shift+Z)" disabled={!state.canRedo} onClick={() => chain().redo().run()}>
        <Redo2 className="size-4" />
      </ToolButton>
      {templatesMenu}
    </div>
  )
}

/**
 * The post as it will look, edited in place (Tiptap). It reads the Markdown
 * once when it mounts and reports every change back as Markdown, so the
 * Markdown and HTML tabs always show the same post. Only what the published
 * page can draw is offered.
 */
export const VisualEditor = forwardRef<
  ContentEditorHandle,
  {
    markdown: string
    onChange: (markdown: string) => void
    onRequestImage: () => void
    /** Uploads an image pasted or dropped into the document; resolves to its library entry. */
    onUploadImage: (file: File) => Promise<{ url: string; alt: string } | null>
    templatesMenu: ReactNode
    footer?: ReactNode
    disabled?: boolean
  }
>(function VisualEditor({ markdown, onChange, onRequestImage, onUploadImage, templatesMenu, footer, disabled = false }, ref) {
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange
  const uploadRef = useRef(onUploadImage)
  uploadRef.current = onUploadImage

  const editorRef = useRef<Editor | null>(null)

  /** Uploads pasted or dropped image files and inserts each when it is ready; false lets Tiptap handle the rest. */
  const uploadFiles = (files: File[]) => {
    const images = files.filter((f) => f.type.startsWith('image/'))
    if (!images.length) return false
    for (const file of images) {
      void uploadRef.current(file).then((res) => {
        if (res) editorRef.current?.chain().focus().setImage({ src: res.url, alt: res.alt }).run()
      })
    }
    return true
  }

  const editor = useEditor({
    // Rendered only in the browser; the server sends the empty frame.
    immediatelyRender: false,
    editable: !disabled,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4] },
        // MarkdownRenderer has no underline; Ctrl+U would make text that can't be saved.
        underline: false,
        link: { openOnClick: false, autolink: true, defaultProtocol: 'https' },
      }),
      Image.configure({ allowBase64: false }),
      TableKit.configure({ table: { resizable: false } }),
    ],
    content: markdownToHtml(markdown),
    editorProps: {
      attributes: { class: DOCUMENT_CLASS, 'aria-label': 'Nội dung bài viết', 'aria-multiline': 'true', role: 'textbox' },
      handlePaste: (_view, event) => uploadFiles(Array.from(event.clipboardData?.files ?? [])),
      handleDrop: (_view, event) => uploadFiles(Array.from(event.dataTransfer?.files ?? [])),
    },
    onUpdate: ({ editor: e }) => onChangeRef.current(htmlToMarkdown(e.getHTML()).markdown),
  })
  editorRef.current = editor

  const insertMarkdown = (md: string) => {
    editor?.chain().focus().insertContent(markdownToHtml(md.trim())).run()
  }
  useImperativeHandle(ref, () => ({ insertMarkdown }))

  return (
    <div className="mt-3 flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-xs">
      {editor ? (
        <Toolbar editor={editor} onRequestImage={onRequestImage} insertMarkdown={insertMarkdown} templatesMenu={templatesMenu} />
      ) : (
        <div className="h-12 border-b border-border bg-ink-950/30" />
      )}
      <EditorContent editor={editor} />
      {footer}
    </div>
  )
})
