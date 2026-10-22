import { createMiddleware } from '@tanstack/react-start'
import { getAdminSession } from '~/server/auth'

export class UnauthorizedError extends Error {
  constructor() {
    super('Unauthorized')
    this.name = 'UnauthorizedError'
  }
}

/** Every admin server function runs behind this: no session, no data. */
export const adminMiddleware = createMiddleware({ type: 'function' }).server(async ({ next }) => {
  const admin = await getAdminSession()
  if (!admin) throw new UnauthorizedError()
  return next({ context: { admin } })
})
