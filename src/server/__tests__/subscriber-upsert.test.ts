import { describe, expect, it, vi } from 'vitest'
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from '../db/schema'
import type { NewsletterTopic } from '../schema/validation'

vi.mock('@tanstack/react-start/server-only', () => ({}))

const { subscriberUpsert } = await import('../leads/repository')

// Built only, never sent: neon() makes no connection until a query runs.
const db = drizzle(neon('postgresql://user:pass@localhost/test'), { schema })
const NOW = new Date('2026-10-27T10:00:00Z')

describe('subscriberUpsert', () => {
  const cases: NewsletterTopic[][] = [['newsletter'], ['pos', 'nfc'], []]

  it.each(cases.map((t) => [t]))('merges topics %j through the inserted row, not inlined values', (topics) => {
    const { sql, params } = subscriberUpsert(db, { email: 'ops@example.com', topics, consentAt: NOW }).toSQL()
    // A JS array inside sql`` expands to ($1, $2), which Postgres cannot cast to text[].
    expect(sql).not.toMatch(/\(\s*(\$\d+(,\s*\$\d+)*)?\s*\)::text\[\]/)
    expect(sql).toMatch(/excluded\."?topics"?/)
    // The topics travel once, as the insert's own array parameter.
    expect(params.filter((p) => p === 'newsletter' || p === 'pos')).toHaveLength(0)
  })
})
