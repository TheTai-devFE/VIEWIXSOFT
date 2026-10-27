import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { Calendar, Edit, ExternalLink, Globe, Lock, Plus, Search, Trash2 } from 'lucide-react'
import { AdminPageHeader, LoadError } from '~/components/admin/admin-ui'
import { useConfirm, useToast } from '~/components/ui/feedback'
import { deleteUseCaseFn, getAdminUseCasesFn, toggleUseCaseStatusFn } from '~/server/functions/use-cases'
import type { UseCaseRow } from '~/server/db/schema'
import { cn } from '~/lib/cn'
import { personName } from '~/components/admin/OwnershipNotice'

export const Route = createFileRoute('/admin/use-cases/')({
  loader: {
    staleReloadMode: 'blocking',
    handler: () => getAdminUseCasesFn(),
  },
  component: AdminUseCasesListPage,
})

const STATUS_LABELS = { all: 'Tất cả', published: 'Đã đăng', draft: 'Bản nháp' } as const

function AdminUseCasesListPage() {
  const loaderData = Route.useLoaderData()
  const [useCases, setUseCases] = useState<UseCaseRow[]>(loaderData.useCases ?? [])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all')
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [ownerFilter, setOwnerFilter] = useState<'all' | 'mine'>('all')
  const { people, me } = loaderData
  // Server functions enforce this too; here it only hides actions you can't take.
  const editable = (item: { createdBy: string | null }) => me.canEditOthers || item.createdBy === me.userId
  const confirm = useConfirm()
  const toast = useToast()

  const filteredUseCases = useCases.filter((uc) => {
    const matchesSearch =
      uc.title.toLowerCase().includes(search.toLowerCase()) ||
      uc.slug.toLowerCase().includes(search.toLowerCase()) ||
      uc.industry.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' || uc.status === statusFilter
    const matchesOwner = ownerFilter === 'all' || uc.createdBy === me.userId
    return matchesSearch && matchesStatus && matchesOwner
  })

  const handleToggleStatus = async (uc: UseCaseRow) => {
    const nextStatus = uc.status === 'published' ? 'draft' : 'published'
    setTogglingId(uc.id)
    try {
      const res = await toggleUseCaseStatusFn({
        data: { id: uc.id, status: nextStatus },
      })
      if (res.ok && res.useCase) {
        setUseCases((prev) => prev.map((item) => (item.id === uc.id ? res.useCase : item)))
      } else if (!res.ok) {
        toast({ title: 'Không đổi được trạng thái', description: res.message, tone: 'error' })
      }
    } finally {
      setTogglingId(null)
    }
  }

  const handleDelete = (id: string, title: string) =>
    confirm({
      title: 'Xoá case study này?',
      description: `"${title}" sẽ bị xoá vĩnh viễn và không thể hoàn tác.`,
      confirmText: 'Xoá case study',
      tone: 'danger',
      onConfirm: async () => {
        const res = await deleteUseCaseFn({ data: { id } })
        if (!res.ok) return res.message
        setUseCases((prev) => prev.filter((item) => item.id !== id))
        toast({ title: 'Đã xoá case study', description: title, tone: 'success' })
      },
    })

  return (
    <>
      <AdminPageHeader
        title="Case studies"
        description="Viết và đăng bài giải pháp theo ngành, câu chuyện khách hàng."
        actions={
          <Link
            to="/admin/use-cases/new"
            className="bg-brand-gradient inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-on-gradient hover:opacity-90"
          >
            <Plus aria-hidden="true" className="size-4" /> Thêm case study
          </Link>
        }
      />

      {!loaderData.ok && <LoadError>Không tải được danh sách case study. Hãy kiểm tra kết nối database.</LoadError>}

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
                placeholder="Tìm theo tiêu đề, slug hoặc ngành…"
                aria-label="Tìm case study"
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
                    {owner === 'all' ? 'Tất cả' : 'Của tôi'}
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

          {/* Table */}
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40 font-mono text-xs tracking-wider text-muted-foreground uppercase">
                    <th className="px-6 py-3.5 font-medium">Tiêu đề & slug</th>
                    <th className="px-6 py-3.5 font-medium">Ngành</th>
                    <th className="px-6 py-3.5 font-medium">Trạng thái</th>
                    <th className="px-6 py-3.5 font-medium">Ngày đăng / tạo</th>
                    <th className="px-6 py-3.5 text-right font-medium">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredUseCases.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-sm text-muted-foreground">
                        {useCases.length === 0 ? (
                          <div>
                            <p className="font-medium">Chưa có case study nào.</p>
                            <p className="mt-1 text-xs">Bấm nút "Thêm case study" ở trên để tạo bài đầu tiên.</p>
                          </div>
                        ) : (
                          <p>Không có case study nào khớp với tìm kiếm hoặc bộ lọc.</p>
                        )}
                      </td>
                    </tr>
                  ) : (
                    filteredUseCases.map((uc) => (
                      <tr key={uc.id} className="hover:bg-muted/20">
                        <td className="px-6 py-4">
                          <div className="min-w-0 max-w-md">
                            <Link
                              to="/admin/use-cases/$id"
                              params={{ id: uc.id }}
                              className="font-medium text-foreground hover:text-signal-400"
                            >
                              {uc.title}
                            </Link>
                            <p className="truncate font-mono text-xs text-muted-foreground">/case-studies/{uc.slug}</p>
                            <p className="text-xs text-muted-foreground">Tạo bởi {personName(people, uc.createdBy)}</p>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <span className="rounded-full border border-border bg-background px-2.5 py-0.5 text-xs text-foreground">
                            {uc.industry}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold',
                              uc.status === 'published'
                                ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                                : 'border border-amber-500/30 bg-amber-500/10 text-amber-400',
                            )}
                          >
                            {uc.status === 'published' ? <Globe className="size-3" /> : <Lock className="size-3" />}
                            {STATUS_LABELS[uc.status]}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-xs text-muted-foreground">
                          {uc.publishedAt ? (
                            <span className="flex items-center gap-1 text-foreground">
                              <Calendar className="size-3 text-muted-foreground" />
                              {new Date(uc.publishedAt).toLocaleDateString('vi-VN')}
                            </span>
                          ) : (
                            <span>Tạo ngày {new Date(uc.createdAt).toLocaleDateString('vi-VN')}</span>
                          )}
                        </td>

                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {uc.status === 'published' && (
                              <a
                                href={`/case-studies/${uc.slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Xem trên website"
                                aria-label={`Xem ${uc.title} trên website`}
                                className="inline-flex size-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground"
                              >
                                <ExternalLink className="size-3.5" />
                              </a>
                            )}

                            {editable(uc) && (
                              <button
                                type="button"
                                onClick={() => handleToggleStatus(uc)}
                                disabled={togglingId === uc.id}
                                title={uc.status === 'published' ? 'Chuyển về bản nháp' : 'Đăng ngay'}
                                className="rounded-md border border-border px-2.5 py-1 text-xs font-medium hover:bg-muted"
                              >
                                {uc.status === 'published' ? 'Gỡ đăng' : 'Đăng'}
                              </button>
                            )}

                            <Link
                              to="/admin/use-cases/$id"
                              params={{ id: uc.id }}
                              title={editable(uc) ? 'Sửa' : 'Xem (chỉ đọc)'}
                              aria-label={`Sửa ${uc.title}`}
                              className="inline-flex size-8 items-center justify-center rounded-lg border border-border text-foreground hover:bg-muted"
                            >
                              <Edit className="size-3.5" />
                            </Link>

                            {editable(uc) && (
                              <button
                                type="button"
                                onClick={() => handleDelete(uc.id, uc.title)}
                                title="Xoá"
                                aria-label={`Xoá ${uc.title}`}
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
