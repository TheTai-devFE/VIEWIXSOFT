import { LEAD_STATUSES } from '~/lib/enums'
import type { LeadStatus } from '~/lib/enums'

export interface DashboardData {
  leads: { total: number; newCount: number; last30Days: number; byStatus: Record<LeadStatus, number> }
  subscribers: { active: number; pending: number; unsubscribed: number }
  recent: { id: string; name: string; company: string; type: string; status: LeadStatus; createdAt: string }[]
}

/** Lead counts per status in the canonical order, with zero for statuses that have no rows. */
export function toStatusBreakdown(rows: { status: string; n: number }[]): Record<LeadStatus, number> {
  const out: Record<LeadStatus, number> = { new: 0, contacted: 0, qualified: 0, won: 0, lost: 0, spam: 0 }
  for (const r of rows) {
    const status = LEAD_STATUSES.find((s) => s === r.status)
    if (status) out[status] = r.n
  }
  return out
}
