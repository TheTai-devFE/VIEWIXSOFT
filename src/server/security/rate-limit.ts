/**
 * Lead submission limits per rolling hour. Counted from the `leads` table, so
 * no extra service is needed; move to Cloudflare Rate Limiting if traffic grows.
 */
export const LEAD_LIMITS = {
  windowMs: 60 * 60 * 1000,
  perIp: 5,
  perEmail: 3,
} as const

export function isRateLimited(counts: { byIp: number; byEmail: number }) {
  return counts.byIp >= LEAD_LIMITS.perIp || counts.byEmail >= LEAD_LIMITS.perEmail
}
