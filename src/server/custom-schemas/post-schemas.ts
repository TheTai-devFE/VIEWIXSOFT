import '@tanstack/react-start/server-only'
import { canEditContent } from '~/lib/permissions'
import type { CustomSchemaInput, CustomSchemaStatus } from '~/lib/seo/custom-schema'
import { logActivity } from '~/server/activity/repository'
import type { AdminSession } from '~/server/auth'
import { getBlogPostById } from '~/server/blog/repository'
import { invalidatePublishedSchemas } from './published'
import {
  createCustomSchema,
  deleteCustomSchema,
  getCustomSchemaById,
  listCustomSchemas,
  setCustomSchemaStatus,
  updateCustomSchema,
} from './repository'

/*
 * Schema markup managed from inside the blog post editor. Whoever may edit the
 * post may manage its schemas (the same check as saving the post), without the
 * site-wide "Schema markup" permission. A schema is always attached to the
 * post's current path, /blog/<slug>.
 */

// Messages are admin UI copy, so they are in Vietnamese (AGENTS.md §0.6).
export const POST_SCHEMA_NOT_OWNER = 'Bài này do người khác tạo. Bạn cần quyền "Sửa bài của người khác" để thay đổi schema của bài.'
export const POST_SCHEMA_NOT_FOUND = 'Không tìm thấy bài viết hoặc schema này.'

type Result = { ok: true } | { ok: false; message: string }

/** The post and its path when the account may change it, or the message to show. */
async function editablePost(admin: AdminSession, postId: string) {
  const post = await getBlogPostById(postId)
  if (!post) return { ok: false as const, message: POST_SCHEMA_NOT_FOUND }
  if (!canEditContent(admin, post)) return { ok: false as const, message: POST_SCHEMA_NOT_OWNER }
  return { ok: true as const, post, path: `/blog/${post.slug}` }
}

/** A schema on this post, so an id from another page can't be changed through it. */
async function schemaOnPost(id: string, path: string) {
  const row = await getCustomSchemaById(id)
  return row && row.path === path ? row : null
}

const label = (type: string, title: string) => `${type} · ${title}`

/**
 * The post's own schemas, plus every other page's as a library to copy from.
 * Copying (not sharing) keeps an edit on one page from changing another.
 */
export async function listPostSchemas(postId: string) {
  const post = await getBlogPostById(postId)
  if (!post) return { schemas: [], library: [] }
  const path = `/blog/${post.slug}`
  const all = await listCustomSchemas()
  return {
    schemas: all.filter((s) => s.path === path),
    library: all
      .filter((s) => s.path !== path)
      .map((s) => ({ id: s.id, name: s.name, schemaType: s.schemaType, path: s.path, data: s.data, status: s.status })),
  }
}

export type SchemaLibraryItem = Awaited<ReturnType<typeof listPostSchemas>>['library'][number]

export async function savePostSchema(
  admin: AdminSession,
  input: { postId: string; id?: string; name: string; status: CustomSchemaStatus; schema: CustomSchemaInput },
): Promise<Result> {
  const access = await editablePost(admin, input.postId)
  if (!access.ok) return access
  if (input.id && !(await schemaOnPost(input.id, access.path))) return { ok: false, message: POST_SCHEMA_NOT_FOUND }
  const form = { path: access.path, name: input.name, schema: input.schema }
  const by = { kind: 'admin' as const, userId: admin.userId }
  const row = input.id ? await updateCustomSchema(input.id, form, input.status, by) : await createCustomSchema(form, input.status, by)
  if (!row) return { ok: false, message: POST_SCHEMA_NOT_FOUND }
  invalidatePublishedSchemas()
  await logActivity(admin, input.id ? 'schema.update' : 'schema.create', { type: 'schema', id: row.id, label: label(row.schemaType, access.post.title) })
  return { ok: true }
}

export async function setPostSchemaStatus(admin: AdminSession, input: { postId: string; id: string; status: CustomSchemaStatus }): Promise<Result> {
  const access = await editablePost(admin, input.postId)
  if (!access.ok) return access
  if (!(await schemaOnPost(input.id, access.path))) return { ok: false, message: POST_SCHEMA_NOT_FOUND }
  const row = await setCustomSchemaStatus(input.id, input.status, admin.userId)
  if (!row) return { ok: false, message: POST_SCHEMA_NOT_FOUND }
  invalidatePublishedSchemas()
  const action = input.status === 'published' ? 'schema.publish' : input.status === 'disabled' ? 'schema.unpublish' : 'schema.status'
  await logActivity(admin, action, { type: 'schema', id: row.id, label: label(row.schemaType, access.post.title) })
  return { ok: true }
}

export async function deletePostSchema(admin: AdminSession, input: { postId: string; id: string }): Promise<Result> {
  const access = await editablePost(admin, input.postId)
  if (!access.ok) return access
  const row = await schemaOnPost(input.id, access.path)
  if (!row) return { ok: false, message: POST_SCHEMA_NOT_FOUND }
  await deleteCustomSchema(input.id)
  invalidatePublishedSchemas()
  await logActivity(admin, 'schema.delete', { type: 'schema', id: row.id, label: label(row.schemaType, access.post.title) })
  return { ok: true }
}
