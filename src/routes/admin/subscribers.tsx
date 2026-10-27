import { createFileRoute, useRouter } from '@tanstack/react-router'
import { Download, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { AdminPageHeader, buttonSecondary, LoadError, selectClass } from '~/components/admin/admin-ui'
import { useConfirm, useToast } from '~/components/ui/feedback'
import { Input } from '~/components/ui/input'
import { PRODUCTS } from '~/content/products'
import { deleteSubscriberFn, listSubscribersFn, setSubscriberStatusFn } from '~/server/functions/subscribers-admin'

export const Route = createFileRoute('/admin/subscribers')({
  loader: {
    staleReloadMode: 'blocking',
    handler: () => listSubscribersFn(),
  },
  component: SubscribersModule,
})

const STATUS_LABEL = { pending: 'Pending', active: 'Confirmed', unsubscribed: 'Unsubscribed' } as const
const STATUS_FILTERS = ['all', 'pending', 'active', 'unsubscribed'] as const

function topicLabel(topic: string) {
  return PRODUCTS.find((p) => p.slug === topic)?.name ?? topic
}

/** Quotes a CSV cell and defuses spreadsheet formulas in visitor-supplied text. */
function csvCell(value: string) {
  const safe = /^[=+\-@]/.test(value) ? `'${value}` : value
  return `"${safe.replace(/"/g, '""')}"`
}

const dateOf = (d: Date | string | null) => (d ? new Date(d).toISOString().slice(0, 10) : '')

function SubscribersModule() {
  const res = Route.useLoaderData()
  const router = useRouter()
  const confirm = useConfirm()
  const toast = useToast()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<'all' | keyof typeof STATUS_LABEL>('all')
  const [topic, setTopic] = useState('all')
  const [error, setError] = useState('')

  const topics = useMemo(() => [...new Set(res.subscribers.flatMap((s) => s.topics))].sort(), [res.subscribers])
  const rows = useMemo(
    () =>
      res.subscribers.filter(
        (s) =>
          (status === 'all' || s.status === status) &&
          (topic === 'all' || (topic === 'newsletter' ? s.topics.length === 0 : s.topics.includes(topic))) &&
          s.email.includes(query.trim().toLowerCase()),
      ),
    [res.subscribers, status, topic, query],
  )

  const exportCsv = () => {
    const header = ['Email', 'Status', 'Topics', 'Signed up', 'Confirmed']
    const lines = rows.map((s) => [s.email, s.status, s.topics.map(topicLabel).join('; ') || 'Newsletter', dateOf(s.createdAt), dateOf(s.confirmedAt)])
    const csv = [header, ...lines].map((r) => r.map(csvCell).join(',')).join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `viewixsoft-subscribers-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const act = async (fn: () => Promise<{ ok: true } | { ok: false; error: string }>) => {
    setError('')
    try {
      const r = await fn()
      if (!r.ok) setError(r.error)
      await router.invalidate()
    } catch {
      setError('The change failed. Check your connection and try again.')
    }
  }

  return (
    <>
      <AdminPageHeader
        title="Subscribers"
        description="Newsletter and launch-notification sign-ups. Only confirmed addresses should receive emails."
        actions={
          <button type="button" onClick={exportCsv} disabled={rows.length === 0} className={buttonSecondary}>
            <Download aria-hidden="true" className="size-4" /> Export CSV
          </button>
        }
      />

      {!res.ok && <LoadError>Subscribers could not be loaded. Check DATABASE_URL and the server logs.</LoadError>}
      {error && <LoadError>{error}</LoadError>}

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="relative w-full sm:w-72">
          <label htmlFor="sub-search" className="sr-only">
            Search by email
          </label>
          <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="sub-search"
            type="search"
            placeholder="Search email"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-10 bg-card pl-9"
          />
        </div>
        <label className="sr-only" htmlFor="sub-status">
          Status
        </label>
        <select
          id="sub-status"
          value={status}
          onChange={(e) => setStatus(STATUS_FILTERS.find((v) => v === e.target.value) ?? 'all')}
          className={selectClass}
        >
          <option value="all">All statuses</option>
          {Object.entries(STATUS_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <label className="sr-only" htmlFor="sub-topic">
          Topic
        </label>
        <select id="sub-topic" value={topic} onChange={(e) => setTopic(e.target.value)} className={selectClass}>
          <option value="all">All topics</option>
          <option value="newsletter">Newsletter</option>
          {topics.map((t) => (
            <option key={t} value={t}>
              Launch: {topicLabel(t)}
            </option>
          ))}
        </select>
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {rows.length} of {res.subscribers.length}
        </p>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          {res.subscribers.length === 0 ? 'No sign-ups yet.' : 'No subscribers match these filters.'}
        </p>
      ) : (
      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs text-muted-foreground">
              <th scope="col" className="px-4 py-3 font-medium">Email</th>
              <th scope="col" className="px-4 py-3 font-medium">Status</th>
              <th scope="col" className="px-4 py-3 font-medium">Topics</th>
              <th scope="col" className="px-4 py-3 font-medium">Signed up</th>
              <th scope="col" className="px-4 py-3 font-medium"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => (
              <tr key={s.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-medium text-foreground">{s.email}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full border border-border px-2.5 py-0.5 font-mono text-[11px] text-muted-foreground">
                    {STATUS_LABEL[s.status]}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{s.topics.map(topicLabel).join(', ') || 'Newsletter'}</td>
                <td className="px-4 py-3 text-muted-foreground">{dateOf(s.createdAt)}</td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  {s.status !== 'unsubscribed' && (
                    <button
                      type="button"
                      className="text-xs font-medium text-muted-foreground underline hover:text-foreground"
                      onClick={() => act(() => setSubscriberStatusFn({ data: { id: s.id, status: 'unsubscribed' } }))}
                    >
                      Unsubscribe
                    </button>
                  )}
                  <button
                    type="button"
                    className="ml-4 text-xs font-medium text-destructive underline"
                    onClick={() =>
                      confirm({
                        title: 'Xoá vĩnh viễn người đăng ký này?',
                        description: `${s.email} bị xoá khỏi danh sách. Dùng khi có yêu cầu xoá dữ liệu.`,
                        confirmText: 'Xoá vĩnh viễn',
                        tone: 'danger',
                        onConfirm: async () => {
                          const res = await deleteSubscriberFn({ data: { id: s.id } })
                          if (!res.ok) return res.error
                          await router.invalidate()
                          toast({ title: 'Đã xoá người đăng ký', description: s.email, tone: 'success' })
                        },
                      })
                    }
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}
    </>
  )
}
