import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { Calendar, Edit, ExternalLink, Globe, Lock, Plus, Search, Trash2 } from 'lucide-react'
import { AdminPageHeader, LoadError } from '~/components/admin/admin-ui'
import { useConfirm, useToast } from '~/components/ui/feedback'
import { deleteBlogPostFn, getAdminBlogPostsFn, toggleBlogPostStatusFn } from '~/server/functions/blog'
import type { BlogPostRow } from '~/server/db/schema'
import { cn } from '~/lib/cn'
import { personName } from '~/components/admin/OwnershipNotice'

export const Route = createFileRoute('/admin/blog/')({
  loader: {
    staleReloadMode: 'blocking',
    handler: () => getAdminBlogPostsFn(),
  },
  component: AdminBlogListPage,
})

const STATUS_LABELS = { all: 'Tất cả', published: 'Đã đăng', draft: 'Bản nháp' } as const

function AdminBlogListPage() {
  const loaderData = Route.useLoaderData()
  const router = useRouter()
  const [posts, setPosts] = useState<BlogPostRow[]>(loaderData.posts ?? [])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all')
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [ownerFilter, setOwnerFilter] = useState<'all' | 'mine'>('all')
  const { people, me } = loaderData
  // Server functions enforce this too; here it only hides actions you can't take.
  const editable = (item: { createdBy: string | null }) => me.canEditOthers || item.createdBy === me.userId
  const confirm = useConfirm()
  const toast = useToast()

  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      post.title.toLowerCase().includes(search.toLowerCase()) ||
      post.slug.toLowerCase().includes(search.toLowerCase()) ||
      post.category.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' || post.status === statusFilter
    const matchesOwner = ownerFilter === 'all' || post.createdBy === me.userId
    return matchesSearch && matchesStatus && matchesOwner
  })

  const handleToggleStatus = async (post: BlogPostRow) => {
    const nextStatus = post.status === 'published' ? 'draft' : 'published'
    setTogglingId(post.id)
    try {
      const res = await toggleBlogPostStatusFn({
        data: { id: post.id, status: nextStatus },
      })
      if (res.ok && res.post) {
        setPosts((prev) => prev.map((p) => (p.id === post.id ? res.post : p)))
      } else if (!res.ok) {
        toast({ title: 'Không đổi được trạng thái', description: res.message, tone: 'error' })
      }
    } finally {
      setTogglingId(null)
    }
  }

  const handleDelete = (id: string, title: string) =>
    confirm({
      title: 'Xoá bài viết này?',
      description: `"${title}" sẽ bị xoá vĩnh viễn và không thể hoàn tác.`,
      confirmText: 'Xoá bài viết',
      tone: 'danger',
      onConfirm: async () => {
        const res = await deleteBlogPostFn({ data: { id } })
        if (!res.ok) return res.message
        setPosts((prev) => prev.filter((p) => p.id !== id))
        toast({ title: 'Đã xoá bài viết', description: title, tone: 'success' })
      },
    })

  return (
    <>
      <AdminPageHeader
        title="Blog"
        description="Viết, sửa và đăng bài lên blog Viewixsoft."
        actions={
          <Link
            to="/admin/blog/new"
            className="bg-brand-gradient inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-on-gradient hover:opacity-90"
          >
            <Plus aria-hidden="true" className="size-4" /> Viết bài mới
          </Link>
        }
      />

      {!loaderData.ok && <LoadError>Không tải được danh sách bài viết. Hãy kiểm tra kết nối database.</LoadError>}

      {loaderData.ok && (
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-card p-4">
            <div className="relative min-w-[240px] flex-1 sm:max-w-xs">
              <Search aria-hidden="true" className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm theo tiêu đề hoặc slug…"
                aria-label="Tìm bài viết"
                className="h-10 w-full rounded-md border border-input bg-background pr-3 pl-9 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">Người tạo:</span>
              <div className="flex rounded-lg border border-border p-0.5">
                {(['all', 'mine'] as const).map((owner) => (
                  <button
                    key={owner}
                    type="button"
                    onClick={() => setOwnerFilter(owner)}
                    aria-pressed={ownerFilter === owner}
                    className={cn(
                      'rounded-md px-3 py-1 text-xs font-semibold transition-colors',
                      ownerFilter === owner ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {owner === 'all' ? 'Tất cả' : 'Bài của tôi'}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">Trạng thái:</span>
              <div className="flex rounded-lg border border-border p-0.5">
                {(['all', 'published', 'draft'] as const).map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setStatusFilter(status)}
                    className={cn(
                      'rounded-md px-3 py-1 text-xs font-semibold transition-colors',
                      statusFilter === status
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {STATUS_LABELS[status]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Posts Table */}
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40 font-mono text-xs tracking-wider text-muted-foreground uppercase">
                    <th className="px-6 py-3.5 font-medium">Bài viết</th>
                    <th className="px-6 py-3.5 font-medium">Sản phẩm / danh mục</th>
                    <th className="px-6 py-3.5 font-medium">Trạng thái</th>
                    <th className="px-6 py-3.5 font-medium">Ngày đăng / tạo</th>
                    <th className="px-6 py-3.5 text-right font-medium">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredPosts.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-sm text-muted-foreground">
                        {posts.length === 0 ? (
                          <div>
                            <p className="font-medium">Chưa có bài viết nào.</p>
                            <p className="mt-1 text-xs">Bấm nút "Viết bài mới" ở trên để tạo bài đầu tiên.</p>
                          </div>
                        ) : (
                          <p>Không có bài viết nào khớp với tìm kiếm hoặc bộ lọc.</p>
                        )}
                      </td>
                    </tr>
                  ) : (
                    filteredPosts.map((post) => (
                      <tr key={post.id} className="hover:bg-muted/20">
                        <td className="px-6 py-4">
                          <div className="min-w-0 max-w-md">
                            <Link
                              to="/admin/blog/$id"
                              params={{ id: post.id }}
                              className="font-medium text-foreground hover:text-signal-400"
                            >
                              {post.title}
                            </Link>
                            <p className="truncate font-mono text-xs text-muted-foreground">/blog/{post.slug}</p>
                            <p className="text-xs text-muted-foreground">Tạo bởi {personName(people, post.createdBy)}</p>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <span className="rounded-full border border-border bg-background px-2.5 py-0.5 text-xs text-foreground uppercase">
                            {post.product}
                          </span>
                          <span className="ml-2 text-xs text-muted-foreground">{post.category}</span>
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold',
                              post.status === 'published'
                                ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                                : 'border border-amber-500/30 bg-amber-500/10 text-amber-400',
                            )}
                          >
                            {post.status === 'published' ? <Globe className="size-3" /> : <Lock className="size-3" />}
                            {STATUS_LABELS[post.status]}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-xs text-muted-foreground">
                          {post.publishedAt ? (
                            <span className="flex items-center gap-1 text-foreground">
                              <Calendar className="size-3 text-muted-foreground" />
                              {new Date(post.publishedAt).toLocaleDateString('vi-VN')}
                            </span>
                          ) : (
                            <span>Tạo ngày {new Date(post.createdAt).toLocaleDateString('vi-VN')}</span>
                          )}
                        </td>

                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {post.status === 'published' && (
                              <a
                                href={`/blog/${post.slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Xem trên website"
                                aria-label={`Xem ${post.title} trên website`}
                                className="inline-flex size-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground"
                              >
                                <ExternalLink className="size-3.5" />
                              </a>
                            )}

                            {editable(post) && (
                              <button
                                type="button"
                                onClick={() => handleToggleStatus(post)}
                                disabled={togglingId === post.id}
                                title={post.status === 'published' ? 'Chuyển về bản nháp' : 'Đăng ngay'}
                                className="rounded-md border border-border px-2.5 py-1 text-xs font-medium hover:bg-muted"
                              >
                                {post.status === 'published' ? 'Gỡ đăng' : 'Đăng'}
                              </button>
                            )}

                            <Link
                              to="/admin/blog/$id"
                              params={{ id: post.id }}
                              title={editable(post) ? 'Sửa' : 'Xem (chỉ đọc)'}
                              aria-label={`Sửa ${post.title}`}
                              className="inline-flex size-8 items-center justify-center rounded-lg border border-border text-foreground hover:bg-muted"
                            >
                              <Edit className="size-3.5" />
                            </Link>

                            {editable(post) && (
                              <button
                                type="button"
                                onClick={() => handleDelete(post.id, post.title)}
                                title="Xoá"
                                aria-label={`Xoá ${post.title}`}
                                className="inline-flex size-8 items-center justify-center rounded-lg border border-destructive/30 text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="size-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
