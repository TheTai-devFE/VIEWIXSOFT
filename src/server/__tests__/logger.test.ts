import { afterEach, describe, expect, it, vi } from 'vitest'
import { errorFields, logAuth } from '../logger'

/** The shape Drizzle + Neon throw when the database can't be reached. */
function neonTimeout() {
  const timeout = Object.assign(new Error('Connect Timeout Error'), { name: 'ConnectTimeoutError', code: 'UND_ERR_CONNECT_TIMEOUT' })
  const fetchFailed = new TypeError('fetch failed', { cause: timeout })
  const neon = Object.assign(new Error('Error connecting to database: TypeError: fetch failed', { cause: fetchFailed }), {
    name: 'NeonDbError',
  })
  return Object.assign(
    new Error('Failed query: select "id" from "session" where "session"."token" = $1\nparams: 373PKv4faDbfH3pNun4K7vkslokmW49S', {
      cause: neon,
    }),
    { name: 'DrizzleQueryError' },
  )
}

describe('errorFields', () => {
  it('reports the root cause, so a network timeout is told apart from a database error', () => {
    const fields = errorFields(neonTimeout())
    expect(fields.error).toBe('DrizzleQueryError')
    expect(fields.cause).toBe('ConnectTimeoutError: Connect Timeout Error')
    expect(fields.code).toBe('UND_ERR_CONNECT_TIMEOUT')
  })

  it('never logs query params, which can hold emails or session tokens', () => {
    const fields = errorFields(neonTimeout())
    const line = JSON.stringify(fields)
    expect(line).not.toContain('373PKv4faDbfH3pNun4K7vkslokmW49S')
    expect(line).not.toContain('params')
    expect(fields.reason).toBe('Failed query: select "id" from "session" where "session"."token" = $1')
  })

  it('keeps a Postgres error code, e.g. a missing table', () => {
    const pg = Object.assign(new Error('relation "section_content" does not exist'), { code: '42P01' })
    const fields = errorFields(new Error('Failed query: select 1\nparams: ', { cause: pg }))
    expect(fields.code).toBe('42P01')
    expect(fields.cause).toBe('Error: relation "section_content" does not exist')
  })

  it('handles an error without a cause, and things that are not errors', () => {
    expect(errorFields(new Error('boom'))).toEqual({ error: 'Error', reason: 'boom' })
    expect(errorFields('nope')).toEqual({ error: 'unknown' })
  })

  it('stops on a cause loop', () => {
    const a = new Error('a')
    const b = new Error('b', { cause: a })
    Object.assign(a, { cause: b })
    expect(() => errorFields(a)).not.toThrow()
  })
})

describe('logAuth', () => {
  afterEach(() => vi.restoreAllMocks())

  it('logs one JSON line with the root cause and no session token', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    logAuth('error', 'INTERNAL_SERVER_ERROR', neonTimeout())
    expect(spy).toHaveBeenCalledOnce()
    const line = String(spy.mock.calls[0]?.[0])
    expect(JSON.parse(line)).toMatchObject({ level: 'error', event: 'auth.log', code: 'UND_ERR_CONNECT_TIMEOUT' })
    expect(line).not.toContain('373PKv4faDbfH3pNun4K7vkslokmW49S')
  })
})
