import '@tanstack/react-start/server-only'
import { getRequestHeader } from '@tanstack/react-start/server'

/** Visitor IP as seen by Cloudflare; falls back to X-Forwarded-For for local runs. */
export function getClientIp() {
  return (
    getRequestHeader('cf-connecting-ip') ??
    getRequestHeader('x-forwarded-for')?.split(',')[0]?.trim() ??
    undefined
  )
}

export function getUserAgent() {
  return getRequestHeader('user-agent')?.slice(0, 300)
}
