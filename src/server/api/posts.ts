import '@tanstack/react-start/server-only'
import { z } from 'zod'
import { BlogPostFormSchema } from '~/lib/admin-schemas'
import type { BlogPostFormInput } from '~/lib/admin-schemas'
import { htmlToMarkdown } from '~/lib/markdown-html'
import { CustomSchemaFormSchema } from '~/lib/seo/custom-schema'
import type { CustomSchemaForm } from '~/lib/seo/custom-schema'
import { importJsonLd } from '~/lib/seo/custom-schema-import'
import { SITE_URL } from '~/lib/seo/meta'
import { logActivity } from '~/server/activity/repository'
import { isApiPost, linkApiPost, listApiPosts } from '~/server/api-keys/posts-repository'
import { getAuthorByUserId } from '~/server/authors/repository'
import { createBlogPost, getBlogPostById, getBlogPostBySlug, updateBlogPost } from '~/server/blog/repository'
import { invalidatePublishedSchemas } from '~/server/custom-schemas/published'
import { createCustomSchema, moveCustomSchemas } from '~/server/custom-schemas/repository'
import type { BlogPostRow } from '~/server/db/schema'
import { parseHtmlOnServer } from '~/server/html-parse'
import { apiActor, apiError, apiOk, authorize, guarded, readJson, validationError } from './v1'

/*
 * /api/v1/posts: blog posts sent by an outside tool (an AI writer, an SEO
 * tool) with a `blog:write` key. Every post is saved as a draft owned by the
 * admin who made the key, with that account's author byline; someone in
 * /admin/blog reviews it and presses Publish. A tool can only read and change
 * posts that came through the API, and only while they are drafts.
 */

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const MAX_SCHEMAS = 5

/** The request body: the post's fields, the body as Markdown or HTML, and optional JSON-LD. */
export const ApiPostSchema = BlogPostFormSchema.pick({
  title: true,
  seoTitle: true,
  description: true,
  coverAlt: true,
  category: true,
  product: true,
  tags: true,
  keyTakeaways: true,
  seoDescription: true,
  faq: true,
}).extend({
  slug: z.string().trim().regex(SLUG, 'Lowercase letters, digits and hyphens, e.g. my-post-title.').min(3).max(100).optional(),
  content: z.string().min(10).max(200_000),
  format: z.enum(['markdown', 'html']).default('markdown'),
  coverUrl: z
    .string()
    .trim()
    .refine((v) => v === '' || /^https:\/\//.test(v) || /^\/(?!\/)/.test(v), 'An https:// link or a path on this site.')
    .optional(),
  /** schema.org JSON-LD for the post, saved as pending schemas (needs `schema:write`). */
  schemas: z.array(z.unknown()).max(MAX_SCHEMAS).optional(),
})
type ApiPost = z.output<typeof ApiPostSchema>

const slugify = (text: string) =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90)
    .replace(/-+$/, '')

/** The title's slug, numbered (-2, -3…) until no other post uses it. */
async function freeSlug(title: string) {
  const base = slugify(title) || 'post'
  for (let n = 1; n < 50; n++) {
    const candidate = n === 1 ? base : `${base}-${n}`
    if (!(await getBlogPostBySlug(candidate))) return candidate
  }
  return `${base}-${Date.now()}`
}

/** The body as Markdown, with the HTML tags that were dropped on the way. */
function bodyMarkdown(post: ApiPost) {
  if (post.format === 'markdown') return { markdown: post.content.trim(), dropped: [] as string[] }
  return htmlToMarkdown(post.content, parseHtmlOnServer)
}

/** Reads each JSON-LD into a schema for the post's path, or the 422 naming the first that fails. */
function readSchemas(list: unknown[], path: string) {
  const forms: CustomSchemaForm[] = []
  const ignored: { index: number; properties: string[] }[] = []
  for (const [index, jsonLd] of list.entries()) {
    const imported = importJsonLd(typeof jsonLd === 'string' ? jsonLd : JSON.stringify(jsonLd ?? null))
    if (!imported.ok) return { ok: false as const, response: apiError(422, 'validation_failed', 'A schema could not be read.', [{ path: `schemas.${index}`, message: imported.error }]) }
    const form = CustomSchemaFormSchema.safeParse({ path, schema: imported.draft })
    if (!form.success) {
      const details = form.error.issues.map((i) => ({ path: `schemas.${index}.${i.path.join('.')}`, message: i.message }))
      return { ok: false as const, response: apiError(422, 'validation_failed', 'A schema is missing fields.', details) }
    }
    forms.push(form.data)
    if (imported.ignored.length) ignored.push({ index, properties: imported.ignored })
  }
  return { ok: true as const, forms, ignored }
}

function present(post: BlogPostRow) {
  return {
    id: post.id,
    slug: post.slug,
    title: post.title,
    status: post.status,
    /** Where an admin reviews and publishes it. */
    adminUrl: `${SITE_URL}/admin/blog/${post.id}`,
    /** Where it will be once published. */
    url: `${SITE_URL}/blog/${post.slug}`,
    updatedAt: post.updatedAt,
  }
}

const withWarnings = (data: object, warnings: Record<string, unknown>) => {
  const kept = Object.fromEntries(Object.entries(warnings).filter(([, v]) => Array.isArray(v) && v.length))
  return Object.keys(kept).length ? { ...data, warnings: kept } : data
}

const OWNER_GONE = 'The admin account that created this API key no longer exists. Ask an admin for a new key.'
const NOT_API_POST = 'No post created through the API has this id.'

/** POST /api/v1/posts */
export function handleCreatePost(request: Request) {
  return guarded('api.post_create_failed', async () => {
    const key = await authorize(request, 'blog:write')
    if (key instanceof Response) return key
    if (!key.createdBy) return apiError(403, 'forbidden', OWNER_GONE)
    const body = await readJson(request)
    if (!body.ok) return body.response
    const parsed = ApiPostSchema.safeParse(body.body)
    if (!parsed.success) return validationError(parsed.error)
    const post = parsed.data
    if (post.schemas?.length && !key.scopes.includes('schema:write')) {
      return apiError(403, 'forbidden', 'Sending "schemas" needs the "schema:write" permission on this key.')
    }

    if (post.slug && (await getBlogPostBySlug(post.slug))) return apiError(422, 'slug_taken', 'Another post already uses this slug.')
    const slug = post.slug ?? (await freeSlug(post.title))
    const body_ = bodyMarkdown(post)
    const schemas = readSchemas(post.schemas ?? [], `/blog/${slug}`)
    if (!schemas.ok) return schemas.response

    // The byline of the author profile linked to the key's owner, as for a post started in the admin.
    const author = await getAuthorByUserId(key.createdBy)
    const form = BlogPostFormSchema.safeParse({
      ...post,
      slug,
      content: body_.markdown,
      coverUrl: post.coverUrl || undefined,
      authorId: author?.id ?? null,
      ...(author ? { authorName: author.name, authorRole: author.role || undefined } : {}),
      status: 'draft',
    } satisfies Partial<BlogPostFormInput> & Record<string, unknown>)
    if (!form.success) return validationError(form.error)

    const created = await createBlogPost(form.data, key.createdBy)
    await linkApiPost(created.id, key.id)
    for (const schema of schemas.forms) await createCustomSchema(schema, 'pending', { kind: 'api', apiKeyId: key.id })
    await logActivity(apiActor(key), 'blog.create', { type: 'blog', id: created.id, label: created.title })
    return apiOk(withWarnings(present(created), { droppedHtml: body_.dropped, ignoredSchemaProperties: schemas.ignored }), 201)
  })
}

/** GET /api/v1/posts: the posts this API created. */
export function handleListPosts(request: Request) {
  return guarded('api.posts_list_failed', async () => {
    const key = await authorize(request, 'blog:write')
    if (key instanceof Response) return key
    const posts = await listApiPosts()
    return apiOk({ posts: posts.map((p) => ({ ...p, adminUrl: `${SITE_URL}/admin/blog/${p.id}`, url: `${SITE_URL}/blog/${p.slug}` })) })
  })
}

/** The API-created post behind `/api/v1/posts/<id>`, or the error response. */
async function findApiPost(id: string) {
  if (!z.string().uuid().safeParse(id).success || !(await isApiPost(id))) return apiError(404, 'not_found', NOT_API_POST)
  return (await getBlogPostById(id)) ?? apiError(404, 'not_found', NOT_API_POST)
}

/** GET /api/v1/posts/<id>: the post, its body as stored (Markdown). */
export function handleGetPost(request: Request, id: string) {
  return guarded('api.post_get_failed', async () => {
    const key = await authorize(request, 'blog:write')
    if (key instanceof Response) return key
    const post = await findApiPost(id)
    if (post instanceof Response) return post
    return apiOk({
      ...present(post),
      description: post.description,
      content: post.content,
      format: 'markdown',
      seoTitle: post.seoTitle,
      seoDescription: post.seoDescription,
      coverUrl: post.coverUrl,
      coverAlt: post.coverAlt,
      category: post.category,
      product: post.product,
      tags: post.tags,
      keyTakeaways: post.keyTakeaways,
      faq: post.faq,
    })
  })
}

/** PUT /api/v1/posts/<id>: replaces a draft's fields. Published posts are changed in the admin only. */
export function handleUpdatePost(request: Request, id: string) {
  return guarded('api.post_update_failed', async () => {
    const key = await authorize(request, 'blog:write')
    if (key instanceof Response) return key
    if (!key.createdBy) return apiError(403, 'forbidden', OWNER_GONE)
    const current = await findApiPost(id)
    if (current instanceof Response) return current
    if (current.status !== 'draft') return apiError(409, 'conflict', 'This post is published; change it in the admin instead.')
    const body = await readJson(request)
    if (!body.ok) return body.response
    const parsed = ApiPostSchema.safeParse(body.body)
    if (!parsed.success) return validationError(parsed.error)
    const post = parsed.data
    if (post.schemas?.length) return apiError(422, 'validation_failed', 'Send schemas for an existing post to POST /api/v1/schemas with its path.')

    const slug = post.slug ?? current.slug
    const taken = slug !== current.slug ? await getBlogPostBySlug(slug) : null
    if (taken) return apiError(422, 'slug_taken', 'Another post already uses this slug.')
    const body_ = bodyMarkdown(post)
    const form = BlogPostFormSchema.safeParse({
      ...post,
      slug,
      content: body_.markdown,
      coverUrl: post.coverUrl || undefined,
      authorId: current.authorId,
      authorName: current.authorName,
      authorRole: current.authorRole ?? undefined,
      status: 'draft',
    })
    if (!form.success) return validationError(form.error)

    const updated = await updateBlogPost(id, form.data, key.createdBy)
    if (!updated) return apiError(404, 'not_found', NOT_API_POST)
    if (updated.slug !== current.slug && (await moveCustomSchemas(`/blog/${current.slug}`, `/blog/${updated.slug}`))) invalidatePublishedSchemas()
    await logActivity(apiActor(key), 'blog.update', { type: 'blog', id: updated.id, label: updated.title })
    return apiOk(withWarnings(present(updated), { droppedHtml: body_.dropped }))
  })
}

/** GET /api/v1/posts/format: what to send, for tools that read it themselves. */
export function handlePostFormat(request: Request) {
  return guarded('api.post_format_failed', async () => {
    const key = await authorize(request, 'blog:write')
    if (key instanceof Response) return key
    return apiOk({
      notes: [
        'Posts are saved as drafts; an editor publishes them in the admin.',
        'Send the body as Markdown (format "markdown") or HTML (format "html"). HTML is converted to Markdown; tags the site cannot show are dropped and listed in data.warnings.droppedHtml.',
        'Supported in the body: h2–h4, paragraphs, one-level lists, blockquotes, tables, code blocks, images on their own line, links, bold, italic, strikethrough, inline code.',
        'Optional "schemas": up to 5 schema.org JSON-LD objects, saved as pending schemas (needs "schema:write").',
        'Omit "slug" to derive it from the title.',
      ],
      jsonSchema: z.toJSONSchema(ApiPostSchema, { io: 'input', unrepresentable: 'any' }),
      example: {
        title: 'How to manage 100 digital signage screens remotely',
        description: 'A practical guide to grouping screens, scheduling playlists and monitoring players from one cloud dashboard.',
        format: 'html',
        content: '<p>Remote management lets you…</p><h2>What is remote signage management?</h2><p>…</p>',
        product: 'cms',
        tags: ['remote management'],
        keyTakeaways: ['Group screens by location before scheduling content.'],
        faq: [{ question: 'How many screens can one account manage?', answer: '…' }],
        schemas: [{ '@context': 'https://schema.org', '@type': 'HowTo', name: '…', step: [{ '@type': 'HowToStep', text: '…' }] }],
      },
    })
  })
}
