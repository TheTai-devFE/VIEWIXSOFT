import '@tanstack/react-start/server-only'
import { logger } from '~/server/logger'

const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

/**
 * Verifies a Cloudflare Turnstile token. Without a secret, local development
 * skips the check and production rejects every submission (fails closed).
 */
export async function verifyTurnstile(
  token: string | undefined,
  ip: string | undefined,
  secret: string | undefined,
  production: boolean,
) {
  if (!secret) {
    if (production) logger.error('turnstile.secret_missing')
    return !production
  }
  if (!token) return false
  const body = new FormData()
  body.append('secret', secret)
  body.append('response', token)
  if (ip) body.append('remoteip', ip)
  try {
    const res = await fetch(VERIFY_URL, { method: 'POST', body })
    const data = (await res.json()) as { success?: boolean; 'error-codes'?: string[] }
    if (!data.success) logger.warn('turnstile.rejected', { codes: data['error-codes']?.join(',') })
    return data.success === true
  } catch {
    logger.error('turnstile.unreachable')
    return false
  }
}
