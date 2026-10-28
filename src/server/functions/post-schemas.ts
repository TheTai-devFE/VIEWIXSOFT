import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { CUSTOM_SCHEMA_STATUSES, CustomSchemaInputSchema } from '~/lib/seo/custom-schema'
import { deletePostSchema, listPostSchemas, savePostSchema, setPostSchemaStatus } from '~/server/custom-schemas/post-schemas'
import { requirePermission } from '~/server/functions/admin-middleware'
import { errorFields, logger } from '~/server/logger'

// Schema markup from the blog post editor; access rules in src/server/custom-schemas/post-schemas.ts.
const FAILED = 'Không lưu được schema. Nếu lỗi lặp lại, kiểm tra log server.'

export const getPostSchemasFn = createServerFn({ method: 'GET' })
  .middleware([requirePermission('blog')])
  .validator((data: unknown) => z.object({ postId: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    try {
      return { ok: true as const, ...(await listPostSchemas(data.postId)) }
    } catch (error) {
      logger.error('admin.post_schemas_list_failed', errorFields(error))
      return { ok: false as const, schemas: [], library: [] }
    }
  })

export const savePostSchemaFn = createServerFn({ method: 'POST' })
  .middleware([requirePermission('blog')])
  .validator((data: unknown) =>
    z
      .object({
        postId: z.string().uuid(),
        id: z.string().uuid().optional(),
        name: z.string().trim().max(120).optional().default(''),
        status: z.enum(CUSTOM_SCHEMA_STATUSES),
        schema: CustomSchemaInputSchema,
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    try {
      return await savePostSchema(context.admin, data)
    } catch (error) {
      logger.error('admin.post_schema_save_failed', errorFields(error))
      return { ok: false as const, message: FAILED }
    }
  })

export const setPostSchemaStatusFn = createServerFn({ method: 'POST' })
  .middleware([requirePermission('blog')])
  .validator((data: unknown) =>
    z.object({ postId: z.string().uuid(), id: z.string().uuid(), status: z.enum(CUSTOM_SCHEMA_STATUSES) }).parse(data),
  )
  .handler(async ({ data, context }) => {
    try {
      return await setPostSchemaStatus(context.admin, data)
    } catch (error) {
      logger.error('admin.post_schema_status_failed', errorFields(error))
      return { ok: false as const, message: FAILED }
    }
  })

export const deletePostSchemaFn = createServerFn({ method: 'POST' })
  .middleware([requirePermission('blog')])
  .validator((data: unknown) => z.object({ postId: z.string().uuid(), id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    try {
      return await deletePostSchema(context.admin, data)
    } catch (error) {
      logger.error('admin.post_schema_delete_failed', errorFields(error))
      return { ok: false as const, message: FAILED }
    }
  })
