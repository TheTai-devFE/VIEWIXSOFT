import { createFileRoute, Link } from '@tanstack/react-router'
import { AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react'
import { AdminPageHeader, LoadError, Panel } from '~/components/admin/admin-ui'
import { AnimatedList } from '~/components/ui/animated-list'
import { MagicCard } from '~/components/ui/magic-card'
import { NumberTicker } from '~/components/ui/number-ticker'
import { LEAD_STATUSES } from '~/lib/enums'
import { getDashboardFn } from '~/server/functions/dashboard'

export const Route = createFileRoute('/admin/')({
  loader: () => getDashboardFn(),
  component: DashboardPage,
})

const STATUS_LABELS: Record<(typeof LEAD_STATUSES)[number], string> = {
  new: 'New',
  contacted: 'Contacted',
  qualified: 'Qualified',
  won: 'Won',
  lost: 'Lost',
  spam: 'Spam',
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })

function StatCard({ label, value, hint, to }: { label: string; value: number; hint: string; to: '/admin/leads' | '/admin/subscribers' }) {
  return (
    <MagicCard>
      <Link to={to} className="block p-5 focus-visible:outline-none">
        <p className="text-sm text-muted-foreground">{label}</p>
        <NumberTicker value={value} className="mt-2 block font-display text-4xl font-semibold tracking-tight text-foreground" />
        <p className="mt-2 text-xs text-muted-foreground">{hint}</p>
      </Link>
    </MagicCard>
  )
}

function DashboardPage() {
  const res = Route.useLoaderData()

  return (
    <>
      <AdminPageHeader title="Dashboard" description="Leads, subscribers and whether each service is set up." />

      {!res.ok && <LoadError>Figures could not be loaded. Check DATABASE_URL and the server logs.</LoadError>}

      {res.ok && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="New leads" value={res.data.leads.newCount} hint="Waiting for a first reply" to="/admin/leads" />
            <StatCard label="Leads, last 30 days" value={res.data.leads.last30Days} hint={`${res.data.leads.total} in total`} to="/admin/leads" />
            <StatCard label="Subscribers" value={res.data.subscribers.active} hint="Confirmed email" to="/admin/subscribers" />
            <StatCard label="Pending confirmation" value={res.data.subscribers.pending} hint="Have not clicked the email link" to="/admin/subscribers" />
          </div>

          <div className="grid gap-6 xl:grid-cols-5">
            <div className="xl:col-span-3">
              <Panel title="Latest leads">
                {res.data.recent.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No leads yet. They appear here as soon as someone sends the contact or demo form.</p>
                ) : (
                  // Oldest first: the list reveals newest on top.
                  <AnimatedList>
                    {[...res.data.recent].reverse().map((lead) => (
                      <div key={lead.id} className="flex items-center justify-between gap-4 rounded-xl border border-border bg-background px-4 py-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">
                            {lead.name} <span className="text-muted-foreground">· {lead.company}</span>
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {lead.type === 'demo' ? 'Demo request' : 'Contact'} · {formatDate(lead.createdAt)}
                          </p>
                        </div>
                        <span className="shrink-0 rounded-full border border-border px-2.5 py-0.5 font-mono text-[11px] text-muted-foreground">
                          {STATUS_LABELS[lead.status]}
                        </span>
                      </div>
                    ))}
                  </AnimatedList>
                )}
                <Link to="/admin/leads" className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-signal-500 hover:text-signal-400">
                  All leads <ArrowRight aria-hidden="true" className="size-4" />
                </Link>
              </Panel>
            </div>

            <div className="xl:col-span-2">
              <Panel title="Leads by status">
                <ul className="space-y-3">
                  {LEAD_STATUSES.map((status) => {
                    const n = res.data.leads.byStatus[status]
                    const pct = res.data.leads.total ? Math.round((n / res.data.leads.total) * 100) : 0
                    return (
                      <li key={status}>
                        <div className="flex justify-between text-sm">
                          <span className="text-foreground">{STATUS_LABELS[status]}</span>
                          <span className="font-mono text-muted-foreground">
                            {n} <span className="sr-only">leads, </span>({pct}%)
                          </span>
                        </div>
                        <div aria-hidden="true" className="mt-1.5 h-2 overflow-hidden rounded-full bg-background">
                          <div className="h-full rounded-full bg-brand-gradient" style={{ width: `${pct}%` }} />
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </Panel>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6">
        <Panel title="System status" description="Shows whether each service is configured. Values are never displayed.">
          <ul className="divide-y divide-border">
            {res.system.map((s) => (
              <li key={s.key} className="flex items-start gap-3 py-3">
                {s.ok ? (
                  <CheckCircle2 aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-success" />
                ) : (
                  <AlertTriangle aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-warning" />
                )}
                <div className="min-w-0 text-sm">
                  <p className="font-medium text-foreground">
                    {s.label} <span className="sr-only">{s.ok ? 'configured' : 'not configured'}</span>
                  </p>
                  {!s.ok && <p className="text-muted-foreground">{s.hint}</p>}
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </>
  )
}
