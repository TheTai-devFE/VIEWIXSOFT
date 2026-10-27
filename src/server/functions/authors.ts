import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { AuthorFormSchema } from '~/lib/admin-schemas'
import { requirePermission } from '~/server/functions/admin-middleware'
import {
  createAuthor,
  deleteAuthor,
  getAuthorById,
  getAuthorBySlug,
  getAuthorByUserId,
  listAuthors,
  updateAuthor,
} from '~/server/authors/repository'
import { errorFields, logger } from '~/server/logger'
import { logActivity } from '~/server/activity/repository'
import { listAccountNames } from '~/server/users/repository'

// Messages are admin UI copy, so they are in Vietnamese (AGENTS.md §0.6).
const SLUG_TAKEN = 'Slug này đã được dùng cho tác giả khác.'
const USER_TAKEN = 'Tài khoản này đã liên kết với một tác giả khác.'
const SAVE_FAILED = 'Không lưu được tác giả. Nếu lỗi lặp lại, kiểm tra log server (có thể database chưa chạy migration mới: pnpm db:migrate).'

export const getAdminAuthorsFn = createServerFn({ method: 'GET' })
  .middleware([requirePermission('authors', 'blog', 'use-cases')])
  .handler(async ({ context }) => {
    try {
      const [authors, accounts] = await Promise.all([listAuthors(), listAccountNames()])
      return { ok: true as const, authors, accounts, currentUserId: context.admin.userId }
    } catch (error) {
      logger.error('admin.authors_list_failed', errorFields(error))
      return { ok: false as const, authors: [], accounts: [], currentUserId: context.admin.userId }
    }
  })

/** Another author already linked to `userId`, other than `selfId`. */
async function linkTaken(userId: string | null, selfId?: string) {
  if (!userId) return false
  const linked = await getAuthorByUserId(userId)
  return Boolean(linked && linked.id !== selfId)
}

export const createAuthorFn = createServerFn({ method: 'POST' })
  .middleware([requirePermission('authors')])
  .validator((data: unknown) => AuthorFormSchema.parse(data))
  .handler(async ({ data, context }) => {
    try {
      if (await getAuthorBySlug(data.slug)) return { ok: false as const, message: SLUG_TAKEN }
      if (await linkTaken(data.userId)) return { ok: false as const, message: USER_TAKEN }
      const author = await createAuthor(data)
      logger.info('admin.author_created')
      await logActivity(context.admin, 'author.create', { type: 'author', id: author.id, label: author.name })
      return { ok: true as const, author }
    } catch (error) {
      logger.error('admin.author_create_failed', errorFields(error))
      return { ok: false as const, message: SAVE_FAILED }
    }
  })

export const updateAuthorFn = createServerFn({ method: 'POST' })
  .middleware([requirePermission('authors')])
  .validator((data: unknown) => z.object({ id: z.string().uuid(), data: AuthorFormSchema }).parse(data))
  .handler(async ({ data, context }) => {
    try {
      const sameSlug = await getAuthorBySlug(data.data.slug)
      if (sameSlug && sameSlug.id !== data.id) return { ok: false as const, message: SLUG_TAKEN }
      if (await linkTaken(data.data.userId, data.id)) return { ok: false as const, message: USER_TAKEN }
      const author = await updateAuthor(data.id, data.data)
      if (!author) return { ok: false as const, message: 'Không tìm thấy tác giả này.' }
      logger.info('admin.author_updated')
      await logActivity(context.admin, 'author.update', { type: 'author', id: author.id, label: author.name })
      return { ok: true as const, author }
    } catch (error) {
      logger.error('admin.author_update_failed', errorFields(error))
      return { ok: false as const, message: SAVE_FAILED }
    }
  })

export const deleteAuthorFn = createServerFn({ method: 'POST' })
  .middleware([requirePermission('authors')])
  .validator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    try {
      const author = await getAuthorById(data.id)
      const ok = await deleteAuthor(data.id)
      if (ok) await logActivity(context.admin, 'author.delete', { type: 'author', id: data.id, label: author?.name })
      return { ok }
    } catch (error) {
      logger.error('admin.author_delete_failed', errorFields(error))
      return { ok: false }
    }
  })
