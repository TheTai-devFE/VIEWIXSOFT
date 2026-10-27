import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { getAdminSession } from '~/server/auth'
import { LEAD_STATUSES } from '~/lib/enums'
import { deleteLeadsByEmail, listLeads, updateLead } from '~/server/leads/repository'
import { errorFields, logger } from '~/server/logger'
import { logActivity } from '~/server/activity/repository'
import { requirePermission } from '~/server/functions/admin-middleware'

/** Used by the /admin layout to redirect signed-out visitors. */
export const getAdminSessionFn = createServerFn({ method: 'GET' }).handler(() => getAdminSession())

export const getLeadsFn = createServerFn({ method: 'GET' })
  .middleware([requirePermission('leads')])
  .handler(async () => {
    try {
      return { ok: true as const, leads: await listLeads() }
    } catch (error) {
      logger.error('admin.leads_failed', errorFields(error))
      return { ok: false as const, leads: [] }
    }
  })

const UpdateStatusSchema = z.object({
  leadId: z.string().uuid(),
  status: z.enum(LEAD_STATUSES),
  notes: z.string().max(5000).optional(),
})

export const updateLeadStatusFn = createServerFn({ method: 'POST' })
  .middleware([requirePermission('leads')])
  .validator((data: unknown) => UpdateStatusSchema.parse(data))
  .handler(async ({ data, context }) => {
    const lead = await updateLead(data.leadId, { status: data.status, notes: data.notes })
    if (!lead) return { ok: false as const, error: 'not_found' as const }
    // The id and status only: a lead's contact details and notes stay out of the log.
    await logActivity(context.admin, 'lead.status', { type: 'lead', id: data.leadId, label: data.status })
    return { ok: true as const, lead }
  })

/** GDPR/CCPA erasure request: removes every lead and subscription for an email. */
export const deleteContactDataFn = createServerFn({ method: 'POST' })
  .middleware([requirePermission('leads')])
  .validator((data: unknown) => z.object({ email: z.string().trim().toLowerCase().email() }).parse(data))
  .handler(async ({ data, context }) => {
    const removed = await deleteLeadsByEmail(data.email)
    logger.info('admin.data_deleted', { leads: removed, by: context.admin.userId })
    await logActivity(context.admin, 'lead.delete', { type: 'lead', label: `Xoá dữ liệu theo yêu cầu (${removed} lead)` })
    return { ok: true as const, removed }
  })
