export type Host = 'cloudflare' | 'vercel'

/**
 * Visitor IP from the header the current host sets itself. A client can send
 * any header, so cf-connecting-ip is only trusted behind Cloudflare; Vercel
 * overwrites X-Forwarded-For with the real address.
 */
export function pickClientIp(get: (name: string) => string | undefined, host: Host) {
  const forwarded = get('x-forwarded-for')?.split(',')[0]?.trim() || undefined
  if (host === 'cloudflare') return get('cf-connecting-ip') ?? forwarded
  return forwarded
}
