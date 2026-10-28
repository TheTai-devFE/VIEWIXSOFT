import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AuthenticatedKey } from '~/server/api-keys/repository'

const authenticateApiKey = vi.fn<(key: string) => Promise<AuthenticatedKey | null>>()
const linkApiPost = vi.fn()
const isApiPost = vi.fn(async () => true)
const listApiPosts = vi.fn(async () => [])
const getAuthorByUserId = vi.fn()
const createBlogPost = vi.fn()
const getBlogPostById = vi.fn()
const getBlogPostBySlug = vi.fn()
const updateBlogPost = vi.fn()
const createCustomSchema = vi.fn()
const moveCustomSchemas = vi.fn(async () => 0)
const logActivity = vi.fn()

vi.mock('~/server/api-keys/repository', () => ({ authenticateApiKey }))
vi.mock('~/server/api-keys/posts-repository', () => ({ linkApiPost, isApiPost, listApiPosts }))
vi.mock('~/server/authors/repository', () => ({ getAuthorByUserId }))
vi.mock('~/server/blog/repository', () => ({ createBlogPost, getBlogPostById, getBlogPostBySlug, updateBlogPost }))
vi.mock('~/server/custom-schemas/repository', () => ({
  createCustomSchema,
  moveCustomSchemas,
  updateCustomSchema: vi.fn(),
  deleteCustomSchema: vi.fn(),
  getCustomSchemaById: vi.fn(),
  listCustomSchemas: vi.fn(),
}))
vi.mock('~/server/custom-schemas/targets', () => ({ isSchemaTarget: vi.fn(), listSchemaTargets: vi.fn() }))
vi.mock('~/server/custom-schemas/published', () => ({ invalidatePublishedSchemas: vi.fn() }))
vi.mock('~/server/activity/repository', () => ({ logActivity }))
vi.mock('~/server/logger', () => ({ logger: { info: vi.fn(), error: vi.fn() }, errorFields: () => ({}) }))

const api = await import('~/server/api/posts')

const POST_ID = '00000000-0000-4000-8000-0000000000d1'
const KEY: AuthenticatedKey = { id: '00000000-0000-4000-8000-000000000001', name: 'AI writer', scopes: ['blog:write'], createdBy: 'editor-1', limited: false }
const POST = {
  title: 'How to manage 100 screens remotely',
  description: 'A practical guide to grouping screens and scheduling playlists.',
  content: '## Why it matters\n\nRemote management saves site visits.',
}

const request = (method: string, body?: unknown) =>
  new Request('https://viewixsoft.com/api/v1/posts', {
    method,
    headers: { authorization: 'Bearer vxs_test', 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
const json = async (res: Response) => (await res.json()) as { ok: boolean; data?: Record<string, unknown>; error?: { code: string; details?: unknown } }
const row = (over: Record<string, unknown> = {}) => ({
  id: POST_ID,
  slug: 'how-to-manage-100-screens-remotely',
  title: POST.title,
  status: 'draft',
  authorId: null,
  authorName: 'Viewixsoft Team',
  authorRole: null,
  updatedAt: new Date(),
  ...over,
})

describe('POST /api/v1/posts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authenticateApiKey.mockResolvedValue(KEY)
    getBlogPostBySlug.mockResolvedValue(null)
    getAuthorByUserId.mockResolvedValue(null)
    createBlogPost.mockImplementation(async (form: { slug: string; title: string }) => row({ slug: form.slug, title: form.title }))
  })

  it('saves a draft owned by the key creator, with a slug from the title', async () => {
    const res = await api.handleCreatePost(request('POST', POST))
    expect(res.status).toBe(201)
    const [form, owner] = createBlogPost.mock.calls[0] as [Record<string, unknown>, string]
    expect(owner).toBe('editor-1')
    expect(form).toMatchObject({ slug: 'how-to-manage-100-screens-remotely', status: 'draft', content: POST.content })
    expect(linkApiPost).toHaveBeenCalledWith(POST_ID, KEY.id)
    const body = await json(res)
    expect(body.data).toMatchObject({ status: 'draft', adminUrl: `https://viewixsoft.com/admin/blog/${POST_ID}` })
    expect(body.data).not.toHaveProperty('warnings')
  })

  it('cannot publish: a status in the body is ignored', async () => {
    await api.handleCreatePost(request('POST', { ...POST, status: 'published' }))
    expect(createBlogPost.mock.calls[0]?.[0]).toMatchObject({ status: 'draft' })
  })

  it("uses the key owner's author profile as the byline", async () => {
    getAuthorByUserId.mockResolvedValue({ id: '00000000-0000-4000-8000-0000000000a1', name: 'Linh Tran', role: 'Solutions Engineer' })
    await api.handleCreatePost(request('POST', POST))
    expect(createBlogPost.mock.calls[0]?.[0]).toMatchObject({ authorId: '00000000-0000-4000-8000-0000000000a1', authorName: 'Linh Tran', authorRole: 'Solutions Engineer' })
  })

  it('converts an HTML body to Markdown and lists what it dropped', async () => {
    const res = await api.handleCreatePost(
      request('POST', { ...POST, format: 'html', content: '<h2>Why</h2><p>Saves <strong>visits</strong>.</p><script>x()</script><iframe></iframe>' }),
    )
    expect(createBlogPost.mock.calls[0]?.[0]).toMatchObject({ content: '## Why\n\nSaves **visits**.' })
    expect((await json(res)).data?.warnings).toEqual({ droppedHtml: ['iframe', 'script'] })
  })

  it('numbers the slug when the title is taken, and refuses a taken slug it was given', async () => {
    getBlogPostBySlug.mockImplementation(async (slug: string) => (slug === 'how-to-manage-100-screens-remotely' ? row() : null))
    await api.handleCreatePost(request('POST', POST))
    expect(createBlogPost.mock.calls[0]?.[0]).toMatchObject({ slug: 'how-to-manage-100-screens-remotely-2' })

    const res = await api.handleCreatePost(request('POST', { ...POST, slug: 'how-to-manage-100-screens-remotely' }))
    expect(res.status).toBe(422)
    expect((await json(res)).error?.code).toBe('slug_taken')
  })

  it('saves JSON-LD as pending schemas on the post path, only with schema:write', async () => {
    const faq = { '@type': 'FAQPage', mainEntity: [{ '@type': 'Question', name: 'Q?', acceptedAnswer: { '@type': 'Answer', text: 'A.' } }] }
    const denied = await api.handleCreatePost(request('POST', { ...POST, schemas: [faq] }))
    expect(denied.status).toBe(403)
    expect(createBlogPost).not.toHaveBeenCalled()

    authenticateApiKey.mockResolvedValue({ ...KEY, scopes: ['blog:write', 'schema:write'] })
    expect((await api.handleCreatePost(request('POST', { ...POST, schemas: [faq] }))).status).toBe(201)
    expect(createCustomSchema).toHaveBeenCalledWith(
      expect.objectContaining({ path: '/blog/how-to-manage-100-screens-remotely', schema: expect.objectContaining({ type: 'FAQPage' }) }),
      'pending',
      { kind: 'api', apiKeyId: KEY.id },
    )
  })

  it('checks every schema before creating anything', async () => {
    authenticateApiKey.mockResolvedValue({ ...KEY, scopes: ['blog:write', 'schema:write'] })
    const res = await api.handleCreatePost(request('POST', { ...POST, schemas: [{ name: 'no type' }] }))
    expect(res.status).toBe(422)
    expect((await json(res)).error?.details).toEqual([expect.objectContaining({ path: 'schemas.0' })])
    expect(createBlogPost).not.toHaveBeenCalled()
  })

  it('refuses keys without blog:write or without an owner, and invalid posts', async () => {
    authenticateApiKey.mockResolvedValue({ ...KEY, scopes: ['schema:write'] })
    expect((await api.handleCreatePost(request('POST', POST))).status).toBe(403)
    authenticateApiKey.mockResolvedValue({ ...KEY, createdBy: null })
    expect((await api.handleCreatePost(request('POST', POST))).status).toBe(403)
    authenticateApiKey.mockResolvedValue(KEY)
    expect((await api.handleCreatePost(request('POST', { ...POST, title: 'Hi' }))).status).toBe(422)
    expect((await api.handleCreatePost(request('POST', { ...POST, coverUrl: 'javascript:alert(1)' }))).status).toBe(422)
    expect(createBlogPost).not.toHaveBeenCalled()
  })
})

describe('GET and PUT /api/v1/posts/<id>', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authenticateApiKey.mockResolvedValue(KEY)
    isApiPost.mockResolvedValue(true)
    getBlogPostBySlug.mockResolvedValue(null)
    getBlogPostById.mockResolvedValue(row({ content: POST.content, description: POST.description }))
    updateBlogPost.mockImplementation(async (_id: string, form: { slug: string }) => row({ slug: form.slug }))
  })

  it('only reaches posts the API created', async () => {
    isApiPost.mockResolvedValue(false)
    expect((await api.handleGetPost(request('GET'), POST_ID)).status).toBe(404)
    expect((await api.handleUpdatePost(request('PUT', POST), POST_ID)).status).toBe(404)
    expect((await api.handleGetPost(request('GET'), 'not-a-uuid')).status).toBe(404)
    expect(updateBlogPost).not.toHaveBeenCalled()
  })

  it('returns the stored Markdown body', async () => {
    const body = await json(await api.handleGetPost(request('GET'), POST_ID))
    expect(body.data).toMatchObject({ content: POST.content, format: 'markdown', status: 'draft' })
  })

  it('updates a draft, keeping its byline and moving its schemas with a new slug', async () => {
    const res = await api.handleUpdatePost(request('PUT', { ...POST, slug: 'remote-screens' }), POST_ID)
    expect(res.status).toBe(200)
    expect(updateBlogPost).toHaveBeenCalledWith(POST_ID, expect.objectContaining({ slug: 'remote-screens', status: 'draft', authorName: 'Viewixsoft Team' }), 'editor-1')
    expect(moveCustomSchemas).toHaveBeenCalledWith('/blog/how-to-manage-100-screens-remotely', '/blog/remote-screens')
  })

  it('leaves published posts to the admin', async () => {
    getBlogPostById.mockResolvedValue(row({ status: 'published' }))
    const res = await api.handleUpdatePost(request('PUT', POST), POST_ID)
    expect(res.status).toBe(409)
    expect(updateBlogPost).not.toHaveBeenCalled()
  })
})
