import { useEffect, useMemo, useState } from 'react'
import { useRouter } from '@tanstack/react-router'
import { ArrowRight, Check, ExternalLink, Globe, Lock, Plus, RotateCcw, Search, Trash2 } from 'lucide-react'
import { Panel, buttonPrimary, buttonSecondary } from '~/components/admin/admin-ui'
import { useConfirm, useToast } from '~/components/ui/feedback'
import { cn } from '~/lib/cn'
import {
  EDITABLE_SLUG_PAGES,
  normalizePath,
  setActiveSlugMap,
  toPublicPath,
} from '~/lib/slugs'
import type { EditableSlugPage, SlugMap } from '~/lib/slugs'
import type { PageSlugRow, UrlRedirectRow } from '~/server/db/schema'
import {
  createRedirectFn,
  deleteRedirectFn,
  resetPageSlugFn,
  savePageSlugFn,
  updateContentSlugFn,
} from '~/server/functions/slugs'

export interface ContentSlugItem {
  id: string
  title: string
  slug: string
  status: 'draft' | 'published'
  updatedAt: string
}

interface SlugsManagerProps {
  initialPageSlugs: PageSlugRow[]
  initialRedirects: UrlRedirectRow[]
  initialPosts: ContentSlugItem[]
  initialUseCases: ContentSlugItem[]
}

type TabId = 'pages' | 'blog' | 'use-cases' | 'redirects'

const PAGE_GROUPS: { id: EditableSlugPage['group']; title: string; description: string }[] = [
  {
    id: 'collections',
    title: 'Trang danh mục (tự động đổi prefix trang con)',
    description:
      'Khi đổi đường dẫn của một trang danh mục (ví dụ /blog → /tin-tuc), toàn bộ trang con bên trong sẽ tự động cập nhật theo và đường dẫn cũ được chuyển hướng 301.',
  },
  {
    id: 'main',
    title: 'Trang chính',
    description: 'Các trang độc lập trên website. Trang chủ (/) được giữ cố định.',
  },
  {
    id: 'products',
    title: 'Trang sản phẩm',
    description: 'Mặc định kế thừa prefix từ Danh mục Sản phẩm, hoặc bạn có thể đặt một đường dẫn tuỳ chỉnh riêng.',
  },
  {
    id: 'filters',
    title: 'Trang bộ lọc (Blog & Case studies)',
    description:
      'Đặt đường dẫn đẹp cho các trang đang lọc theo sản phẩm (ví dụ /blog?product=cms → /blog/cms). Link cũ có ?product=… sẽ tự động chuyển hướng 301.',
  },
  {
    id: 'legal',
    title: 'Trang pháp lý',
    description: 'Chính sách bảo mật, điều khoản dịch vụ và chính sách cookie.',
  },
]

const inputClass =
  'h-9 w-full rounded-md border border-input bg-background px-3 font-mono text-sm text-foreground outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50'

/** Extracts the first readable message from a server ZodError JSON string or Error. */
function formatClientError(error: unknown, fallback: string): string {
  if (!(error instanceof Error) || !error.message) return fallback
  try {
    const parsed: unknown = JSON.parse(error.message)
    if (Array.isArray(parsed) && parsed[0] && typeof parsed[0] === 'object' && 'message' in parsed[0]) {
      const msg = (parsed[0] as { message?: unknown }).message
      if (typeof msg === 'string' && msg) return msg
    }
  } catch {
    // Plain error string, not JSON.
  }
  return error.message
}

export function SlugsManager({
  initialPageSlugs,
  initialRedirects,
  initialPosts,
  initialUseCases,
}: SlugsManagerProps) {
  const router = useRouter()
  const toast = useToast()
  const confirm = useConfirm()

  const [tab, setTab] = useState<TabId>('pages')
  const [search, setSearch] = useState('')

  const [pageSlugs, setPageSlugs] = useState<PageSlugRow[]>(initialPageSlugs)
  const [redirects, setRedirects] = useState<UrlRedirectRow[]>(initialRedirects)
  const [posts, setPosts] = useState<ContentSlugItem[]>(initialPosts)
  const [useCases, setUseCases] = useState<ContentSlugItem[]>(initialUseCases)

  useEffect(() => setPageSlugs(initialPageSlugs), [initialPageSlugs])
  useEffect(() => setRedirects(initialRedirects), [initialRedirects])
  useEffect(() => setPosts(initialPosts), [initialPosts])
  useEffect(() => setUseCases(initialUseCases), [initialUseCases])

  // Local draft inputs keyed by pageKey or content id.
  const [pageDrafts, setPageDrafts] = useState<Record<string, string>>({})
  const [contentDrafts, setContentDrafts] = useState<Record<string, string>>({})
  const [savingKey, setSavingKey] = useState<string | null>(null)

  // Manual redirect form state.
  const [newFrom, setNewFrom] = useState('')
  const [newTo, setNewTo] = useState('')
  const [addingRedirect, setAddingRedirect] = useState(false)

  const slugMap: SlugMap = useMemo(
    () => Object.fromEntries(pageSlugs.map((r) => [r.defaultPath, r.customPath])),
    [pageSlugs],
  )

  const refreshAll = async () => {
    await router.invalidate()
  }

  const syncClientSlugMap = (nextRows: PageSlugRow[]) => {
    setPageSlugs(nextRows)
    setActiveSlugMap(Object.fromEntries(nextRows.map((r) => [r.defaultPath, r.customPath])))
  }

  const handleSavePageSlug = async (page: EditableSlugPage) => {
    const saved = pageSlugs.find((r) => r.pageKey === page.key)
    const raw = pageDrafts[page.key] ?? saved?.customPath ?? page.defaultPath
    const normalized = normalizePath(raw)
    setSavingKey(page.key)
    try {
      const res = await savePageSlugFn({ data: { pageKey: page.key, customPath: normalized } })
      if (!res.ok) {
        toast({ title: 'Không lưu được đường dẫn', description: res.message, tone: 'error' })
        return
      }
      const nextRows =
        res.customPath === page.defaultPath
          ? pageSlugs.filter((r) => r.pageKey !== page.key)
          : [
              ...pageSlugs.filter((r) => r.pageKey !== page.key),
              {
                pageKey: page.key,
                defaultPath: page.defaultPath,
                customPath: res.customPath,
                updatedBy: null,
                updatedAt: new Date(),
              },
            ]
      syncClientSlugMap(nextRows)
      setPageDrafts((prev) => {
        const next = { ...prev }
        delete next[page.key]
        return next
      })
      toast({
        title: 'Đã cập nhật đường dẫn',
        description: `${page.label} → ${res.customPath}`,
        tone: 'success',
      })
      await refreshAll()
    } catch (error) {
      toast({
        title: 'Đường dẫn không hợp lệ',
        description: formatClientError(error, 'Đường dẫn không hợp lệ.'),
        tone: 'error',
      })
    } finally {
      setSavingKey(null)
    }
  }

  const handleResetPageSlug = (page: EditableSlugPage) =>
    confirm({
      title: 'Khôi phục đường dẫn mặc định?',
      description: `Đường dẫn của "${page.label}" sẽ quay về ${page.defaultPath} và đường dẫn cũ sẽ tự động chuyển hướng 301.`,
      confirmText: 'Khôi phục',
      onConfirm: async () => {
        setSavingKey(page.key)
        try {
          const res = await resetPageSlugFn({ data: { pageKey: page.key } })
          if (!res.ok) return res.message
          syncClientSlugMap(pageSlugs.filter((r) => r.pageKey !== page.key))
          setPageDrafts((prev) => {
            const next = { ...prev }
            delete next[page.key]
            return next
          })
          toast({
            title: 'Đã khôi phục đường dẫn mặc định',
            description: `${page.label} → ${page.defaultPath}`,
            tone: 'success',
          })
          await refreshAll()
        } finally {
          setSavingKey(null)
        }
      },
    })

  const handleSaveContentSlug = async (kind: 'blog' | 'use-case', item: ContentSlugItem) => {
    const draft = (contentDrafts[item.id] ?? item.slug).trim().toLowerCase()
    if (!draft || draft === item.slug) return
    setSavingKey(item.id)
    try {
      const res = await updateContentSlugFn({ data: { kind, id: item.id, slug: draft } })
      if (!res.ok) {
        toast({ title: 'Không đổi được slug', description: res.message, tone: 'error' })
        return
      }
      if (kind === 'blog') {
        setPosts((prev) => prev.map((p) => (p.id === item.id ? { ...p, slug: res.slug } : p)))
      } else {
        setUseCases((prev) => prev.map((u) => (u.id === item.id ? { ...u, slug: res.slug } : u)))
      }
      setContentDrafts((prev) => {
        const next = { ...prev }
        delete next[item.id]
        return next
      })
      toast({
        title: 'Đã đổi slug và tạo redirect 301',
        description: `${item.slug} → ${res.slug}`,
        tone: 'success',
      })
      await refreshAll()
    } catch (error) {
      toast({
        title: 'Slug không hợp lệ',
        description: formatClientError(error, 'Slug không hợp lệ.'),
        tone: 'error',
      })
    } finally {
      setSavingKey(null)
    }
  }

  const handleCreateRedirect = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newFrom.trim() || !newTo.trim()) return
    setAddingRedirect(true)
    try {
      const res = await createRedirectFn({
        data: { fromPath: normalizePath(newFrom), toPath: normalizePath(newTo) },
      })
      if (!res.ok) {
        toast({ title: 'Không tạo được chuyển hướng', description: res.message, tone: 'error' })
        return
      }
      setNewFrom('')
      setNewTo('')
      toast({ title: 'Đã thêm chuyển hướng 301', tone: 'success' })
      await refreshAll()
    } catch (error) {
      toast({
        title: 'Đường dẫn không hợp lệ',
        description: formatClientError(error, 'Đường dẫn không hợp lệ.'),
        tone: 'error',
      })
    } finally {
      setAddingRedirect(false)
    }
  }

  const handleDeleteRedirect = (row: UrlRedirectRow) =>
    confirm({
      title: 'Xoá chuyển hướng 301 này?',
      description: `Khách truy cập ${row.fromPath} sẽ không còn tự động chuyển sang ${row.toPath}.`,
      confirmText: 'Xoá chuyển hướng',
      tone: 'danger',
      onConfirm: async () => {
        const res = await deleteRedirectFn({ data: { id: row.id } })
        if (!res.ok) return res.message
        setRedirects((prev) => prev.filter((r) => r.id !== row.id))
        toast({ title: 'Đã xoá chuyển hướng 301', tone: 'success' })
        await refreshAll()
      },
    })

  const query = search.trim().toLowerCase()
  const blogPrefix = toPublicPath('/blog', slugMap)
  const useCasePrefix = toPublicPath('/case-studies', slugMap)

  const filteredPosts = posts.filter(
    (p) => !query || p.title.toLowerCase().includes(query) || p.slug.toLowerCase().includes(query),
  )
  const filteredUseCases = useCases.filter(
    (u) => !query || u.title.toLowerCase().includes(query) || u.slug.toLowerCase().includes(query),
  )
  const filteredRedirects = redirects.filter(
    (r) => !query || r.fromPath.toLowerCase().includes(query) || r.toPath.toLowerCase().includes(query),
  )

  const tabs: { id: TabId; label: string; count: number }[] = [
    { id: 'pages', label: 'Trang & danh mục', count: EDITABLE_SLUG_PAGES.length },
    { id: 'blog', label: 'Bài viết Blog', count: posts.length },
    { id: 'use-cases', label: 'Case studies', count: useCases.length },
    { id: 'redirects', label: 'Chuyển hướng 301', count: redirects.length },
  ]

  return (
    <div className="space-y-6">
      {/* Tabs & Search bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-card p-4">
        <div role="tablist" aria-label="Danh mục chỉnh sửa đường dẫn" className="flex flex-wrap gap-1.5">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                tab === t.id
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <span>{t.label}</span>
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.5 font-mono text-[11px]',
                  tab === t.id ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground',
                )}
              >
                {t.count}
              </span>
            </button>
          ))}
        </div>

        <div className="relative min-w-[220px] flex-1 sm:max-w-xs">
          <Search aria-hidden="true" className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên trang hoặc đường dẫn…"
            aria-label="Tìm trang hoặc đường dẫn"
            className="h-9 w-full rounded-md border border-input bg-background pr-3 pl-9 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          />
        </div>
      </div>

      {/* Tab 1: Static, collection, product & legal pages */}
      {tab === 'pages' && (
        <div className="space-y-6">
          {PAGE_GROUPS.map((group) => {
            const pages = EDITABLE_SLUG_PAGES.filter((p) => {
              if (p.group !== group.id) return false
              if (!query) return true
              const effective = toPublicPath(p.defaultPath, slugMap)
              return (
                p.label.toLowerCase().includes(query) ||
                p.defaultPath.toLowerCase().includes(query) ||
                effective.toLowerCase().includes(query)
              )
            })
            if (pages.length === 0) return null

            return (
              <Panel key={group.id} title={group.title} description={group.description}>
                <ul className="divide-y divide-border rounded-xl border border-border bg-background">
                  {pages.map((page) => {
                    const saved = pageSlugs.find((r) => r.pageKey === page.key)
                    const isFilter = page.defaultPath.includes('?')
                    const effectivePath = toPublicPath(page.defaultPath, slugMap)
                    const inheritedFromCollection = !saved && !isFilter && effectivePath !== page.defaultPath
                    const currentBaseline = saved?.customPath ?? (isFilter ? '' : effectivePath)
                    const value = pageDrafts[page.key] ?? currentBaseline
                    const isDirty = isFilter
                      ? value.trim().length > 0 && normalizePath(value) !== currentBaseline
                      : normalizePath(value) !== currentBaseline
                    const isSaving = savingKey === page.key

                    return (
                      <li key={page.key} className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="min-w-0 lg:w-72 lg:shrink-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-medium text-foreground">{page.label}</span>
                            {saved && (
                              <span className="rounded-full border border-signal-500/30 bg-signal-500/10 px-2 py-0.5 font-mono text-[11px] text-signal-400">
                                Đã tuỳ chỉnh
                              </span>
                            )}
                            {inheritedFromCollection && (
                              <span className="rounded-full border border-border bg-muted px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
                                Theo danh mục
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                            Mặc định: {page.defaultPath}
                          </p>
                        </div>

                        <div className="flex flex-1 flex-wrap items-center gap-2">
                          <label htmlFor={`slug-${page.key}`} className="sr-only">
                            Đường dẫn cho {page.label}
                          </label>
                          <input
                            id={`slug-${page.key}`}
                            type="text"
                            value={value}
                            onChange={(e) => setPageDrafts((prev) => ({ ...prev, [page.key]: e.target.value }))}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && isDirty && !isSaving) void handleSavePageSlug(page)
                            }}
                            placeholder={page.examplePath ? `Ví dụ: ${page.examplePath}` : page.defaultPath}
                            className={cn(inputClass, 'min-w-[200px] flex-1')}
                          />

                          <button
                            type="button"
                            onClick={() => void handleSavePageSlug(page)}
                            disabled={!isDirty || isSaving}
                            className={cn(buttonPrimary, 'h-9 px-3 text-xs')}
                          >
                            <Check aria-hidden="true" className="size-3.5" />
                            {isSaving ? 'Đang lưu…' : 'Lưu'}
                          </button>

                          {saved && (
                            <button
                              type="button"
                              onClick={() => void handleResetPageSlug(page)}
                              disabled={isSaving}
                              title="Khôi phục đường dẫn mặc định"
                              className={cn(buttonSecondary, 'h-9 px-2.5 text-xs')}
                            >
                              <RotateCcw aria-hidden="true" className="size-3.5" />
                              Mặc định
                            </button>
                          )}

                          <a
                            href={effectivePath}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={`Mở ${effectivePath}`}
                            aria-label={`Mở ${page.label} tại ${effectivePath}`}
                            className="inline-flex size-9 items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground"
                          >
                            <ExternalLink aria-hidden="true" className="size-3.5" />
                          </a>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </Panel>
            )
          })}
        </div>
      )}

      {/* Tab 2: Blog posts */}
      {tab === 'blog' && (
        <Panel
          title="Slug bài viết Blog"
          description={`Prefix hiện tại của Blog là ${blogPrefix}. Khi đổi slug bài viết, hệ thống sẽ tự động tạo chuyển hướng 301 từ đường dẫn cũ sang đường dẫn mới.`}
        >
          <ContentSlugList
            kind="blog"
            prefix={blogPrefix}
            items={filteredPosts}
            drafts={contentDrafts}
            savingKey={savingKey}
            emptyMessage="Chưa có bài viết blog nào trong database."
            onChange={(id, val) => setContentDrafts((prev) => ({ ...prev, [id]: val }))}
            onSave={(item) => void handleSaveContentSlug('blog', item)}
          />
        </Panel>
      )}

      {/* Tab 3: Case studies */}
      {tab === 'use-cases' && (
        <Panel
          title="Slug Case studies"
          description={`Prefix hiện tại của Case studies là ${useCasePrefix}. Khi đổi slug case study, hệ thống sẽ tự động tạo chuyển hướng 301 từ đường dẫn cũ sang đường dẫn mới.`}
        >
          <ContentSlugList
            kind="use-case"
            prefix={useCasePrefix}
            items={filteredUseCases}
            drafts={contentDrafts}
            savingKey={savingKey}
            emptyMessage="Chưa có case study nào trong database."
            onChange={(id, val) => setContentDrafts((prev) => ({ ...prev, [id]: val }))}
            onSave={(item) => void handleSaveContentSlug('use-case', item)}
          />
        </Panel>
      )}

      {/* Tab 4: 301 Redirects */}
      {tab === 'redirects' && (
        <div className="space-y-6">
          <Panel
            title="Thêm chuyển hướng 301 thủ công"
            description="Dùng khi bạn muốn chuyển một đường dẫn cũ bất kỳ sang trang đích mới để giữ thứ hạng SEO."
          >
            <form onSubmit={(e) => void handleCreateRedirect(e)} className="grid gap-3 sm:grid-cols-[1fr_auto_1fr_auto] sm:items-end">
              <div>
                <label htmlFor="redirect-from" className="mb-1 block text-xs font-medium text-muted-foreground">
                  Đường dẫn cũ (nguồn)
                </label>
                <input
                  id="redirect-from"
                  type="text"
                  value={newFrom}
                  onChange={(e) => setNewFrom(e.target.value)}
                  placeholder="/duong-dan-cu"
                  className={inputClass}
                  required
                />
              </div>
              <ArrowRight aria-hidden="true" className="hidden size-4 text-muted-foreground sm:mb-2.5 sm:block" />
              <div>
                <label htmlFor="redirect-to" className="mb-1 block text-xs font-medium text-muted-foreground">
                  Đường dẫn đích
                </label>
                <input
                  id="redirect-to"
                  type="text"
                  value={newTo}
                  onChange={(e) => setNewTo(e.target.value)}
                  placeholder="/duong-dan-moi"
                  className={inputClass}
                  required
                />
              </div>
              <button type="submit" disabled={addingRedirect} className={cn(buttonPrimary, 'h-9 px-4 text-xs')}>
                <Plus aria-hidden="true" className="size-3.5" />
                {addingRedirect ? 'Đang thêm…' : 'Thêm 301'}
              </button>
            </form>
          </Panel>

          <Panel
            title="Danh sách chuyển hướng 301 đang hoạt động"
            description="Các chuyển hướng được tạo tự động khi đổi slug hoặc thêm thủ công ở trên."
          >
            {filteredRedirects.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Chưa có chuyển hướng 301 nào.</p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-border bg-background">
                <table className="w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 font-mono text-xs uppercase text-muted-foreground">
                      <th className="px-4 py-3 font-medium">Từ đường dẫn</th>
                      <th className="px-4 py-3 font-medium">Chuyển tới (301)</th>
                      <th className="px-4 py-3 font-medium">Ngày tạo</th>
                      <th className="px-4 py-3 text-right font-medium">Xoá</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredRedirects.map((row) => {
                      const effectiveTarget = toPublicPath(row.toPath, slugMap)
                      return (
                        <tr key={row.id} className="hover:bg-muted/20">
                          <td className="px-4 py-3 font-mono text-xs text-foreground">{row.fromPath}</td>
                          <td className="px-4 py-3 font-mono text-xs text-signal-400">{effectiveTarget}</td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">
                            {new Date(row.createdAt).toLocaleDateString('vi-VN')}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              type="button"
                              onClick={() => void handleDeleteRedirect(row)}
                              title="Xoá chuyển hướng"
                              aria-label={`Xoá chuyển hướng từ ${row.fromPath}`}
                              className="inline-flex size-8 items-center justify-center rounded-lg border border-destructive/30 text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 aria-hidden="true" className="size-3.5" />
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        </div>
      )}
    </div>
  )
}

function ContentSlugList({
  kind,
  prefix,
  items,
  drafts,
  savingKey,
  emptyMessage,
  onChange,
  onSave,
}: {
  kind: 'blog' | 'use-case'
  prefix: string
  items: ContentSlugItem[]
  drafts: Record<string, string>
  savingKey: string | null
  emptyMessage: string
  onChange: (id: string, value: string) => void
  onSave: (item: ContentSlugItem) => void
}) {
  if (items.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">{emptyMessage}</p>
  }

  return (
    <ul className="divide-y divide-border rounded-xl border border-border bg-background">
      {items.map((item) => {
        const value = drafts[item.id] ?? item.slug
        const isDirty = value.trim().toLowerCase() !== item.slug
        const isSaving = savingKey === item.id
        const publicUrl = `${prefix}/${item.slug}`

        return (
          <li key={item.id} className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0 lg:w-72 lg:shrink-0">
              <p className="truncate font-medium text-foreground">{item.title}</p>
              <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                <span
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium',
                    item.status === 'published'
                      ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                      : 'border border-amber-500/30 bg-amber-500/10 text-amber-400',
                  )}
                >
                  {item.status === 'published' ? <Globe className="size-3" /> : <Lock className="size-3" />}
                  {item.status === 'published' ? 'Đã đăng' : 'Bản nháp'}
                </span>
              </div>
            </div>

            <div className="flex flex-1 flex-wrap items-center gap-2">
              <div className="flex min-w-[240px] flex-1 items-center overflow-hidden rounded-md border border-input bg-background focus-within:ring-[3px] focus-within:ring-ring/50">
                <span className="shrink-0 border-r border-border bg-muted/50 px-2.5 py-2 font-mono text-xs text-muted-foreground">
                  {prefix}/
                </span>
                <label htmlFor={`slug-${kind}-${item.id}`} className="sr-only">
                  Slug cho {item.title}
                </label>
                <input
                  id={`slug-${kind}-${item.id}`}
                  type="text"
                  value={value}
                  onChange={(e) => onChange(item.id, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && isDirty && !isSaving) onSave(item)
                  }}
                  className="h-9 min-w-0 flex-1 bg-transparent px-2.5 font-mono text-sm text-foreground outline-none"
                />
              </div>

              <button
                type="button"
                onClick={() => onSave(item)}
                disabled={!isDirty || isSaving}
                className={cn(buttonPrimary, 'h-9 px-3 text-xs')}
              >
                <Check aria-hidden="true" className="size-3.5" />
                {isSaving ? 'Đang lưu…' : 'Lưu'}
              </button>

              {item.status === 'published' && (
                <a
                  href={publicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={`Mở ${publicUrl}`}
                  aria-label={`Mở ${item.title} tại ${publicUrl}`}
                  className="inline-flex size-9 items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground"
                >
                  <ExternalLink aria-hidden="true" className="size-3.5" />
                </a>
              )}
            </div>
          </li>
        )
      })}
    </ul>
  )
}
