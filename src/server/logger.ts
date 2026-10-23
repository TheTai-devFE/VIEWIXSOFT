import '@tanstack/react-start/server-only'

type Level = 'info' | 'warn' | 'error'
type Fields = Record<string, string | number | boolean | null | undefined>

/**
 * Structured JSON logs (Cloudflare Workers Logs indexes the fields).
 * Never pass emails, phone numbers, names or message bodies (AGENTS.md §10).
 */
function write(level: Level, event: string, fields: Fields = {}) {
  const line = JSON.stringify({ level, event, ...fields, at: new Date().toISOString() })
  // eslint-disable-next-line no-console -- the logger is the one place allowed to write to the console
  console[level](line)
}

// Drizzle appends the bound values to "Failed query" messages; they can be emails or session tokens.
const withoutParams = (message: string) => message.replace(/\n?params:[\s\S]*$/, '').slice(0, 200)

/**
 * Name and message of an error plus its root cause. Drizzle wraps every failure
 * in "Failed query", so only the innermost cause tells a network timeout
 * (`UND_ERR_CONNECT_TIMEOUT`) apart from a database error (Postgres code, e.g. `42P01`).
 */
export function errorFields(error: unknown): Fields {
  if (!(error instanceof Error)) return { error: 'unknown' }
  const fields: Fields = { error: error.name, reason: withoutParams(error.message) }

  let root: Error = error
  let code: string | undefined
  const seen = new Set<unknown>([error])
  // A few levels is enough for Drizzle → Neon → fetch → undici; the set stops cause loops.
  for (let depth = 0; depth < 6; depth++) {
    const ownCode: unknown = (root as { code?: unknown }).code
    if (typeof ownCode === 'string' || typeof ownCode === 'number') code = String(ownCode)
    const next = root.cause
    if (!(next instanceof Error) || seen.has(next)) break
    seen.add(next)
    root = next
  }

  if (root !== error) fields.cause = `${root.name}: ${withoutParams(root.message)}`
  if (code) fields.code = code
  return fields
}

export const logger = {
  info: (event: string, fields?: Fields) => write('info', event, fields),
  warn: (event: string, fields?: Fields) => write('warn', event, fields),
  error: (event: string, fields?: Fields) => write('error', event, fields),
}

/**
 * Better Auth's `logger.log`: its own logger prints whole error objects,
 * session tokens included. This keeps the message and the error's fields only.
 */
export function logAuth(level: 'debug' | 'info' | 'warn' | 'error', message: string, ...args: unknown[]) {
  if (level === 'debug') return
  const error = args.find((a) => a instanceof Error)
  write(level, 'auth.log', { message: withoutParams(message), ...(error ? errorFields(error) : {}) })
}
