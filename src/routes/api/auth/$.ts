import { createFileRoute } from '@tanstack/react-router'
import { getAuth } from '~/server/auth'
import { errorFields, logger } from '~/server/logger'

// Better Auth's endpoints (sign-in, sign-out, session) under /api/auth/*.
async function handle(request: Request) {
  try {
    return await getAuth().handler(request)
  } catch (error) {
    // Missing secrets or database: refuse cleanly instead of crashing the request.
    logger.error('auth.unavailable', errorFields(error))
    return Response.json({ error: 'Sign-in is unavailable' }, { status: 503 })
  }
}

export const Route = createFileRoute('/api/auth/$')({
  server: { handlers: { GET: ({ request }) => handle(request), POST: ({ request }) => handle(request) } },
})
