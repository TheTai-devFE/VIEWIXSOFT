import '@tanstack/react-start/server-only'
import { and, desc, eq } from 'drizzle-orm'
import type { SQL } from 'drizzle-orm'
import { getDb } from '~/server/db/client'
import { apiKeys, customSchemas } from '~/server/db/schema'
import type { CustomSchemaRow } from '~/server/db/schema'
import type { CustomSchemaForm, CustomSchemaStatus } from '~/lib/seo/custom-schema'
import type { Json } from '~/lib/section-content'

/** A schema row plus the name of the API key that wrote it, if any. */
export type CustomSchemaListRow = CustomSchemaRow & { apiKeyName: string | null }

export async function listCustomSchemas(filter: { path?: string; status?: CustomSchemaStatus } = {}): Promise<CustomSchemaListRow[]> {
  const where: SQL[] = []
  if (filter.path) where.push(eq(customSchemas.path, filter.path))
  if (filter.status) where.push(eq(customSchemas.status, filter.status))
  const rows = await getDb()
    .select({ schema: customSchemas, apiKeyName: apiKeys.name })
    .from(customSchemas)
    .leftJoin(apiKeys, eq(customSchemas.apiKeyId, apiKeys.id))
    .where(where.length ? and(...where) : undefined)
    .orderBy(desc(customSchemas.updatedAt))
  return rows.map((r) => ({ ...r.schema, apiKeyName: r.apiKeyName }))
}

export async function listPublishedCustomSchemas(): Promise<CustomSchemaRow[]> {
  return getDb().select().from(customSchemas).where(eq(customSchemas.status, 'published'))
}

export async function getCustomSchemaById(id: string): Promise<CustomSchemaRow | null> {
  const [row] = await getDb().select().from(customSchemas).where(eq(customSchemas.id, id))
  return row ?? null
}

/** Who wrote the row: an admin account, or an outside tool through an API key. */
export type SchemaAuthor = { kind: 'admin'; userId: string } | { kind: 'api'; apiKeyId: string }

const columns = (input: CustomSchemaForm) => ({
  path: input.path,
  name: input.name,
  schemaType: input.schema.type,
  // Stored as entered; the JSON-LD is built from it when the page renders.
  data: input.schema.data as Json,
})

export async function createCustomSchema(input: CustomSchemaForm, status: CustomSchemaStatus, by: SchemaAuthor) {
  const [row] = await getDb()
    .insert(customSchemas)
    .values({
      ...columns(input),
      status,
      source: by.kind,
      apiKeyId: by.kind === 'api' ? by.apiKeyId : null,
      createdBy: by.kind === 'admin' ? by.userId : null,
      updatedBy: by.kind === 'admin' ? by.userId : null,
    })
    .returning()
  if (!row) throw new Error('Failed to insert custom schema')
  return row
}

export async function updateCustomSchema(id: string, input: CustomSchemaForm, status: CustomSchemaStatus, by: SchemaAuthor) {
  const [row] = await getDb()
    .update(customSchemas)
    .set({
      ...columns(input),
      status,
      ...(by.kind === 'admin' ? { updatedBy: by.userId } : { source: 'api' as const, apiKeyId: by.apiKeyId }),
      updatedAt: new Date(),
    })
    .where(eq(customSchemas.id, id))
    .returning()
  return row ?? null
}

export async function setCustomSchemaStatus(id: string, status: CustomSchemaStatus, userId: string) {
  const [row] = await getDb()
    .update(customSchemas)
    .set({ status, updatedBy: userId, updatedAt: new Date() })
    .where(eq(customSchemas.id, id))
    .returning()
  return row ?? null
}

export async function deleteCustomSchema(id: string): Promise<boolean> {
  const result = await getDb().delete(customSchemas).where(eq(customSchemas.id, id)).returning({ id: customSchemas.id })
  return result.length > 0
}

/** Follows a page to its new path, e.g. when a blog post's slug changes. */
export async function moveCustomSchemas(fromPath: string, toPath: string) {
  const moved = await getDb()
    .update(customSchemas)
    .set({ path: toPath, updatedAt: new Date() })
    .where(eq(customSchemas.path, fromPath))
    .returning({ id: customSchemas.id })
  return moved.length
}

/** Removes a page's schemas when the page itself is deleted. */
export async function deleteCustomSchemasForPath(path: string) {
  const removed = await getDb().delete(customSchemas).where(eq(customSchemas.path, path)).returning({ id: customSchemas.id })
  return removed.length
}
