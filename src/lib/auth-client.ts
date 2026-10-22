import { createAuthClient } from 'better-auth/react'

/** Browser client for /api/auth/*; only the admin pages import it. */
export const authClient = createAuthClient()
