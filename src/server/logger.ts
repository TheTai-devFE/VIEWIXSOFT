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

export function errorFields(error: unknown): Fields {
  if (error instanceof Error) return { error: error.name, reason: error.message.slice(0, 200) }
  return { error: 'unknown' }
}

export const logger = {
  info: (event: string, fields?: Fields) => write('info', event, fields),
  warn: (event: string, fields?: Fields) => write('warn', event, fields),
  error: (event: string, fields?: Fields) => write('error', event, fields),
}
