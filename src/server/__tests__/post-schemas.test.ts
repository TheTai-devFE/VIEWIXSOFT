import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AdminSession } from '~/server/auth'

const getBlogPostById = vi.fn()
const getCustomSchemaById = vi.fn()
const createCustomSchema = vi.fn()
const updateCustomSchema = vi.fn()
const setCustomSchemaStatus = vi.fn()
const deleteCustomSchema = vi.fn(async () => true)
const listCustomSchemas = vi.fn(async () => [])
const invalidatePublishedSchemas = vi.fn()

vi.mock('~/server/blog/repository', () => ({ getBlogPostById }))
vi.mock('~/server/custom-schemas/repository', () => ({
  getCustomSchemaById,
  createCustomSchema,
  updateCustomSchema,
  setCustomSchemaStatus,
  deleteCustomSchema,
  listCustomSchemas,
}))
vi.mock('~/server/custom-schemas/published', () => ({ invalidatePublishedSchemas }))
vi.mock('~/server/activity/repository', () => ({ logActivity: vi.fn() }))

const { savePostSchema, setPostSchemaStatus, deletePostSchema, listPostSchemas, POST_SCHEMA_NOT_OWNER, POST_SCHEMA_NOT_FOUND } = await import(
  '~/server/custom-schemas/post-schemas'
)

const POST_ID = '00000000-0000-4000-8000-0000000000b1'
const SCHEMA_ID = '00000000-0000-4000-8000-0000000000c1'
const member = (userId: string, permissions: AdminSession['permissions'] = ['blog']): AdminSession => ({
  userId,
  email: `${userId}@example.com`,
  name: userId,
  role: 'user',
  permissions,
})
const post = { id: POST_ID, slug: 'pair-a-screen', title: 'Pair a screen', createdBy: 'writer' }
const howTo = { type: 'HowTo' as const, data: { name: 'Pair', description: '', image: '', totalTime: '', supply: [], tool: [], steps: [{ name: '', text: 'Plug in.', image: '' }] } }
const save = (admin: AdminSession, extra: Record<string, unknown> = {}) =>
  savePostSchema(admin, { postId: POST_ID, name: '', status: 'published', schema: howTo, ...extra })

describe('blog post schemas', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getBlogPostById.mockResolvedValue(post)
    createCustomSchema.mockImplementation(async () => ({ id: SCHEMA_ID, schemaType: 'HowTo' }))
    updateCustomSchema.mockImplementation(async () => ({ id: SCHEMA_ID, schemaType: 'HowTo' }))
    setCustomSchemaStatus.mockImplementation(async () => ({ id: SCHEMA_ID, schemaType: 'HowTo' }))
  })

  it("attaches a new schema to the post's path, live at once", async () => {
    expect(await save(member('writer'))).toEqual({ ok: true })
    expect(createCustomSchema).toHaveBeenCalledWith({ path: '/blog/pair-a-screen', name: '', schema: howTo }, 'published', { kind: 'admin', userId: 'writer' })
    expect(invalidatePublishedSchemas).toHaveBeenCalled()
  })

  it("refuses someone else's post without edit-others", async () => {
    expect(await save(member('other'))).toEqual({ ok: false, message: POST_SCHEMA_NOT_OWNER })
    expect(createCustomSchema).not.toHaveBeenCalled()
    expect(await save(member('other', ['blog', 'edit-others']))).toEqual({ ok: true })
  })

  it('refuses a post that does not exist', async () => {
    getBlogPostById.mockResolvedValue(null)
    expect(await save(member('writer'))).toEqual({ ok: false, message: POST_SCHEMA_NOT_FOUND })
  })

  it("won't change a schema that belongs to another page", async () => {
    getCustomSchemaById.mockResolvedValue({ id: SCHEMA_ID, path: '/pricing', schemaType: 'FAQPage' })
    expect(await save(member('writer'), { id: SCHEMA_ID })).toEqual({ ok: false, message: POST_SCHEMA_NOT_FOUND })
    expect(await setPostSchemaStatus(member('writer'), { postId: POST_ID, id: SCHEMA_ID, status: 'disabled' })).toEqual({ ok: false, message: POST_SCHEMA_NOT_FOUND })
    expect(await deletePostSchema(member('writer'), { postId: POST_ID, id: SCHEMA_ID })).toEqual({ ok: false, message: POST_SCHEMA_NOT_FOUND })
    expect(updateCustomSchema).not.toHaveBeenCalled()
    expect(setCustomSchemaStatus).not.toHaveBeenCalled()
    expect(deleteCustomSchema).not.toHaveBeenCalled()
  })

  it("updates, approves and deletes the post's own schemas", async () => {
    getCustomSchemaById.mockResolvedValue({ id: SCHEMA_ID, path: '/blog/pair-a-screen', schemaType: 'HowTo' })
    expect(await save(member('writer'), { id: SCHEMA_ID, status: 'disabled' })).toEqual({ ok: true })
    expect(updateCustomSchema).toHaveBeenCalledWith(SCHEMA_ID, expect.objectContaining({ path: '/blog/pair-a-screen' }), 'disabled', expect.anything())
    expect(await setPostSchemaStatus(member('writer'), { postId: POST_ID, id: SCHEMA_ID, status: 'published' })).toEqual({ ok: true })
    expect(await deletePostSchema(member('writer'), { postId: POST_ID, id: SCHEMA_ID })).toEqual({ ok: true })
    expect(deleteCustomSchema).toHaveBeenCalledWith(SCHEMA_ID)
  })

  it("splits the post's schemas from the library of other pages' schemas", async () => {
    const mine = { id: 'a', path: '/blog/pair-a-screen', name: '', schemaType: 'HowTo', data: {}, status: 'published' }
    const other = { id: 'b', path: '/pricing', name: 'Pricing FAQ', schemaType: 'FAQPage', data: { items: [] }, status: 'published' }
    listCustomSchemas.mockResolvedValue([mine, other] as never)
    const res = await listPostSchemas(POST_ID)
    expect(res.schemas).toEqual([mine])
    expect(res.library).toEqual([other])
  })
})
