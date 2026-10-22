import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { leadRepo } from '~/server/db/client'

export const getLeadsFn = createServerFn({ method: 'GET' })
  .handler(async () => {
    const leads = await leadRepo.getAllLeads()
    return { leads }
  })

const UpdateStatusSchema = z.object({
  leadId: z.string().uuid(),
  status: z.enum(['new', 'contacted', 'qualified', 'won', 'lost', 'spam']),
  notes: z.string().optional(),
})

export const updateLeadStatusFn = createServerFn({ method: 'POST' })
  .validator((data: unknown) => UpdateStatusSchema.parse(data))
  .handler(async ({ data }) => {
    const updated = await leadRepo.updateLeadStatus(data.leadId, data.status, data.notes)
    if (!updated) {
      throw new Error('Lead not found')
    }
    return { success: true, lead: updated }
  })
