import '@tanstack/react-start/server-only'
import { desc, eq, isNull, sql, and } from 'drizzle-orm'
import { API_KEY_PREFIX, API_RATE_LIMIT_PER_MINUTE, API_SCOPES } from '~/lib/api-keys'
import type { ApiScope, CreateApiKeyInput } from '~/lib/api-keys'
import { getDb } from '~/server/db/client'
import { apiKeys } from '~/server/db/schema'

function toBase64Url(bytes: Uint8Array) {
  let binary = ''
  for (const b of bytes) binary += String.fromCharCode(b)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/** A new key: the prefix and 32 random bytes (256 bits), so a fast hash is enough to store it. */
export function generateApiKey() {
  return `${API_KEY_PREFIX}${toBase64Url(crypto.getRandomValues(new Uint8Array(32)))}`
}

export async function hashApiKey(key: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(key))
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

/** The columns admins see; never the hash. */
const listed = {
  id: apiKeys.id,
  name: apiKeys.name,
  prefix: apiKeys.prefix,
  scopes: apiKeys.scopes,
  lastUsedAt: apiKeys.lastUsedAt,
  revokedAt: apiKeys.revokedAt,
  createdAt: apiKeys.createdAt,
}

export async function listApiKeys() {
  return getDb().select(listed).from(apiKeys).orderBy(desc(apiKeys.createdAt))
}

export type ApiKeyListRow = Awaited<ReturnType<typeof listApiKeys>>[number]

/** Stores a new key and returns it in full: the only time it can be read. */
export async function createApiKey(input: CreateApiKeyInput, userId: string) {
  const key = generateApiKey()
  const [row] = await getDb()
    .insert(apiKeys)
    .values({
      name: input.name,
      prefix: key.slice(0, API_KEY_PREFIX.length + 6),
      keyHash: await hashApiKey(key),
      scopes: input.scopes,
      createdBy: userId,
    })
    .returning(listed)
  if (!row) throw new Error('Failed to insert API key')
  return { key, row }
}

export async function revokeApiKey(id: string) {
  const [row] = await getDb()
    .update(apiKeys)
    .set({ revokedAt: new Date() })
    .where(and(eq(apiKeys.id, id), isNull(apiKeys.revokedAt)))
    .returning(listed)
  return row ?? null
}

export interface AuthenticatedKey {
  id: string
  name: string
  scopes: ApiScope[]
  /** The admin account that made the key; posts sent with it belong to that account. */
  createdBy: string | null
  /** True when this request went over the per-minute limit. */
  limited: boolean
}

/**
 * Looks up a live key and counts the request against its one-minute window,
 * in one statement so concurrent requests can't slip past the limit. Returns
 * null for an unknown or revoked key.
 */
export async function authenticateApiKey(key: string): Promise<AuthenticatedKey | null> {
  const keyHash = await hashApiKey(key)
  const expired = sql`${apiKeys.windowStart} < now() - interval '1 minute'`
  const [row] = await getDb()
    .update(apiKeys)
    .set({
      windowCount: sql`case when ${expired} then 1 else ${apiKeys.windowCount} + 1 end`,
      windowStart: sql`case when ${expired} then now() else ${apiKeys.windowStart} end`,
      lastUsedAt: sql`now()`,
    })
    .where(and(eq(apiKeys.keyHash, keyHash), isNull(apiKeys.revokedAt)))
    .returning({ id: apiKeys.id, name: apiKeys.name, scopes: apiKeys.scopes, createdBy: apiKeys.createdBy, windowCount: apiKeys.windowCount })
  if (!row) return null
  return {
    id: row.id,
    name: row.name,
    scopes: API_SCOPES.filter((s) => row.scopes.includes(s)),
    createdBy: row.createdBy,
    limited: row.windowCount > API_RATE_LIMIT_PER_MINUTE,
  }
}
