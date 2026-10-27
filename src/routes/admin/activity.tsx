import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { ChevronLeft, ChevronRight, Search, X } from 'lucide-react'
import { AdminPageHeader, LoadError, selectClass } from '~/components/admin/admin-ui'
import { personName } from '~/components/admin/OwnershipNotice'
import { ACTIVITY_ENTITIES, ACTIVITY_ENTITY_KEYS, ACTIVITY_RETENTION_DAYS, ActivitySearchSchema, describeAction } from '~/lib/activity'
import type { ActivitySearch } from '~/lib/activity'
import type { ActivityRow } from '~/server/db/schema'
import { listActivityFn } from '~/server/functions/activity'

export const Route = createFileRoute('/admin/activity')({
  validateSearch: ActivitySearchSchema,
  loaderDeps: ({ search }) => search,
  loader: {
    staleReloadMode: 'blocking',
    handler: ({ deps }) => listActivityFn({ data: deps }),
  },
  component: ActivityPage,
})

const TIME = new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' })

/** The admin page an entry points to, while the thing still exists. */
function Target({ row }: { row: ActivityRow }) {
  const label = row.entityLabel ?? ACTIVITY_ENTITIES[row.entityType as keyof typeof ACTIVITY_ENTITIES] ?? row.entityType
  const gone = row.action.endsWith('.delete')
  const linkClass = 'font-medium text-foreground hover:text-signal-400'
  if (!gone && row.entityId && row.entityType === 'blog') {
    return (
      <Link to="/admin/blog/$id" params={{ id: row.entityId }} className={linkClass}>
        {label}
      </Link>
    )
  }
  if (!gone && row.entityId && row.entityType === 'use-case') {
    return (
      <Link to="/admin/use-cases/$id" params={{ id: row.entityId }} className={linkClass}>
        {label}
      </Link>
    )
  }
  return <span className={gone ? 'text-muted-foreground line-through decoration-1' : 'text-foreground'}>{label}</span>
}

function ActivityPage() {
  const data = Route.useLoaderData()
  const search = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })
  const [q, setQ] = useState(search.q ?? '')

  // Any filter change goes back to page 1.
  const setFilter = (patch: Partial<ActivitySearch>) =>
    void navigate({ search: (prev) => ({ ...prev, ...patch, page: undefined }) })
  const hasFilters = Boolean(search.actor || search.entity || search.from || search.to || search.q)
  const pages = Math.max(1, Math.ceil(data.total / data.pageSize))

  return (
    <>
      <AdminPageHeader
        title="Nhật ký hoạt động"
        description={`Ai đã làm gì trong admin: tạo, sửa, đăng, xoá, đổi quyền, đăng nhập. Giữ ${ACTIVITY_RETENTION_DAYS} ngày gần nhất. Không lưu mật khẩu hay thông tin liên hệ của lead và subscriber.`}
      />

      {!data.ok && <LoadError>Không tải được nhật ký. Hãy kiểm tra database và chạy pnpm db:migrate.</LoadError>}

      <div className="space-y-6">
        <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-border bg-card p-4">
          <form
            role="search"
            onSubmit={(e) => {
              e.preventDefault()
              setFilter({ q: q.trim() || undefined })
            }}
            className="relative min-w-[220px] flex-1"
          >
            <label htmlFor="activity-q" className="text-xs text-muted-foreground">
              Tìm theo tên bài, tài khoản…
            </label>
            <Search aria-hidden="true" className="absolute bottom-3 left-3 size-4 text-muted-foreground" />
            <input
              id="activity-q"
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="mt-1 h-10 w-full rounded-md border border-input bg-background pr-3 pl-9 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
            />
          </form>
          <div>
            <label htmlFor="activity-actor" className="text-xs text-muted-foreground">
              Người làm
            </label>
            <select
              id="activity-actor"
              value={search.actor ?? ''}
              onChange={(e) => setFilter({ actor: e.target.value || undefined })}
              className={`${selectClass} mt-1 block`}
            >
              <option value="">Tất cả</option>
              {data.people.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="activity-entity" className="text-xs text-muted-foreground">
              Mục
            </label>
            <select
              id="activity-entity"
              value={search.entity ?? ''}
              onChange={(e) => {
                const value = ACTIVITY_ENTITY_KEYS.find((k) => k === e.target.value)
                setFilter({ entity: value })
              }}
              className={`${selectClass} mt-1 block`}
            >
              <option value="">Tất cả</option>
              {ACTIVITY_ENTITY_KEYS.map((k) => (
                <option key={k} value={k}>
                  {ACTIVITY_ENTITIES[k]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="activity-from" className="text-xs text-muted-foreground">
              Từ ngày
            </label>
            <input
              id="activity-from"
              type="date"
              value={search.from ?? ''}
              onChange={(e) => setFilter({ from: e.target.value || undefined })}
              className={`${selectClass} mt-1 block`}
            />
          </div>
          <div>
            <label htmlFor="activity-to" className="text-xs text-muted-foreground">
              Đến ngày
            </label>
            <input
              id="activity-to"
              type="date"
              value={search.to ?? ''}
              onChange={(e) => setFilter({ to: e.target.value || undefined })}
              className={`${selectClass} mt-1 block`}
            />
          </div>
          {hasFilters && (
            <button
              type="button"
              onClick={() => {
                setQ('')
                void navigate({ search: {} })
              }}
              className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-border px-3 text-sm font-medium hover:bg-accent"
            >
              <X aria-hidden="true" className="size-4" /> Bỏ lọc
            </button>
          )}
        </div>

        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <caption className="sr-only">Nhật ký hoạt động, mới nhất trước</caption>
              <thead>
                <tr className="border-b border-border bg-muted/40 font-mono text-xs tracking-wider text-muted-foreground uppercase">
                  <th scope="col" className="px-6 py-3.5 font-medium">Thời gian</th>
                  <th scope="col" className="px-6 py-3.5 font-medium">Người làm</th>
                  <th scope="col" className="px-6 py-3.5 font-medium">Hành động</th>
                  <th scope="col" className="px-6 py-3.5 font-medium">Đối tượng</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.rows.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-sm text-muted-foreground">
                      {hasFilters ? 'Không có hoạt động nào khớp với bộ lọc.' : 'Chưa có hoạt động nào được ghi lại.'}
                    </td>
                  </tr>
                ) : (
                  data.rows.map((row) => (
                    <tr key={row.id} className="hover:bg-muted/20">
                      <td className="px-6 py-3 whitespace-nowrap text-xs text-muted-foreground">
                        <time dateTime={new Date(row.createdAt).toISOString()}>{TIME.format(new Date(row.createdAt))}</time>
                      </td>
                      <td className="px-6 py-3">
                        {row.actorId ? personName(data.people, row.actorId) : row.actorName}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap">{describeAction(row.action)}</td>
                      <td className="px-6 py-3">
                        <Target row={row} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <nav aria-label="Phân trang nhật ký" className="flex items-center justify-between gap-3 text-sm">
          <p className="text-muted-foreground">
            {data.total} hoạt động · Trang {data.page}/{pages}
          </p>
          <div className="flex gap-2">
            <Link
              to="/admin/activity"
              search={(prev) => ({ ...prev, page: data.page > 2 ? data.page - 1 : undefined })}
              disabled={data.page <= 1}
              aria-label="Trang trước"
              className="inline-flex size-9 items-center justify-center rounded-lg border border-border hover:bg-accent aria-disabled:pointer-events-none aria-disabled:opacity-40"
            >
              <ChevronLeft aria-hidden="true" className="size-4" />
            </Link>
            <Link
              to="/admin/activity"
              search={(prev) => ({ ...prev, page: data.page + 1 })}
              disabled={data.page >= pages}
              aria-label="Trang sau"
              className="inline-flex size-9 items-center justify-center rounded-lg border border-border hover:bg-accent aria-disabled:pointer-events-none aria-disabled:opacity-40"
            >
              <ChevronRight aria-hidden="true" className="size-4" />
            </Link>
          </div>
        </nav>
      </div>
    </>
  )
}
