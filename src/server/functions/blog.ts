import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { BlogPostFormSchema } from '~/lib/admin-schemas'
import { requirePermission } from '~/server/functions/admin-middleware'
import {
  createBlogPost,
  deleteBlogPost,
  getBlogPostById,
  getBlogPostBySlug,
  listAllBlogPosts,
  listPublishedBlogPosts,
  updateBlogPost,
} from '~/server/blog/repository'
import { getAuthorById } from '~/server/authors/repository'
import { errorFields, logger } from '~/server/logger'
import { can, canEditContent } from '~/lib/permissions'
import { logActivity } from '~/server/activity/repository'
import { statusAction } from '~/server/activity/status-action'
import { listAccountNames } from '~/server/users/repository'

// ─── Public Queries ─────────────────────────────────────────────────────────

export const getPublishedBlogPostsFn = createServerFn({ method: 'GET' }).handler(async () => {
  try {
    const posts = await listPublishedBlogPosts()
    return { ok: true as const, posts }
  } catch (error) {
    logger.error('blog.list_failed', errorFields(error))
    return { ok: false as const, posts: [] }
  }
})

export const getPublishedBlogPostBySlugFn = createServerFn({ method: 'GET' })
  .validator((data: unknown) => z.object({ slug: z.string().min(1) }).parse(data))
  .handler(async ({ data }) => {
    try {
      const post = await getBlogPostBySlug(data.slug)
      if (!post || post.status !== 'published') {
        return { ok: false as const, error: 'not_found' as const }
      }
      // A missing or failing author lookup falls back to the plain byline rather than hiding the post.
      const author = post.authorId ? await getAuthorById(post.authorId).catch(() => null) : null
      return { ok: true as const, post, author }
    } catch (error) {
      logger.error('blog.get_failed', errorFields(error))
      return { ok: false as const, error: 'server_error' as const }
    }
  })

// ─── Admin Operations ───────────────────────────────────────────────────────

// Messages are admin UI copy, so they are in Vietnamese (AGENTS.md §0.6).
const NOT_OWNER = 'Bài này do người khác tạo. Bạn cần quyền "Sửa bài của người khác" để thay đổi.'
const NOT_FOUND = 'Không tìm thấy bài viết này.'

export const getAdminBlogPostsFn = createServerFn({ method: 'GET' })
  .middleware([requirePermission('blog')])
  .handler(async ({ context }) => {
    const me = { userId: context.admin.userId, canEditOthers: can(context.admin, 'edit-others') }
    try {
      const [posts, people] = await Promise.all([listAllBlogPosts(), listAccountNames()])
      return { ok: true as const, posts, people, me }
    } catch (error) {
      logger.error('admin.blog_list_failed', errorFields(error))
      return { ok: false as const, posts: [], people: [], me }
    }
  })

export const getAdminBlogPostByIdFn = createServerFn({ method: 'GET' })
  .middleware([requirePermission('blog')])
  .validator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    try {
      const [post, people] = await Promise.all([getBlogPostById(data.id), listAccountNames()])
      if (!post) return { ok: false as const, error: 'not_found' as const }
      return { ok: true as const, post, people, canEdit: canEditContent(context.admin, post) }
    } catch (error) {
      logger.error('admin.blog_get_failed', errorFields(error))
      return { ok: false as const, error: 'server_error' as const }
    }
  })

export const createBlogPostFn = createServerFn({ method: 'POST' })
  .middleware([requirePermission('blog')])
  .validator((data: unknown) => BlogPostFormSchema.parse(data))
  .handler(async ({ data, context }) => {
    try {
      const existing = await getBlogPostBySlug(data.slug)
      if (existing) {
        return { ok: false as const, error: 'slug_exists' as const, message: 'Slug này đã được dùng cho một bài viết khác. Hãy đổi slug.' }
      }
      const post = await createBlogPost(data, context.admin.userId)
      await logActivity(context.admin, post.status === 'published' ? 'blog.publish' : 'blog.create', { type: 'blog', id: post.id, label: post.title })
      return { ok: true as const, post }
    } catch (error) {
      logger.error('admin.blog_create_failed', errorFields(error))
      return { ok: false as const, error: 'server_error' as const, message: 'Không tạo được bài viết. Nếu lỗi lặp lại, hãy kiểm tra log server.' }
    }
  })

export const updateBlogPostFn = createServerFn({ method: 'POST' })
  .middleware([requirePermission('blog')])
  .validator((data: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        data: BlogPostFormSchema,
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    try {
      const current = await getBlogPostById(data.id)
      if (!current) return { ok: false as const, error: 'not_found' as const, message: NOT_FOUND }
      if (!canEditContent(context.admin, current)) return { ok: false as const, error: 'forbidden' as const, message: NOT_OWNER }
      const existingSlug = await getBlogPostBySlug(data.data.slug)
      if (existingSlug && existingSlug.id !== data.id) {
        return { ok: false as const, error: 'slug_exists' as const, message: 'Slug này đã được dùng cho một bài viết khác. Hãy đổi slug.' }
      }
      const post = await updateBlogPost(data.id, data.data, context.admin.userId)
      if (!post) return { ok: false as const, error: 'not_found' as const, message: NOT_FOUND }
      await logActivity(context.admin, statusAction('blog', current.status, post.status), { type: 'blog', id: post.id, label: post.title })
      return { ok: true as const, post }
    } catch (error) {
      logger.error('admin.blog_update_failed', errorFields(error))
      return { ok: false as const, error: 'server_error' as const, message: 'Không cập nhật được bài viết. Nếu lỗi lặp lại, hãy kiểm tra log server.' }
    }
  })

export const toggleBlogPostStatusFn = createServerFn({ method: 'POST' })
  .middleware([requirePermission('blog')])
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
      const current = await getBlogPostById(data.id)
      if (!current) return { ok: false as const, error: 'not_found' as const, message: NOT_FOUND }
      if (!canEditContent(context.admin, current)) return { ok: false as const, error: 'forbidden' as const, message: NOT_OWNER }
      const post = await updateBlogPost(data.id, { status: data.status }, context.admin.userId)
      if (!post) return { ok: false as const, error: 'not_found' as const, message: NOT_FOUND }
      await logActivity(context.admin, statusAction('blog', current.status, post.status), { type: 'blog', id: post.id, label: post.title })
      return { ok: true as const, post }
    } catch (error) {
      logger.error('admin.blog_toggle_status_failed', errorFields(error))
      return { ok: false as const, error: 'server_error' as const, message: 'Không đổi được trạng thái. Hãy thử lại.' }
    }
  })

export const deleteBlogPostFn = createServerFn({ method: 'POST' })
  .middleware([requirePermission('blog')])
  .validator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    try {
      const current = await getBlogPostById(data.id)
      if (!current) return { ok: false as const, message: NOT_FOUND }
      if (!canEditContent(context.admin, current)) return { ok: false as const, message: NOT_OWNER }
      const success = await deleteBlogPost(data.id)
      if (success) await logActivity(context.admin, 'blog.delete', { type: 'blog', id: current.id, label: current.title })
      return success ? { ok: true as const } : { ok: false as const, message: NOT_FOUND }
    } catch (error) {
      logger.error('admin.blog_delete_failed', errorFields(error))
      return { ok: false as const, message: 'Không xoá được bài viết. Hãy thử lại.' }
    }
  })
