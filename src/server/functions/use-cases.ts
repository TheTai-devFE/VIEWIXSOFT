import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { UseCaseFormSchema } from '~/lib/admin-schemas'
import { requirePermission } from '~/server/functions/admin-middleware'
import {
  createUseCase,
  deleteUseCase,
  getUseCaseById,
  getUseCaseBySlug,
  listAllUseCases,
  listPublishedUseCases,
  updateUseCase,
} from '~/server/use-cases/repository'
import { errorFields, logger } from '~/server/logger'
import { can, canEditContent } from '~/lib/permissions'
import { logActivity } from '~/server/activity/repository'
import { statusAction } from '~/server/activity/status-action'
import { listAccountNames } from '~/server/users/repository'

// ─── Public Queries ─────────────────────────────────────────────────────────

export const getPublishedUseCasesFn = createServerFn({ method: 'GET' }).handler(async () => {
  try {
    const cases = await listPublishedUseCases()
    return { ok: true as const, useCases: cases }
  } catch (error) {
    logger.error('use_cases.list_failed', errorFields(error))
    return { ok: false as const, useCases: [] }
  }
})

export const getPublishedUseCaseBySlugFn = createServerFn({ method: 'GET' })
  .validator((data: unknown) => z.object({ slug: z.string().min(1) }).parse(data))
  .handler(async ({ data }) => {
    try {
      const uc = await getUseCaseBySlug(data.slug)
      if (!uc || uc.status !== 'published') {
        return { ok: false as const, error: 'not_found' as const }
      }
      return { ok: true as const, useCase: uc }
    } catch (error) {
      logger.error('use_cases.get_failed', errorFields(error))
      return { ok: false as const, error: 'server_error' as const }
    }
  })

// ─── Admin Operations ───────────────────────────────────────────────────────
// Messages are admin UI copy, so they are in Vietnamese (AGENTS.md §0.6).
const NOT_OWNER = 'Case study này do người khác tạo. Bạn cần quyền "Sửa bài của người khác" để thay đổi.'
const NOT_FOUND = 'Không tìm thấy case study này.'

export const getAdminUseCasesFn = createServerFn({ method: 'GET' })
  .middleware([requirePermission('use-cases')])
  .handler(async ({ context }) => {
    const me = { userId: context.admin.userId, canEditOthers: can(context.admin, 'edit-others') }
    try {
      const [cases, people] = await Promise.all([listAllUseCases(), listAccountNames()])
      return { ok: true as const, useCases: cases, people, me }
    } catch (error) {
      logger.error('admin.use_cases_list_failed', errorFields(error))
      return { ok: false as const, useCases: [], people: [], me }
    }
  })

export const getAdminUseCaseByIdFn = createServerFn({ method: 'GET' })
  .middleware([requirePermission('use-cases')])
  .validator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    try {
      const [uc, people] = await Promise.all([getUseCaseById(data.id), listAccountNames()])
      if (!uc) return { ok: false as const, error: 'not_found' as const }
      return { ok: true as const, useCase: uc, people, canEdit: canEditContent(context.admin, uc) }
    } catch (error) {
      logger.error('admin.use_cases_get_failed', errorFields(error))
      return { ok: false as const, error: 'server_error' as const }
    }
  })

export const createUseCaseFn = createServerFn({ method: 'POST' })
  .middleware([requirePermission('use-cases')])
  .validator((data: unknown) => UseCaseFormSchema.parse(data))
  .handler(async ({ data, context }) => {
    try {
      const existing = await getUseCaseBySlug(data.slug)
      if (existing) {
        return { ok: false as const, error: 'slug_exists' as const, message: 'Slug này đã được dùng cho một case study khác. Hãy đổi slug.' }
      }
      const uc = await createUseCase(data, context.admin.userId)
      await logActivity(context.admin, uc.status === 'published' ? 'use-case.publish' : 'use-case.create', { type: 'use-case', id: uc.id, label: uc.title })
      return { ok: true as const, useCase: uc }
    } catch (error) {
      logger.error('admin.use_cases_create_failed', errorFields(error))
      return { ok: false as const, error: 'server_error' as const, message: 'Không tạo được case study. Nếu lỗi lặp lại, kiểm tra log server (có thể database chưa chạy migration mới: pnpm db:migrate).' }
    }
  })

export const updateUseCaseFn = createServerFn({ method: 'POST' })
  .middleware([requirePermission('use-cases')])
  .validator((data: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        data: UseCaseFormSchema,
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    try {
      const current = await getUseCaseById(data.id)
      if (!current) return { ok: false as const, error: 'not_found' as const, message: NOT_FOUND }
      if (!canEditContent(context.admin, current)) return { ok: false as const, error: 'forbidden' as const, message: NOT_OWNER }
      const existingSlug = await getUseCaseBySlug(data.data.slug)
      if (existingSlug && existingSlug.id !== data.id) {
        return { ok: false as const, error: 'slug_exists' as const, message: 'Slug này đã được dùng cho một case study khác. Hãy đổi slug.' }
      }
      const uc = await updateUseCase(data.id, data.data, context.admin.userId)
      if (!uc) return { ok: false as const, error: 'not_found' as const, message: NOT_FOUND }
      await logActivity(context.admin, statusAction('use-case', current.status, uc.status), { type: 'use-case', id: uc.id, label: uc.title })
      return { ok: true as const, useCase: uc }
    } catch (error) {
      logger.error('admin.use_cases_update_failed', errorFields(error))
      return { ok: false as const, error: 'server_error' as const, message: 'Không cập nhật được case study. Nếu lỗi lặp lại, kiểm tra log server (có thể database chưa chạy migration mới: pnpm db:migrate).' }
    }
  })

export const toggleUseCaseStatusFn = createServerFn({ method: 'POST' })
  .middleware([requirePermission('use-cases')])
  .validator((data: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(['draft', 'published']),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    try {
      const current = await getUseCaseById(data.id)
      if (!current) return { ok: false as const, error: 'not_found' as const, message: NOT_FOUND }
      if (!canEditContent(context.admin, current)) return { ok: false as const, error: 'forbidden' as const, message: NOT_OWNER }
      const uc = await updateUseCase(data.id, { status: data.status }, context.admin.userId)
      if (!uc) return { ok: false as const, error: 'not_found' as const, message: NOT_FOUND }
      await logActivity(context.admin, statusAction('use-case', current.status, uc.status), { type: 'use-case', id: uc.id, label: uc.title })
      return { ok: true as const, useCase: uc }
    } catch (error) {
      logger.error('admin.use_cases_toggle_status_failed', errorFields(error))
      return { ok: false as const, error: 'server_error' as const, message: 'Không đổi được trạng thái. Hãy thử lại.' }
    }
  })

export const deleteUseCaseFn = createServerFn({ method: 'POST' })
  .middleware([requirePermission('use-cases')])
  .validator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    try {
      const current = await getUseCaseById(data.id)
      if (!current) return { ok: false as const, message: NOT_FOUND }
      if (!canEditContent(context.admin, current)) return { ok: false as const, message: NOT_OWNER }
      const success = await deleteUseCase(data.id)
      if (success) await logActivity(context.admin, 'use-case.delete', { type: 'use-case', id: current.id, label: current.title })
      return success ? { ok: true as const } : { ok: false as const, message: NOT_FOUND }
    } catch (error) {
      logger.error('admin.use_cases_delete_failed', errorFields(error))
      return { ok: false as const, message: 'Không xoá được case study. Hãy thử lại.' }
    }
  })
