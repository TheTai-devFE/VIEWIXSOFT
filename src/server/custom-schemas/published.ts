import '@tanstack/react-start/server-only'
import { buildCustomJsonLd, CustomSchemaInputSchema } from '~/lib/seo/custom-schema'
import { hasDatabase } from '~/server/db/client'
import type { CustomSchemaRow } from '~/server/db/schema'
import { errorFields, logger } from '~/server/logger'
import { listPublishedCustomSchemas } from './repository'

const TTL_MS = 30_000
let cache: { at: number; byPath: Map<string, object[]> } | undefined
let pending: Promise<Map<string, object[]>> | undefined
// Bumped by a save, so a read that started before it can't cache the old rows.
let generation = 0

/** JSON-LD per page path. A row whose data no longer parses is skipped and logged, never rendered. */
export function groupByPath(rows: CustomSchemaRow[]) {
  const byPath = new Map<string, object[]>()
  for (const row of rows) {
    const parsed = CustomSchemaInputSchema.safeParse({ type: row.schemaType, data: row.data })
    if (!parsed.success) {
      logger.error('custom_schema.invalid_row', { id: row.id })
      continue
    }
    const list = byPath.get(row.path) ?? []
    list.push(buildCustomJsonLd(parsed.data, row.path))
    byPath.set(row.path, list)
  }
  return byPath
}

function refresh() {
  if (pending) return pending
  const started = generation
  const read = listPublishedCustomSchemas()
    .then((rows) => {
      const byPath = groupByPath(rows)
      if (started === generation) cache = { at: Date.now(), byPath }
      return byPath
    })
    .finally(() => {
      if (pending === read) pending = undefined
    })
  pending = read
  return read
}

/**
 * Published custom JSON-LD for one page, cached per isolate like the site
 * settings (src/server/site/config.ts). A missing or failing database gives
 * no custom markup rather than an error page.
 */
export async function publishedSchemasFor(path: string): Promise<object[]> {
  if (!hasDatabase()) return []
  try {
    if (cache) {
      if (Date.now() - cache.at >= TTL_MS) {
        refresh().catch((error: unknown) => logger.error('custom_schema.load_failed', errorFields(error)))
      }
      return cache.byPath.get(path) ?? []
    }
    return (await refresh()).get(path) ?? []
  } catch (error) {
    logger.error('custom_schema.load_failed', errorFields(error))
    return []
  }
}

export function invalidatePublishedSchemas() {
  generation++
  cache = undefined
  pending = undefined
}
