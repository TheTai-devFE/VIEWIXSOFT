import '@tanstack/react-start/server-only'
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import type { NeonHttpDatabase } from 'drizzle-orm/neon-http'
import { getEnv } from '~/server/env'
import * as schema from './schema'

export type Database = NeonHttpDatabase<typeof schema>

let cached: { url: string; db: Database } | undefined

/**
 * Drizzle over Neon's HTTP driver: one stateless request per query, which suits
 * Cloudflare Workers (no TCP pool to keep alive between requests).
 */
export function getDb(): Database {
  const url = getEnv().DATABASE_URL
  if (!url) throw new DatabaseUnavailableError()
  if (cached?.url !== url) cached = { url, db: drizzle(neon(url), { schema }) }
  return cached.db
}

export function hasDatabase() {
  return Boolean(getEnv().DATABASE_URL)
}

export class DatabaseUnavailableError extends Error {
  constructor() {
    super('DATABASE_URL is not set')
    this.name = 'DatabaseUnavailableError'
  }
}
