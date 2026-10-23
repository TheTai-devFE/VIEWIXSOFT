import '@tanstack/react-start/server-only'
import { getRequestHeader } from '@tanstack/react-start/server'
import { pickClientIp } from './client-ip'

/** Visitor IP as reported by the host (Cloudflare or Vercel). */
export function getClientIp() {
  // Vercel sets VERCEL=1 at runtime; local runs fall back to the Cloudflare rules.
  const host = process.env.VERCEL === '1' ? 'vercel' : 'cloudflare'
  return pickClientIp((name) => getRequestHeader(name), host)
}

export function getUserAgent() {
  return getRequestHeader('user-agent')?.slice(0, 300)
}
