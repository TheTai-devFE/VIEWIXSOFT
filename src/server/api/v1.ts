import '@tanstack/react-start/server-only'
import { z } from 'zod'
import { bearerToken } from '~/lib/api-keys'
import type { ApiScope } from '~/lib/api-keys'
import {
  buildCustomJsonLd,
  CUSTOM_SCHEMA_LABELS,
  CUSTOM_SCHEMA_STATUSES,
  CUSTOM_SCHEMA_TYPES,
  CustomSchemaFormSchema,
  CustomSchemaInputSchema,
  SchemaPathSchema,
  blankSchema,
} from '~/lib/seo/custom-schema'
import { importJsonLd } from '~/lib/seo/custom-schema-import'
import type { CustomSchemaForm } from '~/lib/seo/custom-schema'
import { logActivity } from '~/server/activity/repository'
import { authenticateApiKey } from '~/server/api-keys/repository'
import type { AuthenticatedKey } from '~/server/api-keys/repository'
import {
  createCustomSchema,
  deleteCustomSchema,
  getCustomSchemaById,
  listCustomSchemas,
  updateCustomSchema,
} from '~/server/custom-schemas/repository'
import type { CustomSchemaRow } from '~/server/db/schema'
import { invalidatePublishedSchemas } from '~/server/custom-schemas/published'
import { isSchemaTarget, listSchemaTargets } from '~/server/custom-schemas/targets'
import { errorFields, logger } from '~/server/logger'

/*
 * /api/v1: schema markup for outside tools (an SEO tool, an AI writer…),
 * authenticated with an API key from /admin/api-keys. Anything written here
 * waits as `pending` until an admin approves it in /admin/schema, and a tool
 * can only change or delete schemas that came through the API, never ones an
 * admin made. Every response is `{ ok: true, data }` or `{ ok: false, error }`.
 *
 * A schema is sent either as `schema` (our `{ type, data }` fields) or as
 * `jsonLd` (plain schema.org JSON-LD, as AI tools write it), which is read
 * into the same fields the admin form uses.
 */

const MAX_BODY_BYTES = 64 * 1024

type ErrorCode =
  | 'unauthorized'
  | 'forbidden'
  | 'rate_limited'
  | 'invalid_json'
  | 'too_large'
  | 'validation_failed'
  | 'unknown_page'
  | 'not_found'
  | 'slug_taken'
  | 'conflict'
  | 'server_error'

export function apiError(status: number, code: ErrorCode, message: string, details?: unknown) {
  return Response.json({ ok: false, error: { code, message, ...(details ? { details } : {}) } }, { status })
}

export function apiOk(data: unknown, status = 200) {
  return Response.json({ ok: true, data }, { status })
}

/** The key behind the request, or the error response to send instead. */
export async function authorize(request: Request, scope: ApiScope): Promise<AuthenticatedKey | Response> {
  const token = bearerToken(request.headers.get('authorization'))
  if (!token) return apiError(401, 'unauthorized', 'Send the API key as "Authorization: Bearer <key>".')
  const key = await authenticateApiKey(token)
  if (!key) return apiError(401, 'unauthorized', 'This API key is not valid or has been revoked.')
  if (key.limited) {
    const res = apiError(429, 'rate_limited', 'Too many requests. Wait a minute and try again.')
    res.headers.set('Retry-After', '60')
    return res
  }
  if (!key.scopes.includes(scope)) return apiError(403, 'forbidden', `This API key does not have the "${scope}" permission.`)
  return key
}

export async function readJson(request: Request): Promise<{ ok: true; body: unknown } | { ok: false; response: Response }> {
  const text = await request.text()
  if (new TextEncoder().encode(text).length > MAX_BODY_BYTES) {
    return { ok: false, response: apiError(413, 'too_large', `The request body must be under ${MAX_BODY_BYTES / 1024} KB.`) }
  }
  try {
    return { ok: true, body: JSON.parse(text) }
  } catch {
    return { ok: false, response: apiError(400, 'invalid_json', 'The request body is not valid JSON.') }
  }
}

export function validationError(error: z.ZodError) {
  const details = error.issues.map((i) => ({ path: i.path.join('.'), message: i.message }))
  return apiError(422, 'validation_failed', 'Some fields are missing or invalid.', details)
}

/** The saved form behind a POST or PUT body, with JSON-LD properties the type does not keep. */
function readForm(body: unknown): { ok: true; form: CustomSchemaForm; ignored: string[] } | { ok: false; response: Response } {
  let input = body
  let ignored: string[] = []
  if (typeof body === 'object' && body !== null && 'jsonLd' in body) {
    if ('schema' in body) {
      return { ok: false, response: apiError(422, 'validation_failed', 'Send either "schema" or "jsonLd", not both.') }
    }
    const { jsonLd, ...rest } = body as Record<string, unknown>
    // Tools send the JSON-LD as an object or as the text of a <script> tag.
    const imported = importJsonLd(typeof jsonLd === 'string' ? jsonLd : JSON.stringify(jsonLd ?? null))
    if (!imported.ok) {
      return { ok: false, response: apiError(422, 'validation_failed', 'The JSON-LD could not be read.', [{ path: 'jsonLd', message: imported.error }]) }
    }
    input = { ...rest, schema: imported.draft }
    ignored = imported.ignored
  }
  const parsed = CustomSchemaFormSchema.safeParse(input)
  if (!parsed.success) return { ok: false, response: validationError(parsed.error) }
  return { ok: true, form: parsed.data, ignored }
}

/** Tells the tool which pasted JSON-LD properties were dropped, so it can send them as a "Custom" schema instead. */
const withWarnings = (data: object, ignored: string[]) => (ignored.length ? { ...data, warnings: { ignoredProperties: ignored } } : data)

/** A schema as the API returns it: the stored fields plus the JSON-LD the page will carry. */
function present(row: CustomSchemaRow & { apiKeyName?: string | null }) {
  const parsed = CustomSchemaInputSchema.safeParse({ type: row.schemaType, data: row.data })
  return {
    id: row.id,
    path: row.path,
    name: row.name,
    status: row.status,
    source: row.source,
    schema: { type: row.schemaType, data: row.data },
    jsonLd: parsed.success ? buildCustomJsonLd(parsed.data, row.path) : null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

export const apiActor = (key: AuthenticatedKey) => ({ userId: null, name: `API: ${key.name}` })

export async function guarded(event: string, run: () => Promise<Response>) {
  try {
    return await run()
  } catch (error) {
    logger.error(event, errorFields(error))
    return apiError(500, 'server_error', 'Something went wrong on the server. Try again later.')
  }
}

// ─── Handlers ─────────────────────────────────────────────────────────────────

/** GET /api/v1/schema-types: what can be sent, with a JSON Schema and an empty example per type. */
export function handleSchemaTypes(request: Request) {
  return guarded('api.schema_types_failed', async () => {
    const key = await authorize(request, 'schema:read')
    if (key instanceof Response) return key
    return apiOk({
      types: CUSTOM_SCHEMA_TYPES.map((type) => ({
        type,
        label: CUSTOM_SCHEMA_LABELS[type].label,
        hint: CUSTOM_SCHEMA_LABELS[type].hint,
        example: { path: '/blog/example-post', name: '', schema: blankSchema(type) },
      })),
      // The full request body for POST and PUT /api/v1/schemas.
      jsonSchema: z.toJSONSchema(CustomSchemaFormSchema, { io: 'input', unrepresentable: 'any' }),
      // The other accepted body: plain schema.org JSON-LD instead of `schema`.
      jsonLdBody: {
        description:
          'Instead of "schema", send "jsonLd": one schema.org JSON-LD object (or its text). HowTo, FAQPage, Recipe, ImageGallery, Product and Service are read into their fields; any other @type is kept as is. Properties a type does not keep are listed in data.warnings.ignoredProperties.',
        example: {
          path: '/blog/example-post',
          jsonLd: {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: [{ '@type': 'Question', name: 'How many screens can one account manage?', acceptedAnswer: { '@type': 'Answer', text: '…' } }],
          },
        },
      },
    })
  })
}

/** GET /api/v1/targets: every page a schema can be attached to. */
export function handleTargets(request: Request) {
  return guarded('api.targets_failed', async () => {
    const key = await authorize(request, 'schema:read')
    if (key instanceof Response) return key
    return apiOk({ targets: await listSchemaTargets() })
  })
}

const ListQuerySchema = z.object({
  path: SchemaPathSchema.optional(),
  status: z.enum(CUSTOM_SCHEMA_STATUSES).optional(),
})

/** GET /api/v1/schemas?path=/about&status=pending */
export function handleListSchemas(request: Request) {
  return guarded('api.schemas_list_failed', async () => {
    const key = await authorize(request, 'schema:read')
    if (key instanceof Response) return key
    const params = new URL(request.url).searchParams
    const query = ListQuerySchema.safeParse({ path: params.get('path') ?? undefined, status: params.get('status') ?? undefined })
    if (!query.success) return validationError(query.error)
    const rows = await listCustomSchemas(query.data)
    return apiOk({ schemas: rows.map(present) })
  })
}

/** POST /api/v1/schemas: a new schema, always pending until an admin approves it. */
export function handleCreateSchema(request: Request) {
  return guarded('api.schema_create_failed', async () => {
    const key = await authorize(request, 'schema:write')
    if (key instanceof Response) return key
    const body = await readJson(request)
    if (!body.ok) return body.response
    const parsed = readForm(body.body)
    if (!parsed.ok) return parsed.response
    if (!(await isSchemaTarget(parsed.form.path))) {
      return apiError(422, 'unknown_page', 'No page with this path. GET /api/v1/targets lists the pages.')
    }
    const row = await createCustomSchema(parsed.form, 'pending', { kind: 'api', apiKeyId: key.id })
    await logActivity(apiActor(key), 'schema.create', { type: 'schema', id: row.id, label: `${row.schemaType} · ${row.path}` })
    return apiOk(withWarnings(present(row), parsed.ignored), 201)
  })
}

const IdSchema = z.string().uuid()

/** The row behind `/api/v1/schemas/<id>`, or the error response. */
async function findRow(id: string) {
  if (!IdSchema.safeParse(id).success) return apiError(404, 'not_found', 'No schema with this id.')
  const row = await getCustomSchemaById(id)
  return row ?? apiError(404, 'not_found', 'No schema with this id.')
}

const ADMIN_OWNED = 'This schema was made in the admin; an API key can only change schemas created through the API.'

/** GET /api/v1/schemas/<id> */
export function handleGetSchema(request: Request, id: string) {
  return guarded('api.schema_get_failed', async () => {
    const key = await authorize(request, 'schema:read')
    if (key instanceof Response) return key
    const row = await findRow(id)
    return row instanceof Response ? row : apiOk(present(row))
  })
}

/** PUT /api/v1/schemas/<id>: replaces the schema; it goes back to pending (and off the page) until approved again. */
export function handleUpdateSchema(request: Request, id: string) {
  return guarded('api.schema_update_failed', async () => {
    const key = await authorize(request, 'schema:write')
    if (key instanceof Response) return key
    const existing = await findRow(id)
    if (existing instanceof Response) return existing
    if (existing.source !== 'api') return apiError(403, 'forbidden', ADMIN_OWNED)
    const body = await readJson(request)
    if (!body.ok) return body.response
    const parsed = readForm(body.body)
    if (!parsed.ok) return parsed.response
    if (!(await isSchemaTarget(parsed.form.path))) {
      return apiError(422, 'unknown_page', 'No page with this path. GET /api/v1/targets lists the pages.')
    }
    const row = await updateCustomSchema(id, parsed.form, 'pending', { kind: 'api', apiKeyId: key.id })
    if (!row) return apiError(404, 'not_found', 'No schema with this id.')
    if (existing.status === 'published') invalidatePublishedSchemas()
    await logActivity(apiActor(key), 'schema.update', { type: 'schema', id: row.id, label: `${row.schemaType} · ${row.path}` })
    return apiOk(withWarnings(present(row), parsed.ignored))
  })
}

/** DELETE /api/v1/schemas/<id> */
export function handleDeleteSchema(request: Request, id: string) {
  return guarded('api.schema_delete_failed', async () => {
    const key = await authorize(request, 'schema:write')
    if (key instanceof Response) return key
    const existing = await findRow(id)
    if (existing instanceof Response) return existing
    if (existing.source !== 'api') return apiError(403, 'forbidden', ADMIN_OWNED)
    await deleteCustomSchema(id)
    if (existing.status === 'published') invalidatePublishedSchemas()
    await logActivity(apiActor(key), 'schema.delete', { type: 'schema', id, label: `${existing.schemaType} · ${existing.path}` })
    return apiOk({ id, deleted: true })
  })
}
