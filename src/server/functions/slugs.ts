import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'
import {
  CreateRedirectSchema,
  DeleteRedirectSchema,
  EDITABLE_SLUG_PAGES,
  ResetPageSlugSchema,
  SavePageSlugSchema,
  UpdateContentSlugSchema,
  toPublicPath,
} from '~/lib/slugs'
import type { SlugMap } from '~/lib/slugs'
import { requirePermission } from '~/server/functions/admin-middleware'
import { logActivity } from '~/server/activity/repository'
import { getBlogPostById, getBlogPostBySlug, listAllBlogPosts } from '~/server/blog/repository'
import { getUseCaseById, getUseCaseBySlug, listAllUseCases } from '~/server/use-cases/repository'
import { moveCustomSchemas } from '~/server/custom-schemas/repository'
import { invalidatePublishedSchemas } from '~/server/custom-schemas/published'
import { getDb } from '~/server/db/client'
import { blogPosts, useCases } from '~/server/db/schema'
import { errorFields, logger } from '~/server/logger'
import { invalidateSiteConfig } from '~/server/site/config'
import {
  deletePageSlug,
  deleteUrlRedirect,
  getPageSlugByKey,
  listPageSlugs,
  listUrlRedirects,
  recordUrlRedirect,
  removeRedirectFrom,
  upsertPageSlug,
} from '~/server/slugs/repository'

function slugMapFromRows(rows: { defaultPath: string; customPath: string }[]): SlugMap {
  return Object.fromEntries(rows.map((r) => [r.defaultPath, r.customPath]))
}

/** Checks whether `candidatePath` collides with any other page's effective public path. */
function findPathCollision(
  candidatePath: string,
  excludePageKey: string,
  rows: { pageKey: string; defaultPath: string; customPath: string }[],
): string | null {
  const map = slugMapFromRows(rows)
  for (const page of EDITABLE_SLUG_PAGES) {
    if (page.key === excludePageKey) continue
    const effective = toPublicPath(page.defaultPath, map)
    if (effective === candidatePath) return page.label
  }
  return null
}

export const getAdminSlugsDataFn = createServerFn({ method: 'GET' })
  .middleware([requirePermission('seo')])
  .handler(async () => {
    try {
      const [pageSlugs, redirects, posts, cases] = await Promise.all([
        listPageSlugs(),
        listUrlRedirects(),
        listAllBlogPosts(),
        listAllUseCases(),
      ])
      return {
        ok: true as const,
        pageSlugs,
        redirects,
        posts: posts.map((p) => ({
          id: p.id,
          title: p.title,
          slug: p.slug,
          status: p.status,
          updatedAt: p.updatedAt.toISOString(),
        })),
        useCases: cases.map((u) => ({
          id: u.id,
          title: u.title,
          slug: u.slug,
          status: u.status,
          updatedAt: u.updatedAt.toISOString(),
        })),
      }
    } catch (error) {
      logger.error('admin.slugs_load_failed', errorFields(error))
      return { ok: false as const, pageSlugs: [], redirects: [], posts: [], useCases: [] }
    }
  })

export const savePageSlugFn = createServerFn({ method: 'POST' })
  .middleware([requirePermission('seo')])
  .validator((data: unknown) => SavePageSlugSchema.parse(data))
  .handler(async ({ data, context }) => {
    const def = EDITABLE_SLUG_PAGES.find((p) => p.key === data.pageKey)
    if (!def) {
      return { ok: false as const, message: 'Không tìm thấy trang này trong danh sách cấu hình.' }
    }

    try {
      const allRows = await listPageSlugs()
      const existing = allRows.find((r) => r.pageKey === def.key)
      const currentMap = slugMapFromRows(allRows)
      const previousPublicPath = toPublicPath(def.defaultPath, currentMap)

      // Resetting back to default path removes the override row cleanly.
      if (data.customPath === def.defaultPath) {
        if (existing) {
          await deletePageSlug(def.key)
          if (existing.customPath !== def.defaultPath) {
            await recordUrlRedirect(existing.customPath, def.defaultPath, context.admin.email)
          }
          await removeRedirectFrom(def.defaultPath)
          invalidateSiteConfig()
          await logActivity(context.admin, 'slug.reset', {
            type: 'slug',
            id: def.key,
            label: `${def.label}: khôi phục ${def.defaultPath}`,
          })
        }
        return { ok: true as const, customPath: def.defaultPath }
      }

      const collision = findPathCollision(data.customPath, def.key, allRows)
      if (collision) {
        return {
          ok: false as const,
          message: `Đường dẫn "${data.customPath}" đang được dùng bởi trang "${collision}". Hãy chọn đường dẫn khác.`,
        }
      }

      await upsertPageSlug(def.key, def.defaultPath, data.customPath, context.admin.email)
      await removeRedirectFrom(data.customPath)
      if (
        previousPublicPath !== data.customPath &&
        previousPublicPath !== def.defaultPath &&
        !previousPublicPath.includes('?')
      ) {
        await recordUrlRedirect(previousPublicPath, def.defaultPath, context.admin.email)
      }
      invalidateSiteConfig()
      logger.info('admin.page_slug_saved', { pageKey: def.key, customPath: data.customPath })
      await logActivity(context.admin, 'slug.update', {
        type: 'slug',
        id: def.key,
        label: `${def.label}: ${previousPublicPath} → ${data.customPath}`,
      })
      return { ok: true as const, customPath: data.customPath }
    } catch (error) {
      logger.error('admin.page_slug_save_failed', errorFields(error))
      return {
        ok: false as const,
        message: 'Không lưu được đường dẫn. Có thể đường dẫn bị trùng hoặc database chưa chạy migration mới (pnpm db:migrate).',
      }
    }
  })

export const resetPageSlugFn = createServerFn({ method: 'POST' })
  .middleware([requirePermission('seo')])
  .validator((data: unknown) => ResetPageSlugSchema.parse(data))
  .handler(async ({ data, context }) => {
    const def = EDITABLE_SLUG_PAGES.find((p) => p.key === data.pageKey)
    if (!def) {
      return { ok: false as const, message: 'Không tìm thấy trang này.' }
    }

    try {
      const existing = await getPageSlugByKey(def.key)
      if (!existing) return { ok: true as const, defaultPath: def.defaultPath }

      await deletePageSlug(def.key)
      if (existing.customPath !== def.defaultPath) {
        await recordUrlRedirect(existing.customPath, def.defaultPath, context.admin.email)
      }
      await removeRedirectFrom(def.defaultPath)
      invalidateSiteConfig()
      logger.info('admin.page_slug_reset', { pageKey: def.key })
      await logActivity(context.admin, 'slug.reset', {
        type: 'slug',
        id: def.key,
        label: `${def.label}: ${existing.customPath} → ${def.defaultPath}`,
      })
      return { ok: true as const, defaultPath: def.defaultPath }
    } catch (error) {
      logger.error('admin.page_slug_reset_failed', errorFields(error))
      return { ok: false as const, message: 'Không khôi phục được đường dẫn mặc định.' }
    }
  })

export const updateContentSlugFn = createServerFn({ method: 'POST' })
  .middleware([requirePermission('seo')])
  .validator((data: unknown) => UpdateContentSlugSchema.parse(data))
  .handler(async ({ data, context }) => {
    try {
      if (data.kind === 'blog') {
        const current = await getBlogPostById(data.id)
        if (!current) return { ok: false as const, message: 'Không tìm thấy bài viết blog này.' }
        if (current.slug === data.slug) return { ok: true as const, slug: data.slug }

        const taken = await getBlogPostBySlug(data.slug)
        if (taken && taken.id !== current.id) {
          return { ok: false as const, message: `Slug "${data.slug}" đã được dùng cho một bài blog khác.` }
        }

        const oldPath = `/blog/${current.slug}`
        const newPath = `/blog/${data.slug}`
        await getDb()
          .update(blogPosts)
          .set({ slug: data.slug, updatedBy: context.admin.userId })
          .where(eq(blogPosts.id, current.id))
        await moveCustomSchemas(oldPath, newPath)
        invalidatePublishedSchemas()
        await recordUrlRedirect(oldPath, newPath, context.admin.email)
        invalidateSiteConfig()
        await logActivity(context.admin, 'slug.update', {
          type: 'slug',
          id: current.id,
          label: `Blog: ${oldPath} → ${newPath}`,
        })
        return { ok: true as const, slug: data.slug }
      }

      const current = await getUseCaseById(data.id)
      if (!current) return { ok: false as const, message: 'Không tìm thấy case study này.' }
      if (current.slug === data.slug) return { ok: true as const, slug: data.slug }

      const taken = await getUseCaseBySlug(data.slug)
      if (taken && taken.id !== current.id) {
        return { ok: false as const, message: `Slug "${data.slug}" đã được dùng cho một case study khác.` }
      }

      const oldPath = `/case-studies/${current.slug}`
      const newPath = `/case-studies/${data.slug}`
      await getDb()
        .update(useCases)
        .set({ slug: data.slug, updatedBy: context.admin.userId })
        .where(eq(useCases.id, current.id))
      await moveCustomSchemas(oldPath, newPath)
      invalidatePublishedSchemas()
      await recordUrlRedirect(oldPath, newPath, context.admin.email)
      invalidateSiteConfig()
      await logActivity(context.admin, 'slug.update', {
        type: 'slug',
        id: current.id,
        label: `Case study: ${oldPath} → ${newPath}`,
      })
      return { ok: true as const, slug: data.slug }
    } catch (error) {
      logger.error('admin.content_slug_update_failed', errorFields(error))
      return { ok: false as const, message: 'Không cập nhật được slug. Hãy thử lại.' }
    }
  })

export const createRedirectFn = createServerFn({ method: 'POST' })
  .middleware([requirePermission('seo')])
  .validator((data: unknown) => CreateRedirectSchema.parse(data))
  .handler(async ({ data, context }) => {
    if (data.fromPath === data.toPath) {
      return { ok: false as const, message: 'Đường dẫn nguồn và đích không được giống nhau.' }
    }
    try {
      await recordUrlRedirect(data.fromPath, data.toPath, context.admin.email)
      invalidateSiteConfig()
      await logActivity(context.admin, 'slug.create', {
        type: 'slug',
        label: `Redirect 301: ${data.fromPath} → ${data.toPath}`,
      })
      return { ok: true as const }
    } catch (error) {
      logger.error('admin.redirect_create_failed', errorFields(error))
      return { ok: false as const, message: 'Không tạo được chuyển hướng 301.' }
    }
  })

export const deleteRedirectFn = createServerFn({ method: 'POST' })
  .middleware([requirePermission('seo')])
  .validator((data: unknown) => DeleteRedirectSchema.parse(data))
  .handler(async ({ data, context }) => {
    try {
      const deleted = await deleteUrlRedirect(data.id)
      if (!deleted) return { ok: false as const, message: 'Không tìm thấy bản ghi chuyển hướng.' }
      invalidateSiteConfig()
      await logActivity(context.admin, 'slug.delete', {
        type: 'slug',
        id: deleted.id,
        label: `Xoá redirect 301: ${deleted.fromPath} → ${deleted.toPath}`,
      })
      return { ok: true as const }
    } catch (error) {
      logger.error('admin.redirect_delete_failed', errorFields(error))
      return { ok: false as const, message: 'Không xoá được chuyển hướng.' }
    }
  })
