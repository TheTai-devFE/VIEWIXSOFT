import { useState } from 'react'
import { Link, useRouter } from '@tanstack/react-router'
import { Check, ExternalLink, Pencil, Plus, PowerOff, Trash2 } from 'lucide-react'
import { buttonPrimary } from '~/components/admin/admin-ui'
import { AnimatedBadge } from '~/components/ui/animated-badge'
import type { AnimatedBadgeStatus } from '~/components/ui/animated-badge'
import { Card, CardAction, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { useConfirm, useToast } from '~/components/ui/feedback'
import { Tabs, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { CUSTOM_SCHEMA_LABELS, CUSTOM_SCHEMA_STATUS_LABELS } from '~/lib/seo/custom-schema'
import type { CustomSchemaStatus, CustomSchemaType } from '~/lib/seo/custom-schema'
import { SITE_URL } from '~/lib/seo/meta'
import { deleteCustomSchemaFn, setCustomSchemaStatusFn } from '~/server/functions/custom-schemas'
import type { CustomSchemaListRow } from '~/server/custom-schemas/repository'
import type { SchemaTarget } from '~/server/custom-schemas/targets'

const STATUS_BADGE: Record<CustomSchemaStatus, AnimatedBadgeStatus> = { pending: 'warning', published: 'success', disabled: 'neutral' }
const FILTERS = ['pending', 'published', 'disabled', 'all'] as const
type Filter = (typeof FILTERS)[number]

const typeLabel = (type: string) => CUSTOM_SCHEMA_LABELS[type as CustomSchemaType]?.label ?? type
const formatDate = (d: Date | string) => new Date(d).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })

/** Every custom schema, filtered by status, with approve, switch off, edit and delete. */
export function SchemaList({ schemas, targets }: { schemas: CustomSchemaListRow[]; targets: SchemaTarget[] }) {
  const router = useRouter()
  const confirm = useConfirm()
  const toast = useToast()
  const count = (f: Filter) => (f === 'all' ? schemas.length : schemas.filter((s) => s.status === f).length)
  const [filter, setFilter] = useState<Filter>(count('pending') ? 'pending' : 'all')
  const labelFor = (path: string) => targets.find((t) => t.path === path)?.label ?? path
  const shown = filter === 'all' ? schemas : schemas.filter((s) => s.status === filter)
  const title = (row: CustomSchemaListRow) => row.name || typeLabel(row.schemaType)

  const setStatus = async (row: CustomSchemaListRow, status: CustomSchemaStatus) => {
    const res = await setCustomSchemaStatusFn({ data: { id: row.id, status } })
    if (!res.ok) return toast({ title: 'Không đổi được trạng thái', description: res.message, tone: 'error' })
    await router.invalidate()
    toast({ title: status === 'published' ? 'Đã duyệt, schema đang chạy' : 'Đã tắt schema', description: 'Trang cập nhật trong khoảng một phút.', tone: 'success' })
  }

  const remove = (row: CustomSchemaListRow) =>
    confirm({
      title: 'Xoá schema này?',
      description: `${typeLabel(row.schemaType)} trên ${row.path}. Không khôi phục được.`,
      confirmText: 'Xoá schema',
      tone: 'danger',
      onConfirm: async () => {
        const res = await deleteCustomSchemaFn({ data: { id: row.id } })
        if (!res.ok) return 'Không xoá được schema. Hãy thử lại.'
        await router.invalidate()
        toast({ title: 'Đã xoá schema', tone: 'success' })
      },
    })

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs value={filter} onValueChange={(v) => setFilter(FILTERS.find((f) => f === v) ?? 'all')}>
          <TabsList aria-label="Lọc theo trạng thái">
            {FILTERS.map((f) => (
              <TabsTrigger key={f} value={f}>
                {f === 'all' ? 'Tất cả' : CUSTOM_SCHEMA_STATUS_LABELS[f]}
                <span className="tabular-nums opacity-70">{count(f)}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <Link to="/admin/schema/new" className={buttonPrimary}>
          <Plus aria-hidden="true" className="size-4" /> Thêm schema
        </Link>
      </div>

      {shown.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center">
          <p className="text-sm text-muted-foreground">{filter === 'pending' ? 'Không có schema nào chờ duyệt.' : 'Chưa có schema nào.'}</p>
          {filter !== 'pending' && (
            <Link to="/admin/schema/new" className="mt-3 inline-flex text-sm font-medium text-signal-400 hover:underline">
              Thêm schema đầu tiên
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {shown.map((row) => (
            <Card key={row.id}>
              <CardHeader>
                <div className="min-w-0">
                  <CardTitle>
                    <Link to="/admin/schema/$id" params={{ id: row.id }} className="hover:underline">
                      {title(row)}
                    </Link>
                  </CardTitle>
                  <CardDescription>
                    {typeLabel(row.schemaType)} · {labelFor(row.path)}{' '}
                    <a
                      href={`${SITE_URL}${row.path}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-0.5 font-mono text-signal-400 hover:underline"
                    >
                      {row.path}
                      <ExternalLink aria-hidden="true" className="size-3" />
                    </a>
                  </CardDescription>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <AnimatedBadge status={STATUS_BADGE[row.status]} size="sm">
                      {CUSTOM_SCHEMA_STATUS_LABELS[row.status]}
                    </AnimatedBadge>
                    <AnimatedBadge status={row.source === 'api' ? 'info' : 'neutral'} size="sm">
                      {row.source === 'api' ? `API · ${row.apiKeyName ?? 'khóa đã xoá'}` : 'Admin'}
                    </AnimatedBadge>
                    <span className="text-[11px] text-muted-foreground">Cập nhật {formatDate(row.updatedAt)}</span>
                  </div>
                </div>
                <CardAction className="flex flex-wrap items-center gap-1">
                  {row.status === 'published' ? (
                    <button
                      type="button"
                      onClick={() => setStatus(row, 'disabled')}
                      className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-accent"
                    >
                      <PowerOff aria-hidden="true" className="size-3.5" /> Tắt
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setStatus(row, 'published')}
                      className="inline-flex items-center gap-1 rounded-lg border border-success/40 px-3 py-1.5 text-xs font-semibold text-success hover:bg-success/10"
                    >
                      <Check aria-hidden="true" className="size-3.5" /> Duyệt
                    </button>
                  )}
                  <Link
                    to="/admin/schema/$id"
                    params={{ id: row.id }}
                    aria-label={`Sửa ${title(row)} trên ${row.path}`}
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                  >
                    <Pencil aria-hidden="true" className="size-4" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => remove(row)}
                    aria-label={`Xoá ${title(row)} trên ${row.path}`}
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 aria-hidden="true" className="size-4" />
                  </button>
                </CardAction>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
