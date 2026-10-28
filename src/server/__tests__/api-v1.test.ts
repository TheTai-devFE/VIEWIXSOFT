import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AuthenticatedKey } from '~/server/api-keys/repository'

const authenticateApiKey = vi.fn<(key: string) => Promise<AuthenticatedKey | null>>()
const createCustomSchema = vi.fn()
const updateCustomSchema = vi.fn()
const deleteCustomSchema = vi.fn(async () => true)
const getCustomSchemaById = vi.fn()
const listCustomSchemas = vi.fn(async () => [])
const isSchemaTarget = vi.fn(async (path: string) => path === '/pricing')
const invalidatePublishedSchemas = vi.fn()
const logActivity = vi.fn()

vi.mock('~/server/api-keys/repository', () => ({ authenticateApiKey }))
vi.mock('~/server/custom-schemas/repository', () => ({
  createCustomSchema,
  updateCustomSchema,
  deleteCustomSchema,
  getCustomSchemaById,
  listCustomSchemas,
}))
vi.mock('~/server/custom-schemas/targets', () => ({ isSchemaTarget, listSchemaTargets: async () => [] }))
vi.mock('~/server/custom-schemas/published', () => ({ invalidatePublishedSchemas }))
vi.mock('~/server/activity/repository', () => ({ logActivity }))
vi.mock('~/server/logger', () => ({ logger: { info: vi.fn(), error: vi.fn() }, errorFields: () => ({}) }))

const api = await import('~/server/api/v1')

const KEY: AuthenticatedKey = { id: '00000000-0000-4000-8000-000000000001', name: 'SEO tool', scopes: ['schema:read', 'schema:write'], createdBy: 'admin-1', limited: false }
const ID = '00000000-0000-4000-8000-0000000000aa'
const FAQ = { path: '/pricing', schema: { type: 'FAQPage', data: { items: [{ question: 'Q?', answer: 'A.' }] } } }

function request(method: string, body?: unknown, auth: string | null = 'Bearer vxs_test') {
  const headers: Record<string, string> = { 'content-type': 'application/json' }
  if (auth) headers.authorization = auth
  return new Request(`https://viewixsoft.com/api/v1/schemas`, {
    method,
    headers,
    body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
  })
}

const row = (overrides: Record<string, unknown> = {}) => ({
  id: ID,
  path: '/pricing',
  name: '',
  schemaType: 'FAQPage',
  data: FAQ.schema.data,
  status: 'pending',
  source: 'api',
  apiKeyId: KEY.id,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})

async function json(res: Response) {
  return (await res.json()) as { ok: boolean; data?: Record<string, unknown>; error?: { code: string; details?: unknown } }
}

describe('/api/v1 authentication', () => {
  beforeEach(() => {
    authenticateApiKey.mockReset()
    authenticateApiKey.mockResolvedValue(KEY)
  })

  it('asks for a bearer key', async () => {
    const res = await api.handleListSchemas(request('GET', undefined, null))
    expect(res.status).toBe(401)
    expect((await json(res)).error?.code).toBe('unauthorized')
    expect(authenticateApiKey).not.toHaveBeenCalled()
  })

  it('rejects an unknown or revoked key', async () => {
    authenticateApiKey.mockResolvedValue(null)
    expect((await api.handleListSchemas(request('GET'))).status).toBe(401)
  })

  it('rate-limits a busy key', async () => {
    authenticateApiKey.mockResolvedValue({ ...KEY, limited: true })
    const res = await api.handleListSchemas(request('GET'))
    expect(res.status).toBe(429)
    expect(res.headers.get('retry-after')).toBe('60')
  })

  it('checks the scope', async () => {
    authenticateApiKey.mockResolvedValue({ ...KEY, scopes: ['schema:read'] })
    const res = await api.handleCreateSchema(request('POST', FAQ))
    expect(res.status).toBe(403)
    expect(createCustomSchema).not.toHaveBeenCalled()
  })

  it('passes the key from the header', async () => {
    await api.handleListSchemas(request('GET', undefined, 'Bearer vxs_abc'))
    expect(authenticateApiKey).toHaveBeenCalledWith('vxs_abc')
  })
})

describe('POST /api/v1/schemas', () => {
  beforeEach(() => {
    authenticateApiKey.mockResolvedValue(KEY)
    createCustomSchema.mockReset()
    createCustomSchema.mockImplementation(async () => row())
    logActivity.mockClear()
  })

  it('saves a valid schema as pending, credited to the key', async () => {
    const res = await api.handleCreateSchema(request('POST', FAQ))
    expect(res.status).toBe(201)
    const body = await json(res)
    expect(body.data?.status).toBe('pending')
    expect(body.data?.jsonLd).toMatchObject({ '@type': 'FAQPage' })
    expect(createCustomSchema).toHaveBeenCalledWith(expect.objectContaining({ path: '/pricing' }), 'pending', { kind: 'api', apiKeyId: KEY.id })
    expect(logActivity).toHaveBeenCalledWith({ userId: null, name: 'API: SEO tool' }, 'schema.create', expect.anything())
  })

  it('rejects a body that is not JSON', async () => {
    const res = await api.handleCreateSchema(request('POST', '{not json'))
    expect(res.status).toBe(400)
    expect((await json(res)).error?.code).toBe('invalid_json')
  })

  it('rejects an oversized body', async () => {
    const res = await api.handleCreateSchema(request('POST', { ...FAQ, name: 'x'.repeat(70_000) }))
    expect(res.status).toBe(413)
  })

  it('lists what is invalid', async () => {
    const res = await api.handleCreateSchema(request('POST', { path: '/pricing', schema: { type: 'FAQPage', data: { items: [] } } }))
    expect(res.status).toBe(422)
    const body = await json(res)
    expect(body.error?.code).toBe('validation_failed')
    expect(body.error?.details).toEqual(expect.arrayContaining([expect.objectContaining({ path: 'schema.data.items' })]))
    expect(createCustomSchema).not.toHaveBeenCalled()
  })

  it('rejects a page that does not exist', async () => {
    const res = await api.handleCreateSchema(request('POST', { ...FAQ, path: '/nope' }))
    expect(res.status).toBe(422)
    expect((await json(res)).error?.code).toBe('unknown_page')
  })

  it('hides server errors', async () => {
    createCustomSchema.mockRejectedValue(new Error('relation "custom_schemas" does not exist'))
    const res = await api.handleCreateSchema(request('POST', FAQ))
    expect(res.status).toBe(500)
    expect(JSON.stringify(await json(res))).not.toContain('relation')
  })
})

describe('POST /api/v1/schemas with JSON-LD', () => {
  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [{ '@type': 'Question', name: 'Q?', acceptedAnswer: { '@type': 'Answer', text: 'A.' } }],
  }

  beforeEach(() => {
    authenticateApiKey.mockResolvedValue(KEY)
    createCustomSchema.mockReset()
    createCustomSchema.mockImplementation(async () => row())
  })

  it('reads plain schema.org JSON-LD into the same fields as the admin form', async () => {
    const res = await api.handleCreateSchema(request('POST', { path: '/pricing', jsonLd: faqLd }))
    expect(res.status).toBe(201)
    expect(createCustomSchema).toHaveBeenCalledWith(
      { path: '/pricing', name: '', schema: { type: 'FAQPage', data: { items: [{ question: 'Q?', answer: 'A.' }] } } },
      'pending',
      { kind: 'api', apiKeyId: KEY.id },
    )
    expect((await json(res)).data).not.toHaveProperty('warnings')
  })

  it('accepts the JSON-LD as text, as copied from a script tag', async () => {
    const res = await api.handleCreateSchema(request('POST', { path: '/pricing', jsonLd: JSON.stringify(faqLd) }))
    expect(res.status).toBe(201)
  })

  it('lists properties the type does not keep', async () => {
    createCustomSchema.mockImplementation(async () => row({ schemaType: 'Product', data: { name: 'Player' } }))
    const res = await api.handleCreateSchema(
      request('POST', { path: '/pricing', jsonLd: { '@type': 'Product', name: 'Player', aggregateRating: { ratingValue: 5 } } }),
    )
    expect(res.status).toBe(201)
    expect((await json(res)).data?.warnings).toEqual({ ignoredProperties: ['aggregateRating'] })
  })

  it('keeps types without a form as a Custom schema', async () => {
    await api.handleCreateSchema(request('POST', { path: '/pricing', jsonLd: { '@type': 'Event', name: 'Launch' } }))
    expect(createCustomSchema).toHaveBeenCalledWith(
      expect.objectContaining({ schema: { type: 'Custom', data: { mode: 'json', json: { '@type': 'Event', name: 'Launch' } } } }),
      'pending',
      expect.anything(),
    )
  })

  it('rejects unreadable JSON-LD, or both body shapes at once', async () => {
    const missingType = await api.handleCreateSchema(request('POST', { path: '/pricing', jsonLd: { name: 'x' } }))
    expect(missingType.status).toBe(422)
    expect((await json(missingType)).error?.details).toEqual([expect.objectContaining({ path: 'jsonLd' })])

    const both = await api.handleCreateSchema(request('POST', { ...FAQ, jsonLd: faqLd }))
    expect(both.status).toBe(422)

    const incomplete = await api.handleCreateSchema(request('POST', { path: '/pricing', jsonLd: { '@type': 'FAQPage', mainEntity: [] } }))
    expect(incomplete.status).toBe(422)
    expect(createCustomSchema).not.toHaveBeenCalled()
  })
})

describe('PUT and DELETE /api/v1/schemas/<id>', () => {
  beforeEach(() => {
    authenticateApiKey.mockResolvedValue(KEY)
    getCustomSchemaById.mockReset()
    updateCustomSchema.mockReset()
    deleteCustomSchema.mockClear()
    invalidatePublishedSchemas.mockClear()
  })

  it('returns 404 for a malformed or unknown id', async () => {
    expect((await api.handleGetSchema(request('GET'), 'not-a-uuid')).status).toBe(404)
    getCustomSchemaById.mockResolvedValue(null)
    expect((await api.handleGetSchema(request('GET'), ID)).status).toBe(404)
  })

  it('cannot change or delete a schema made in the admin', async () => {
    getCustomSchemaById.mockResolvedValue(row({ source: 'admin', status: 'published' }))
    expect((await api.handleUpdateSchema(request('PUT', FAQ), ID)).status).toBe(403)
    expect((await api.handleDeleteSchema(request('DELETE'), ID)).status).toBe(403)
    expect(updateCustomSchema).not.toHaveBeenCalled()
    expect(deleteCustomSchema).not.toHaveBeenCalled()
  })

  it('sends an updated live schema back to pending and off the page', async () => {
    getCustomSchemaById.mockResolvedValue(row({ status: 'published' }))
    updateCustomSchema.mockResolvedValue(row())
    const res = await api.handleUpdateSchema(request('PUT', FAQ), ID)
    expect(res.status).toBe(200)
    expect(updateCustomSchema).toHaveBeenCalledWith(ID, expect.anything(), 'pending', { kind: 'api', apiKeyId: KEY.id })
    expect(invalidatePublishedSchemas).toHaveBeenCalled()
  })

  it('deletes a schema the API made', async () => {
    getCustomSchemaById.mockResolvedValue(row())
    const res = await api.handleDeleteSchema(request('DELETE'), ID)
    expect(res.status).toBe(200)
    expect(deleteCustomSchema).toHaveBeenCalledWith(ID)
  })
})

describe('GET /api/v1/schema-types', () => {
  it('describes every type with an example and a JSON Schema', async () => {
    authenticateApiKey.mockResolvedValue(KEY)
    const res = await api.handleSchemaTypes(request('GET'))
    const body = await json(res)
    expect(res.status).toBe(200)
    expect((body.data?.types as unknown[]).length).toBe(7)
    expect(body.data?.jsonSchema).toMatchObject({ type: 'object' })
  })
})
