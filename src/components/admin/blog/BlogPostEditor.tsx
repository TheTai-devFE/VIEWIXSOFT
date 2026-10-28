import { lazy, Suspense, useMemo, useRef, useState } from 'react'
import { useConfirm, useToast } from '~/components/ui/feedback'
import { Link, useRouter } from '@tanstack/react-router'
import {
  AlertCircle,
  Bold,
  Check,
  CheckSquare,
  Code,
  Code2,
  Eye,
  FileCode,
  Heading2,
  Heading3,
  Heading4,
  Image as ImageIcon,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Loader2,
  Minus,
  PenLine,
  Plus,
  Quote,
  Sparkles,
  Strikethrough,
  Table as TableIcon,
  Trash2,
  X,
} from 'lucide-react'
import { ImagePickerSheet } from '~/components/admin/ImagePickerSheet'
import type { LibraryAsset } from '~/components/admin/ImagePickerSheet'
import { InsertImageSheet } from '~/components/admin/InsertImageSheet'
import { EditorHeader } from '~/components/admin/EditorHeader'
import { OwnershipNotice } from '~/components/admin/OwnershipNotice'
import type { Ownership } from '~/components/admin/OwnershipNotice'
import { RepeatableList, TextField } from '~/components/admin/use-cases/BlockFields'
import { SeoChecklist, SeoScoreBadge } from '~/components/admin/blog/SeoChecklist'
import { PostSchemaPanel } from '~/components/admin/blog/PostSchemaPanel'
import type { CustomSchemaListRow } from '~/server/custom-schemas/repository'
import type { SchemaLibraryItem } from '~/server/custom-schemas/post-schemas'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { createBlogPostFn, deleteBlogPostFn, updateBlogPostFn } from '~/server/functions/blog'
import { uploadMediaAssetFn } from '~/server/functions/media-admin'
import { prepareImage } from '~/lib/image-prepare'
import { htmlToMarkdown } from '~/lib/markdown-html'
import { HtmlSourceEditor } from '~/components/admin/blog/HtmlSourceEditor'
import type { ContentEditorHandle } from '~/components/admin/blog/VisualEditor'
import { extractTocFromMarkdown, generateMarkdownToc } from '~/lib/toc'
import type { AuthorRow, BlogPostRow } from '~/server/db/schema'
import { checkPost } from '~/lib/seo/post-checklist'
import type { FaqEntry } from '~/lib/case-study'
import { cn } from '~/lib/cn'
import { LazyImage } from '~/components/ui/lazy-image'

// Tiptap is only needed once the visual tab opens, so it stays out of the editor's first download.
const VisualEditor = lazy(() => import('~/components/admin/blog/VisualEditor').then((m) => ({ default: m.VisualEditor })))

/** How the body is edited; it is always saved as Markdown. */
type EditorMode = 'visual' | 'markdown' | 'html'

const PRODUCTS = [
  { slug: 'cms', name: 'Viewixsoft CMS' },
  { slug: 'pos', name: 'Viewixsoft POS' },
  { slug: 'tracking', name: 'Viewixsoft Tracking' },
  { slug: 'nfc', name: 'Viewixsoft NFC' },
] as const

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function BlogPostEditor({
  initialPost,
  mediaAssets = [],
  authors = [],
  defaultAuthorId = null,
  ownership,
  schemas = [],
  schemaLibrary = [],
}: {
  initialPost?: BlogPostRow | null
  /** Schema markup attached to this post (/admin/schema), when editing. */
  schemas?: CustomSchemaListRow[]
  /** Other pages' schemas, to copy one onto this post. */
  schemaLibrary?: SchemaLibraryItem[]
  mediaAssets?: LibraryAsset[]
  /** Profiles from /admin/authors to pick the byline from. */
  authors?: AuthorRow[]
  /** For a new post: the author profile linked to the signed-in account. */
  defaultAuthorId?: string | null
  /** Set when editing an existing post. */
  ownership?: Ownership
}) {
  const canEdit = ownership?.canEdit ?? true
  const router = useRouter()
  const confirm = useConfirm()
  const toast = useToast()
  const isEditing = Boolean(initialPost?.id)

  const [title, setTitle] = useState(initialPost?.title ?? '')
  const [slug, setSlug] = useState(initialPost?.slug ?? '')
  const [seoTitle, setSeoTitle] = useState(initialPost?.seoTitle ?? '')
  const [description, setDescription] = useState(initialPost?.description ?? '')
  const [content, setContent] = useState(initialPost?.content ?? '')
  const [category, setCategory] = useState(initialPost?.category ?? 'Digital Signage')
  const [product, setProduct] = useState<(typeof PRODUCTS)[number]['slug']>((initialPost?.product as any) ?? 'cms')
  const [tagsInput, setTagsInput] = useState((initialPost?.tags ?? []).join(', '))
  const [authorName, setAuthorName] = useState(initialPost?.authorName ?? 'Viewixsoft Team')
  const [authorRole, setAuthorRole] = useState(initialPost?.authorRole ?? 'Editorial Team')
  const [coverUrl, setCoverUrl] = useState(initialPost?.coverUrl ?? '')
  const [coverAlt, setCoverAlt] = useState(initialPost?.coverAlt ?? '')
  const [keyTakeaways, setKeyTakeaways] = useState<string[]>(initialPost?.keyTakeaways ?? [''])
  const [authorId, setAuthorId] = useState<string | null>(initialPost ? initialPost.authorId : defaultAuthorId)
  const [seoDescription, setSeoDescription] = useState(initialPost?.seoDescription ?? '')
  const [faq, setFaq] = useState<FaqEntry[]>(initialPost?.faq ?? [])
  const author = authors.find((a) => a.id === authorId) ?? null

  const [mode, setMode] = useState<EditorMode>('visual')
  const contentEditorRef = useRef<ContentEditorHandle>(null)
  const [localMediaAssets, setLocalMediaAssets] = useState<LibraryAsset[]>(mediaAssets)
  const [coverPickerOpen, setCoverPickerOpen] = useState(false)
  const [insertImageSheetOpen, setInsertImageSheetOpen] = useState(false)
  const [isUploadingPaste, setIsUploadingPaste] = useState(false)
  const [pasteNotice, setPasteNotice] = useState<string | null>(null)
  const [templateMenuOpen, setTemplateMenuOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleTitleChange = (val: string) => {
    setTitle(val)
    if (error) setError(null)
    if (!isEditing && (!slug || slug === slugify(title))) {
      setSlug(slugify(val))
    }
  }

  const insertMarkdown = (before: string, after: string = '', defaultText: string = '') => {
    const textarea = document.getElementById('post-content-textarea') as HTMLTextAreaElement | null
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selected = textarea.value.substring(start, end) || defaultText
    const replacement = before + selected + after
    const newContent = textarea.value.substring(0, start) + replacement + textarea.value.substring(end)

    setContent(newContent)
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + before.length, start + before.length + selected.length)
    }, 10)
  }

  const wordCount = content.trim() ? content.trim().split(/\s+/).filter(Boolean).length : 0
  const charCount = content.length
  const readTimeMin = Math.max(1, Math.ceil(wordCount / 200))
  const currentToc = extractTocFromMarkdown(content)
  const checks = useMemo(
    () =>
      checkPost({
        title,
        seoTitle,
        description: seoDescription.trim() || description,
        slug,
        content,
        coverUrl,
        coverAlt,
        keyTakeaways,
        faqCount: faq.filter((f) => f.question.trim() && f.answer.trim()).length,
        author: author
          ? { name: author.name, role: author.role, kind: author.kind, hasBio: author.bio.trim() !== '', hasPhoto: Boolean(author.avatarUrl) }
          : { name: authorName, role: authorRole, kind: 'person', hasBio: false, hasPhoto: false },
      }),
    [title, seoTitle, seoDescription, description, slug, content, coverUrl, coverAlt, keyTakeaways, faq, author, authorName, authorRole],
  )

  const insertAtCursor = (text: string) => {
    // The visual and HTML tabs insert at their own cursor and report back as Markdown.
    if (mode !== 'markdown') {
      contentEditorRef.current?.insertMarkdown(text)
      return
    }
    const textarea = document.getElementById('post-content-textarea') as HTMLTextAreaElement | null
    if (!textarea) {
      setContent((prev) => prev + text)
      return
    }

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const newContent = textarea.value.substring(0, start) + text + textarea.value.substring(end)
    setContent(newContent)
    setTimeout(() => {
      textarea.focus()
      const newPos = start + text.length
      textarea.setSelectionRange(newPos, newPos)
    }, 10)
  }

  const insertImageMarkdown = (url: string, alt: string) => {
    insertAtCursor(`\n\n![${alt.trim() || 'Image'}](${url.trim()})\n\n`)
  }

  const insertTemplate = (type: 'takeaways' | 'table' | 'faq' | 'steps' | 'callout' | 'toc') => {
    let tpl = ''
    switch (type) {
      case 'toc':
        tpl = generateMarkdownToc(content)
        break
      case 'takeaways':
        tpl = `\n\n> 📌 **Key Takeaways**\n> - **Insight 1**: Core direct answer or primary finding.\n> - **Insight 2**: Measurable operational benchmark or architecture insight.\n> - **Insight 3**: Implementation roadmap or financial ROI.\n\n`
        break
      case 'table':
        tpl = `\n\n| Feature / Metric | Viewixsoft Solution | Alternative Approaches |\n| --- | --- | --- |\n| Central Management | ✅ Real-time Cloud Dashboard | ❌ Manual on-site USB |\n| Offline Reliability | ✅ Edge cache storage | ⚠️ Black screen on outage |\n| Deployment Speed | ⚡ Instant remote sync | ⏱️ Hours per store |\n\n`
        break
      case 'faq':
        tpl = `\n\n### Frequently Asked Questions\n\n#### How does Viewixsoft ensure zero downtime?\nEdge players cache all playlists locally, continuing seamless playback even without internet.\n\n#### Can we manage thousands of screens across multiple locations?\nYes, group management, role-based access, and scheduled deployments scale to enterprise fleets.\n\n`
        break
      case 'steps':
        tpl = `\n\n### Step-by-Step Implementation Guide\n\n1. **Hardware Setup**: Mount commercial display and connect player via HDMI.\n2. **Network Connection**: Pair player to Viewixsoft Cloud using one-time token.\n3. **Publish Campaign**: Select playlist, configure schedule, and push live.\n\n`
        break
      case 'callout':
        tpl = `\n\n> 💡 **Pro Tip / Best Practice:**\n> Encode video assets in H.264 or WebP formats at 1080p/4K to balance high visual fidelity with minimal network bandwidth usage.\n\n`
        break
    }
    insertAtCursor(tpl)
    setTemplateMenuOpen(false)
  }

  /** Uploads a pasted or dropped image to the media library; null (with the error shown) when it fails. */
  const uploadImage = async (rawFile: File): Promise<{ url: string; alt: string } | null> => {
    setIsUploadingPaste(true)
    try {
      const fileName = rawFile.name && rawFile.name !== 'image.png' ? rawFile.name : `pasted-image-${Date.now()}.png`
      const prepared = await prepareImage(new File([rawFile], fileName, { type: rawFile.type }))
      const form = new FormData()
      form.set('file', prepared.file)
      const res = await uploadMediaAssetFn({ data: form })
      if (!res.ok || !res.asset?.url) {
        setError(res.ok ? 'Không tải ảnh lên được.' : res.error)
        return null
      }
      const alt = res.asset.alt || 'Image'
      const newAsset: LibraryAsset = {
        id: res.asset.id,
        url: res.asset.url,
        fileName: res.asset.fileName,
        contentType: res.asset.contentType,
        width: res.asset.width,
        height: res.asset.height,
        alt,
        createdAt: new Date(res.asset.createdAt),
      }
      setLocalMediaAssets((prev) => [newAsset, ...prev])
      return { url: res.asset.url, alt }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi khi tải ảnh lên.')
      return null
    } finally {
      setIsUploadingPaste(false)
    }
  }

  const handleUploadImageFile = async (rawFile: File, targetPosition?: { start: number; end: number }) => {
    const textarea = document.getElementById('post-content-textarea') as HTMLTextAreaElement | null
    const start = targetPosition?.start ?? textarea?.selectionStart ?? content.length
    const end = targetPosition?.end ?? textarea?.selectionEnd ?? content.length

    const uploadToken = `uploading-${Date.now()}`
    const placeholder = `\n\n![Uploading image...](${uploadToken})\n\n`

    const originalContent = textarea ? textarea.value : content
    const updatedWithPlaceholder =
      originalContent.substring(0, start) + placeholder + originalContent.substring(end)
    setContent(updatedWithPlaceholder)
    const uploaded = await uploadImage(rawFile)
    setContent((prev) => prev.replace(placeholder, uploaded ? `\n\n![${uploaded.alt}](${uploaded.url})\n\n` : ''))
  }

  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    // 1. Image on clipboard
    const items = e.clipboardData?.items
    if (items && items.length > 0) {
      let imageFile: File | null = null
      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        if (item && item.type.startsWith('image/')) {
          imageFile = item.getAsFile()
          break
        }
      }

      if (imageFile) {
        e.preventDefault()
        const textarea = e.currentTarget
        await handleUploadImageFile(imageFile, {
          start: textarea.selectionStart,
          end: textarea.selectionEnd,
        })
        return
      }
    }

    // 2. Rich HTML in clipboard (from Word, Google Docs, ChatGPT, Notion, web)
    const htmlData = e.clipboardData?.getData('text/html')
    if (htmlData && htmlData.trim()) {
      const hasRichContent = /<(h[1-6]|b|strong|i|em|u|s|strike|del|ul|ol|li|table|blockquote|a|img|pre|code|div|p)/i.test(
        htmlData,
      )
      if (hasRichContent) {
        const { markdown } = htmlToMarkdown(htmlData)
        if (markdown && markdown.trim()) {
          e.preventDefault()
          const textarea = e.currentTarget
          const start = textarea.selectionStart
          const end = textarea.selectionEnd
          const newContent =
            textarea.value.substring(0, start) + markdown + textarea.value.substring(end)
          setContent(newContent)

          setTimeout(() => {
            textarea.focus()
            const newPos = start + markdown.length
            textarea.setSelectionRange(newPos, newPos)
          }, 10)

          setPasteNotice('✨ Đã tự động chuyển đổi định dạng giàu (HTML) sang Markdown!')
          setTimeout(() => setPasteNotice(null), 4000)
          return
        }
      }
    }

    // 3. Normal plain text paste: Let default browser event execute
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const isMod = e.metaKey || e.ctrlKey

    // Tab key: indent with 2 spaces
    if (e.key === 'Tab') {
      e.preventDefault()
      insertMarkdown('  ', '', '')
      return
    }

    if (isMod) {
      const key = e.key.toLowerCase()
      if (key === 'b') {
        e.preventDefault()
        insertMarkdown('**', '**', 'bold text')
      } else if (key === 'i') {
        e.preventDefault()
        insertMarkdown('*', '*', 'italic text')
      } else if (key === 'k') {
        e.preventDefault()
        insertMarkdown('[', '](https://viewixsoft.com)', 'link text')
      } else if (key === 'e') {
        e.preventDefault()
        insertMarkdown('`', '`', 'code')
      } else if (e.shiftKey && key === 'x') {
        e.preventDefault()
        insertMarkdown('~~', '~~', 'strikethrough text')
      }
    }
  }

  const handleDrop = async (e: React.DragEvent<HTMLTextAreaElement>) => {
    const files = Array.from(e.dataTransfer.files)
    const imageFile = files.find((f) => f.type.startsWith('image/'))
    if (!imageFile) return

    e.preventDefault()
    const textarea = e.currentTarget
    await handleUploadImageFile(imageFile, {
      start: textarea.selectionStart,
      end: textarea.selectionEnd,
    })
  }

  const handleSave = async (status: 'draft' | 'published') => {
    setError(null)
    setSaving(true)

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
    const filteredTakeaways = keyTakeaways.map((t) => t.trim()).filter(Boolean)

    const data = {
      title,
      slug: slugify(slug),
      seoTitle: seoTitle.trim() || undefined,
      description,
      content,
      category,
      product,
      tags,
      // With a profile picked, the byline text follows it so old readers of authorName stay correct.
      authorId,
      authorName: author?.name ?? authorName,
      authorRole: (author?.role ?? authorRole).trim() || undefined,
      coverUrl: coverUrl.trim() || undefined,
      coverAlt: coverAlt.trim() || undefined,
      keyTakeaways: filteredTakeaways,
      seoDescription: seoDescription.trim() || undefined,
      faq: faq.filter((f) => f.question.trim() || f.answer.trim()),
      status,
    }

    // Client-side validation for instant, clear feedback
    if (title.trim().length < 5) {
      setError('Tiêu đề bài viết (Article Title) phải có ít nhất 5 ký tự.')
      setSaving(false)
      return
    }
    if (title.trim().length > 160) {
      setError('Tiêu đề bài viết không được vượt quá 160 ký tự.')
      setSaving(false)
      return
    }
    if (description.trim().length < 10) {
      setError('Phần tóm tắt / mô tả ngắn (Short Summary / Excerpt) phải có ít nhất 10 ký tự.')
      setSaving(false)
      return
    }
    if (description.trim().length > 600) {
      setError(`Phần tóm tắt / mô tả ngắn (Short Summary / Excerpt) không được vượt quá 600 ký tự (hiện tại: ${description.trim().length}/600 ký tự).`)
      setSaving(false)
      return
    }
    if (content.trim().length < 10) {
      setError('Nội dung bài viết (Post Content) phải có ít nhất 10 ký tự.')
      setSaving(false)
      return
    }

    try {
      if (isEditing && initialPost?.id) {
        const res = await updateBlogPostFn({
          data: {
            id: initialPost.id,
            data,
          },
        })
        if (!res.ok) {
          setError(res.message || 'Không cập nhật được bài viết.')
          setSaving(false)
          return
        }
      } else {
        const res = await createBlogPostFn({ data })
        if (!res.ok) {
          setError(res.message || 'Không tạo được bài viết.')
          setSaving(false)
          return
        }
      }

      await router.navigate({ to: '/admin/blog' })
    } catch (err: any) {
      let msg = err?.message || 'Có lỗi khi lưu bài viết.'
      if (typeof msg === 'string' && msg.startsWith('[') && msg.includes('"message"')) {
        try {
          const parsed = JSON.parse(msg)
          if (Array.isArray(parsed) && parsed.length > 0) {
            msg = parsed
              .map((item: any) => {
                if (item.path?.includes('description')) {
                  if (item.code === 'too_big') {
                    return `Phần mô tả ngắn (Short Summary) quá dài (tối đa ${item.maximum ?? 600} ký tự).`
                  }
                  return 'Phần mô tả ngắn (Short Summary / Excerpt) phải có ít nhất 10 ký tự.'
                }
                if (item.path?.includes('title')) {
                  if (item.code === 'too_big') {
                    return `Tiêu đề quá dài (tối đa ${item.maximum ?? 160} ký tự).`
                  }
                  return 'Tiêu đề bài viết phải có ít nhất 5 ký tự.'
                }
                if (item.path?.includes('slug')) {
                  return 'URL Slug không hợp lệ hoặc quá ngắn (chỉ gồm chữ thường không dấu và gạch ngang).'
                }
                if (item.path?.includes('content')) {
                  return 'Nội dung bài viết (Post Content) phải có ít nhất 10 ký tự.'
                }
                return item.message || JSON.stringify(item)
              })
              .join(' • ')
          }
        } catch {
          // keep original msg
        }
      }
      setError(msg)
      setSaving(false)
    }
  }

  const handleDelete = () => {
    const id = initialPost?.id
    if (!id) return
    void confirm({
      title: 'Xoá bài viết này?',
      description: 'Bài viết bị xoá vĩnh viễn và không thể hoàn tác.',
      confirmText: 'Xoá bài viết',
      tone: 'danger',
      onConfirm: async () => {
        const res = await deleteBlogPostFn({ data: { id } })
        if (!res.ok) return 'Không xoá được bài viết. Hãy thử lại.'
        toast({ title: 'Đã xoá bài viết', tone: 'success' })
        await router.navigate({ to: '/admin/blog' })
      },
    })
  }

  // Shared by the three editing tabs.
  const templatesMenu = (
    <div className="relative ml-auto">
      <button
        type="button"
        onClick={() => setTemplateMenuOpen((prev) => !prev)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-ink-900 px-2.5 py-1 text-xs font-semibold text-signal-400 hover:bg-accent"
      >
        <Sparkles className="size-3.5" /> Mẫu có sẵn
      </button>

      {templateMenuOpen && (
        <div className="absolute right-0 top-full z-30 mt-1 w-60 rounded-xl border border-border bg-card p-1.5 shadow-xl">
          <button
            type="button"
            onClick={() => insertTemplate('toc')}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-signal-400 hover:bg-accent border-b border-border/50 pb-2 mb-1"
          >
            <span>📑</span> Tạo Mục lục tự động ({currentToc.length} mục)
          </button>
          <button
            type="button"
            onClick={() => insertTemplate('takeaways')}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-foreground hover:bg-accent"
          >
            <span>📌</span> Khung ý chính (Key Takeaways)
          </button>
          <button
            type="button"
            onClick={() => insertTemplate('table')}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-foreground hover:bg-accent"
          >
            <span>📊</span> Bảng so sánh
          </button>
          <button
            type="button"
            onClick={() => insertTemplate('faq')}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-foreground hover:bg-accent"
          >
            <span>❓</span> Khối FAQ
          </button>
          <button
            type="button"
            onClick={() => insertTemplate('steps')}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-foreground hover:bg-accent"
          >
            <span>🔢</span> Hướng dẫn từng bước
          </button>
          <button
            type="button"
            onClick={() => insertTemplate('callout')}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-foreground hover:bg-accent"
          >
            <span>💡</span> Khung mẹo (Pro tip)
          </button>
        </div>
      )}
    </div>
  )

  const statsBar = (
    <div className="flex flex-wrap items-center justify-between border-t border-border bg-ink-950/40 px-3 py-1.5 text-xs text-muted-foreground">
      <div className="flex items-center gap-2">
        <span>
          <strong className="text-foreground">{wordCount}</strong> từ
        </span>
        <span>•</span>
        <span>
          ~<strong className="text-foreground">{readTimeMin}</strong> phút đọc
        </span>
        <span>•</span>
        <span>{charCount} ký tự</span>
        {currentToc.length > 0 && (
          <>
            <span>•</span>
            <span className="text-signal-400 font-medium">
              📑 <strong>{currentToc.length}</strong> tiêu đề (mục lục)
            </span>
          </>
        )}
      </div>
      <div className="hidden sm:flex items-center gap-2 text-[11px] text-muted-foreground">
        <span>Phím tắt:</span>
        <kbd className="rounded border border-border bg-ink-900 px-1 py-0.5 font-mono text-[10px]">Ctrl+B</kbd>
        <kbd className="rounded border border-border bg-ink-900 px-1 py-0.5 font-mono text-[10px]">Ctrl+I</kbd>
        <kbd className="rounded border border-border bg-ink-900 px-1 py-0.5 font-mono text-[10px]">Ctrl+K</kbd>
        <kbd className="rounded border border-border bg-ink-900 px-1 py-0.5 font-mono text-[10px]">Ctrl+V</kbd>
      </div>
    </div>
  )

  return (
    <div className="space-y-8">
      <EditorHeader
        title={isEditing ? 'Sửa bài viết' : 'Viết bài mới'}
        backLabel="Quay lại danh sách bài viết"
        onBack={() => router.navigate({ to: '/admin/blog' })}
        status={initialPost?.status}
        publishedAt={initialPost?.publishedAt}
        badges={<SeoScoreBadge checks={checks} />}
        actions={
          canEdit && (
            <>
              {isEditing && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/40 px-3.5 py-2 text-sm font-medium text-destructive hover:bg-destructive/10"
                >
                  <Trash2 aria-hidden="true" className="size-4" /> Xoá
                </button>
              )}
              <button
                type="button"
                onClick={() => handleSave('draft')}
                disabled={saving || !title.trim() || !content.trim()}
                className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-accent disabled:opacity-50"
              >
                {saving ? 'Đang lưu…' : 'Lưu nháp'}
              </button>
              <button
                type="button"
                onClick={() => handleSave('published')}
                disabled={saving || !title.trim() || !content.trim()}
                className="bg-brand-gradient inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-on-gradient hover:opacity-90 disabled:opacity-50"
              >
                {saving ? 'Đang đăng…' : isEditing && initialPost?.status === 'published' ? 'Cập nhật' : 'Đăng bài'}
              </button>
            </>
          )
        }
      />

      {ownership && <OwnershipNotice ownership={ownership} kind="bài viết" />}

      {error && (
        <div role="alert" className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Main Grid: Left Editor & Right Metadata. Read-only when the post is someone else's. */}
      <fieldset disabled={!canEdit} className="min-w-0">
        <div className="grid gap-8 lg:grid-cols-12">
          {/* Left Column: Post Core Content */}
          <div className="min-w-0 space-y-6 lg:col-span-8">
            {/* Title */}
            <div>
              <Label htmlFor="post-title" className="text-base font-semibold">
                Tiêu đề bài viết *
              </Label>
              <Input
                id="post-title"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="e.g. Modern Digital Signage Architectures in 2026"
                className="mt-2 h-12 text-lg font-medium"
                required
              />
            </div>

            {/* Slug */}
            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="post-slug" className="text-sm font-medium">
                  URL slug *
                </Label>
                <button
                  type="button"
                  onClick={() => setSlug(slugify(title))}
                  className="text-xs font-semibold text-signal-400 hover:text-signal-300"
                >
                  Tạo từ tiêu đề
                </button>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <span className="font-mono text-sm text-muted-foreground">/blog/</span>
                <Input
                  id="post-slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="modern-digital-signage-architectures"
                  className="font-mono text-sm"
                  required
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="post-description" className="text-sm font-medium">
                  Tóm tắt *
                </Label>
                <span
                  className={cn(
                    'text-xs font-mono',
                    description.length > 600 ? 'font-semibold text-destructive' : 'text-muted-foreground',
                  )}
                >
                  {description.length} / 600 ký tự
                </span>
              </div>
              <textarea
                id="post-description"
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value)
                  if (error) setError(null)
                }}
                rows={3}
                placeholder="1–2 câu (tiếng Anh) tóm tắt bài viết. Hiện trên card blog và trong kết quả Google."
                className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                required
              />
            </div>

            {/* Markdown Content Editor */}
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2">
                <div>
                  <Label className="text-base font-semibold">Nội dung bài viết *</Label>
                  <p className="text-xs text-muted-foreground">Sửa ở tab nào cũng được, ba tab luôn cùng một nội dung. Bài được lưu dưới dạng Markdown.</p>
                </div>
                <Tabs value={mode} onValueChange={(v) => setMode(v === 'markdown' || v === 'html' ? v : 'visual')}>
                  <TabsList aria-label="Cách soạn nội dung">
                    <TabsTrigger value="visual" icon={<Eye aria-hidden="true" className="size-3.5" />}>
                      Trực quan
                    </TabsTrigger>
                    <TabsTrigger value="markdown" icon={<PenLine aria-hidden="true" className="size-3.5" />}>
                      Markdown
                    </TabsTrigger>
                    <TabsTrigger value="html" icon={<Code2 aria-hidden="true" className="size-3.5" />}>
                      HTML
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {mode === 'markdown' ? (
                /* Write Only Mode */
                <div className="mt-3 flex flex-col overflow-hidden rounded-xl border border-border bg-background shadow-xs">
                  {/* Toolbar */}
                  <div className="relative flex flex-wrap items-center gap-1 border-b border-border bg-ink-950/30 p-2">
                    <button
                      type="button"
                      onClick={() => insertMarkdown('## ', '', 'Section Heading')}
                      title="Tiêu đề cấp 2 (H2)"
                      className="inline-flex size-8 items-center justify-center rounded hover:bg-accent text-foreground"
                    >
                      <Heading2 className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertMarkdown('### ', '', 'Subsection Heading')}
                      title="Tiêu đề cấp 3 (H3)"
                      className="inline-flex size-8 items-center justify-center rounded hover:bg-accent text-foreground"
                    >
                      <Heading3 className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertMarkdown('#### ', '', 'Minor Heading')}
                      title="Tiêu đề cấp 4 (H4)"
                      className="inline-flex size-8 items-center justify-center rounded hover:bg-accent text-foreground"
                    >
                      <Heading4 className="size-4" />
                    </button>

                    <div className="h-4 w-px bg-border mx-0.5" />

                    <button
                      type="button"
                      onClick={() => insertMarkdown('**', '**', 'bold text')}
                      title="In đậm (Ctrl+B)"
                      className="inline-flex size-8 items-center justify-center rounded hover:bg-accent text-foreground"
                    >
                      <Bold className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertMarkdown('*', '*', 'italic text')}
                      title="In nghiêng (Ctrl+I)"
                      className="inline-flex size-8 items-center justify-center rounded hover:bg-accent text-foreground"
                    >
                      <Italic className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertMarkdown('~~', '~~', 'strikethrough')}
                      title="Gạch ngang (Ctrl+Shift+X)"
                      className="inline-flex size-8 items-center justify-center rounded hover:bg-accent text-foreground"
                    >
                      <Strikethrough className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertMarkdown('`', '`', 'code')}
                      title="Code trong dòng (Ctrl+E)"
                      className="inline-flex size-8 items-center justify-center rounded hover:bg-accent text-foreground"
                    >
                      <Code className="size-4" />
                    </button>

                    <div className="h-4 w-px bg-border mx-0.5" />

                    <button
                      type="button"
                      onClick={() => insertMarkdown('- ', '', 'List item')}
                      title="Danh sách gạch đầu dòng"
                      className="inline-flex size-8 items-center justify-center rounded hover:bg-accent text-foreground"
                    >
                      <List className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertMarkdown('1. ', '', 'Numbered item')}
                      title="Danh sách đánh số"
                      className="inline-flex size-8 items-center justify-center rounded hover:bg-accent text-foreground"
                    >
                      <ListOrdered className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertMarkdown('- [ ] ', '', 'Task item')}
                      title="Checklist"
                      className="inline-flex size-8 items-center justify-center rounded hover:bg-accent text-foreground"
                    >
                      <CheckSquare className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertMarkdown('> ', '', 'Quoted text')}
                      title="Trích dẫn"
                      className="inline-flex size-8 items-center justify-center rounded hover:bg-accent text-foreground"
                    >
                      <Quote className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertMarkdown('\n```ts\n', '\n```\n', '// code snippet')}
                      title="Khối code"
                      className="inline-flex size-8 items-center justify-center rounded hover:bg-accent text-foreground"
                    >
                      <FileCode className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertAtCursor('\n\n---\n\n')}
                      title="Đường kẻ ngang"
                      className="inline-flex size-8 items-center justify-center rounded hover:bg-accent text-foreground"
                    >
                      <Minus className="size-4" />
                    </button>

                    <div className="h-4 w-px bg-border mx-0.5" />

                    <button
                      type="button"
                      onClick={() => insertMarkdown('[', '](https://viewixsoft.com)', 'link text')}
                      title="Chèn link (Ctrl+K)"
                      className="inline-flex size-8 items-center justify-center rounded hover:bg-accent text-foreground"
                    >
                      <LinkIcon className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setInsertImageSheetOpen(true)}
                      title="Chèn ảnh (tải lên / thư viện / URL)"
                      className="inline-flex size-8 items-center justify-center rounded hover:bg-accent text-foreground"
                    >
                      <ImageIcon className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        insertAtCursor(
                          '\n\n| Feature | Viewixsoft CMS | Legacy Approach |\n| --- | --- | --- |\n| Central Management | ✅ Real-time Cloud | ❌ Manual on-site |\n| Offline Caching | ✅ Edge Cache | ⚠️ Black screen |\n\n',
                        )
                      }
                      title="Chèn bảng so sánh"
                      className="inline-flex size-8 items-center justify-center rounded hover:bg-accent text-foreground"
                    >
                      <TableIcon className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        insertAtCursor('\n\n> 💡 **Pro Tip / Best Practice:**\n> Enter key recommendation here.\n\n')
                      }
                      title="Chèn khung ghi chú"
                      className="inline-flex size-8 items-center justify-center rounded hover:bg-accent text-foreground"
                    >
                      <AlertCircle className="size-4" />
                    </button>

                    {templatesMenu}
                  </div>

                  {pasteNotice && (
                    <div className="flex items-center gap-2 border-b border-signal-500/30 bg-signal-500/10 px-4 py-2 text-xs font-semibold text-signal-400">
                      <Check className="size-3.5" />
                      <span>{pasteNotice}</span>
                    </div>
                  )}

                  {isUploadingPaste && (
                    <div className="flex items-center gap-2 border-b border-border bg-signal-500/10 px-4 py-2 text-xs font-medium text-signal-400">
                      <Loader2 className="size-3.5 animate-spin" />
                      <span>Đang tải ảnh từ clipboard lên… Vui lòng chờ.</span>
                    </div>
                  )}

                  <textarea
                    id="post-content-textarea"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    onPaste={handlePaste}
                    onDrop={handleDrop}
                    onKeyDown={handleKeyDown}
                    rows={24}
                    placeholder="Viết bài bằng Markdown (nội dung tiếng Anh). Dán (Ctrl+V) từ Word/Google Docs/ChatGPT vẫn giữ định dạng, dán ảnh trực tiếp, hoặc dùng thanh công cụ…"
                    className="w-full resize-y bg-transparent p-4 font-mono text-sm leading-relaxed outline-none"
                    required
                  />

                  {statsBar}
                </div>
              ) : mode === 'html' ? (
                <HtmlSourceEditor
                  ref={contentEditorRef}
                  markdown={content}
                  onChange={setContent}
                  onRequestImage={() => setInsertImageSheetOpen(true)}
                  templatesMenu={templatesMenu}
                  footer={statsBar}
                />
              ) : (
                <Suspense fallback={<div className="mt-3 min-h-[600px] rounded-xl border border-border bg-card" />}>
                  <VisualEditor
                    ref={contentEditorRef}
                    markdown={content}
                    onChange={setContent}
                    onRequestImage={() => setInsertImageSheetOpen(true)}
                    onUploadImage={uploadImage}
                    templatesMenu={templatesMenu}
                    footer={statsBar}
                    disabled={!canEdit}
                  />
                </Suspense>
              )}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Ý chính (Key Takeaways)</CardTitle>
                <CardDescription>3–5 ý, mỗi ý một câu (tiếng Anh). Hiện trong khung ở đầu bài viết.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {keyTakeaways.map((point, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      value={point}
                      onChange={(e) => {
                        const updated = [...keyTakeaways]
                        updated[index] = e.target.value
                        setKeyTakeaways(updated)
                      }}
                      placeholder={`Ý chính #${index + 1}`}
                      aria-label={`Ý chính ${index + 1}`}
                      className="text-sm"
                    />
                    {keyTakeaways.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setKeyTakeaways((prev) => prev.filter((_, i) => i !== index))}
                        aria-label={`Xoá ý chính ${index + 1}`}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <X aria-hidden="true" className="size-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setKeyTakeaways((prev) => [...prev, ''])}
                  className="inline-flex items-center gap-1 pt-1 text-xs font-semibold text-signal-400 hover:text-signal-300"
                >
                  <Plus aria-hidden="true" className="size-3.5" /> Thêm ý
                </button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>FAQ (câu hỏi thường gặp)</CardTitle>
                <CardDescription>
                  2–5 câu hỏi người đọc hay hỏi, viết bằng tiếng Anh. Câu đầu của mỗi câu trả lời phải trả lời thẳng. Hiện cuối bài và được
                  đánh dấu FAQPage cho Google.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RepeatableList
                  label="câu hỏi"
                  items={faq}
                  max={8}
                  blank={{ question: '', answer: '' }}
                  onChange={setFaq}
                  renderItem={(item, update, i) => (
                    <div className="grid gap-3">
                      <TextField
                        id={`post-faq-q-${i}`}
                        label="Câu hỏi"
                        value={item.question}
                        onChange={(question) => update({ question })}
                        placeholder="How much does digital signage software cost?"
                      />
                      <TextField id={`post-faq-a-${i}`} label="Câu trả lời" value={item.answer} onChange={(answer) => update({ answer })} multiline />
                    </div>
                  )}
                />
              </CardContent>
            </Card>

            {/* Attached to the saved slug; a changed slug carries its schemas along when the post is saved. */}
            <PostSchemaPanel postId={initialPost?.id} slug={initialPost?.slug ?? slug} schemas={schemas} library={schemaLibrary} canEdit={canEdit} assets={mediaAssets} />
          </div>

          {/* Right Column: Taxonomy, Cover, Author, SEO */}
          <div className="space-y-6 lg:col-span-4">
            <SeoChecklist checks={checks} />

            <Card>
              <CardHeader>
                <CardTitle>Ảnh thumbnail</CardTitle>
                <CardDescription>Tỉ lệ 16:9. Hiện ở đầu bài viết, trên card blog và khi chia sẻ link.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {coverUrl ? (
                  <div className="overflow-hidden rounded-xl border border-border">
                    <img src={coverUrl} alt={coverAlt || 'Xem trước thumbnail'} className="aspect-video w-full object-cover" />
                    <div className="flex items-center justify-between gap-2 bg-muted/40 p-2">
                      <span className="truncate text-xs text-muted-foreground">{coverUrl}</span>
                      <button type="button" onClick={() => setCoverUrl('')} className="shrink-0 text-xs text-destructive hover:underline">
                        Bỏ ảnh
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setCoverPickerOpen(true)}
                    className="flex h-32 w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/30 p-4 text-center hover:border-signal-400"
                  >
                    <ImageIcon aria-hidden="true" className="size-6 text-muted-foreground" />
                    <span className="text-xs font-medium text-foreground">Chọn từ thư viện ảnh</span>
                  </button>
                )}
                <div>
                  <Label htmlFor="cover-alt" className="text-xs text-muted-foreground">
                    Alt text (mô tả ảnh bằng tiếng Anh)
                  </Label>
                  <Input
                    id="cover-alt"
                    value={coverAlt}
                    onChange={(e) => setCoverAlt(e.target.value)}
                    placeholder="Short description of the image"
                    className="mt-1 text-xs"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Phân loại</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="post-product" className="text-xs text-muted-foreground">
                    Sản phẩm liên quan
                  </Label>
                  <select
                    id="post-product"
                    value={product}
                    onChange={(e) => setProduct(e.target.value as any)}
                    className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"
                  >
                    {PRODUCTS.map((p) => (
                      <option key={p.slug} value={p.slug}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="post-category" className="text-xs text-muted-foreground">
                    Danh mục
                  </Label>
                  <Input
                    id="post-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g. Architecture, DOOH, Guide"
                    className="mt-1 text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="post-tags" className="text-xs text-muted-foreground">
                    Tags (ngăn cách bằng dấu phẩy)
                  </Label>
                  <Input
                    id="post-tags"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    placeholder="DOOH, Retail, Edge AI"
                    className="mt-1 text-sm"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tác giả</CardTitle>
                <CardDescription>Google và AI tin bài có tác giả thật, có chức danh, ảnh và giới thiệu hơn.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="post-author" className="text-xs text-muted-foreground">
                    Chọn tác giả
                  </Label>
                  <select
                    id="post-author"
                    value={authorId ?? ''}
                    onChange={(e) => setAuthorId(e.target.value || null)}
                    className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"
                  >
                    <option value="">Không chọn (dùng tên hiển thị bên dưới)</option>
                    {authors.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                        {a.role ? ` — ${a.role}` : ''}
                      </option>
                    ))}
                  </select>
                  <Link to="/admin/authors" className="mt-1.5 inline-block text-xs font-semibold text-signal-400 hover:text-signal-300">
                    Quản lý tác giả →
                  </Link>
                </div>
                {author ? (
                  <div className="flex items-start gap-3 rounded-xl border border-border p-3">
                    <LazyImage src={author.avatarUrl || '/logo.png'} alt="" className="size-10 rounded-full border border-border object-cover" />
                    <div className="min-w-0 text-xs">
                      <p className="font-semibold text-foreground">{author.name}</p>
                      <p className="text-muted-foreground">{author.role || 'Chưa có chức danh'}</p>
                      {author.bio && <p className="mt-1 line-clamp-3 text-muted-foreground">{author.bio}</p>}
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <Label htmlFor="author-name" className="text-xs text-muted-foreground">
                        Tên hiển thị
                      </Label>
                      <Input id="author-name" value={authorName} onChange={(e) => setAuthorName(e.target.value)} className="mt-1 text-sm" />
                    </div>
                    <div>
                      <Label htmlFor="author-role" className="text-xs text-muted-foreground">
                        Chức danh
                      </Label>
                      <Input
                        id="author-role"
                        value={authorRole}
                        onChange={(e) => setAuthorRole(e.target.value)}
                        placeholder="e.g. Lead Solutions Architect"
                        className="mt-1 text-sm"
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Hiển thị trên Google</CardTitle>
                <CardDescription>Không bắt buộc. Để trống thì dùng tiêu đề bài và phần tóm tắt (tự rút gọn).</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="post-seotitle" className="text-xs text-muted-foreground">
                    Tiêu đề tìm kiếm ({seoTitle.length}/47 ký tự)
                  </Label>
                  <Input
                    id="post-seotitle"
                    value={seoTitle}
                    onChange={(e) => setSeoTitle(e.target.value)}
                    placeholder="Title without “ — Viewixsoft”"
                    className="mt-1 text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="post-seodescription" className="text-xs text-muted-foreground">
                    Mô tả tìm kiếm ({seoDescription.length}/155 ký tự)
                  </Label>
                  <textarea
                    id="post-seodescription"
                    value={seoDescription}
                    onChange={(e) => setSeoDescription(e.target.value)}
                    rows={3}
                    maxLength={160}
                    placeholder="What the reader gets from this post, in one or two sentences."
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </fieldset>

      {/* Cover Image Picker Sheet */}
      <ImagePickerSheet
        open={coverPickerOpen}
        onClose={() => setCoverPickerOpen(false)}
        assets={localMediaAssets}
        currentId={null}
        description="Chọn một ảnh đã tải lên thư viện làm thumbnail."
        onPick={(asset) => {
          setCoverUrl(asset.url)
          if (!coverAlt) setCoverAlt(asset.alt)
          setCoverPickerOpen(false)
        }}
      />

      {/* Insert Image into Markdown Sheet */}
      <InsertImageSheet
        open={insertImageSheetOpen}
        onClose={() => setInsertImageSheetOpen(false)}
        assets={localMediaAssets}
        onInsert={({ url, alt }) => {
          insertImageMarkdown(url, alt)
        }}
        onAssetUploaded={(newAsset) => {
          setLocalMediaAssets((prev) => [newAsset, ...prev])
        }}
      />
    </div>
  )
}
