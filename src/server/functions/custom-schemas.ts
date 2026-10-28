import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { CUSTOM_SCHEMA_STATUSES, CUSTOM_SCHEMA_LABELS, CustomSchemaFormSchema, SchemaPathSchema } from '~/lib/seo/custom-schema'
import { requirePermission } from '~/server/functions/admin-middleware'
import {
  createCustomSchema,
  deleteCustomSchema,
  getCustomSchemaById,
  listCustomSchemas,
  setCustomSchemaStatus,
  updateCustomSchema,
} from '~/server/custom-schemas/repository'
import { invalidatePublishedSchemas, publishedSchemasFor } from '~/server/custom-schemas/published'
import { isSchemaTarget, listSchemaTargets } from '~/server/custom-schemas/targets'
import { logActivity } from '~/server/activity/repository'
import { errorFields, logger } from '~/server/logger'

// ─── Public ─────────────────────────────────────────────────────────────────

/** Published custom JSON-LD for one page; route loaders pass it to `head()`. */
export const getPageSchemasFn = createServerFn({ method: 'GET' })
  .validator((data: unknown) => z.object({ path: SchemaPathSchema }).parse(data))
  .handler(({ data }) => publishedSchemasFor(data.path))

// ─── Admin ──────────────────────────────────────────────────────────────────

// Messages are admin UI copy, so they are in Vietnamese (AGENTS.md §0.6).
const SAVE_FAILED = 'Không lưu được schema. Nếu lỗi lặp lại, kiểm tra log server (có thể database chưa chạy migration mới: pnpm db:migrate).'
const UNKNOWN_PAGE = 'Trang này không tồn tại trên site.'
const NOT_FOUND = 'Không tìm thấy schema này.'

const label = (row: { name: string; schemaType: string; path: string }) =>
  `${row.name || CUSTOM_SCHEMA_LABELS[row.schemaType as keyof typeof CUSTOM_SCHEMA_LABELS]?.label || row.schemaType} · ${row.path}`

export const getAdminCustomSchemasFn = createServerFn({ method: 'GET' })
  .middleware([requirePermission('schema')])
  .handler(async () => {
    try {
      const [schemas, targets] = await Promise.all([listCustomSchemas(), listSchemaTargets()])
      return { ok: true as const, schemas, targets }
    } catch (error) {
      logger.error('admin.custom_schemas_list_failed', errorFields(error))
      return { ok: false as const, schemas: [], targets: [] }
    }
  })

/** The pages a schema can go on, for the create page. */
export const getSchemaTargetsFn = createServerFn({ method: 'GET' })
  .middleware([requirePermission('schema')])
  .handler(async () => {
    try {
      return { ok: true as const, targets: await listSchemaTargets() }
    } catch (error) {
      logger.error('admin.schema_targets_failed', errorFields(error))
      return { ok: false as const, targets: [] }
    }
  })

/** One schema and the page list, for the edit page. */
export const getAdminCustomSchemaFn = createServerFn({ method: 'GET' })
  .middleware([requirePermission('schema')])
  .validator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    try {
      const [schema, targets] = await Promise.all([getCustomSchemaById(data.id), listSchemaTargets()])
      if (!schema) return { ok: false as const, error: 'not_found' as const }
      return { ok: true as const, schema, targets }
    } catch (error) {
      logger.error('admin.custom_schema_get_failed', errorFields(error))
      return { ok: false as const, error: 'server_error' as const }
    }
  })

const SaveSchema = z.object({
  id: z.string().uuid().optional(),
  status: z.enum(CUSTOM_SCHEMA_STATUSES),
  form: CustomSchemaFormSchema,
})

export const saveCustomSchemaFn = createServerFn({ method: 'POST' })
  .middleware([requirePermission('schema')])
  .validator((data: unknown) => SaveSchema.parse(data))
  .handler(async ({ data, context }) => {
    try {
      if (!(await isSchemaTarget(data.form.path))) return { ok: false as const, message: UNKNOWN_PAGE }
      const by = { kind: 'admin' as const, userId: context.admin.userId }
      const row = data.id
        ? await updateCustomSchema(data.id, data.form, data.status, by)
        : await createCustomSchema(data.form, data.status, by)
      if (!row) return { ok: false as const, message: NOT_FOUND }
      invalidatePublishedSchemas()
      await logActivity(context.admin, data.id ? 'schema.update' : 'schema.create', { type: 'schema', id: row.id, label: label(row) })
      return { ok: true as const, schema: row }
    } catch (error) {
      logger.error('admin.custom_schema_save_failed', errorFields(error))
      return { ok: false as const, message: SAVE_FAILED }
    }
  })

/** Approve (publish), switch off, or send back to pending. */
export const setCustomSchemaStatusFn = createServerFn({ method: 'POST' })
  .middleware([requirePermission('schema')])
  .validator((data: unknown) => z.object({ id: z.string().uuid(), status: z.enum(CUSTOM_SCHEMA_STATUSES) }).parse(data))
  .handler(async ({ data, context }) => {
    try {
      const row = await setCustomSchemaStatus(data.id, data.status, context.admin.userId)
      if (!row) return { ok: false as const, message: NOT_FOUND }
      invalidatePublishedSchemas()
      const action = data.status === 'published' ? 'schema.publish' : data.status === 'disabled' ? 'schema.unpublish' : 'schema.status'
      await logActivity(context.admin, action, { type: 'schema', id: row.id, label: label(row) })
      return { ok: true as const }
    } catch (error) {
      logger.error('admin.custom_schema_status_failed', errorFields(error))
      return { ok: false as const, message: SAVE_FAILED }
    }
  })

export const deleteCustomSchemaFn = createServerFn({ method: 'POST' })
  .middleware([requirePermission('schema')])
  .validator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    try {
      const row = await getCustomSchemaById(data.id)
      const ok = await deleteCustomSchema(data.id)
      if (ok) {
        invalidatePublishedSchemas()
        await logActivity(context.admin, 'schema.delete', { type: 'schema', id: data.id, label: row ? label(row) : null })
      }
      return { ok }
    } catch (error) {
      logger.error('admin.custom_schema_delete_failed', errorFields(error))
      return { ok: false }
    }
  })
