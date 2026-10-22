import type { Env } from '~/server/env'

export interface ServiceStatus {
  key: 'database' | 'auth' | 'storage' | 'email' | 'captcha'
  label: string
  ok: boolean
  /** What the admin sees when it isn't configured. Never includes a value. */
  hint: string
}

/** Which services are configured. Reports presence only, never values. */
export function systemStatus(env: Env): ServiceStatus[] {
  const r2 = Boolean(env.R2_ACCOUNT_ID && env.R2_ACCESS_KEY_ID && env.R2_SECRET_ACCESS_KEY && env.R2_BUCKET && env.R2_PUBLIC_URL)
  return [
    { key: 'database', label: 'Database (Neon)', ok: Boolean(env.DATABASE_URL), hint: 'Set DATABASE_URL.' },
    {
      key: 'auth',
      label: 'Admin sign-in secret',
      ok: Boolean(env.BETTER_AUTH_SECRET && env.IP_HASH_SALT),
      hint: 'Set BETTER_AUTH_SECRET and IP_HASH_SALT. Development uses built-in placeholders.',
    },
    {
      key: 'storage',
      label: 'Image storage (Cloudflare R2)',
      ok: r2,
      hint: 'Set the five R2_* variables. Without them, development saves uploads to .data/.',
    },
    { key: 'email', label: 'Email (Resend)', ok: Boolean(env.RESEND_API_KEY), hint: 'Set RESEND_API_KEY. Emails are only logged.' },
    {
      key: 'captcha',
      label: 'Spam protection (Turnstile)',
      ok: Boolean(env.TURNSTILE_SECRET_KEY),
      hint: 'Set TURNSTILE_SECRET_KEY and VITE_PUBLIC_TURNSTILE_SITE_KEY. Forms skip the check in development.',
    },
  ]
}
