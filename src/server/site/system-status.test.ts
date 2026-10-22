import { describe, expect, it } from 'vitest'
import type { Env } from '~/server/env'
import { systemStatus } from './system-status'

const base: Env = {
  NODE_ENV: 'development',
  SITE_URL: 'http://localhost:3000',
  EMAIL_FROM: 'a@b.c',
  SALES_NOTIFICATION_EMAIL: 'a@b.c',
  DATABASE_URL: undefined,
  BETTER_AUTH_SECRET: undefined,
  BETTER_AUTH_URL: undefined,
  IP_HASH_SALT: undefined,
  TURNSTILE_SECRET_KEY: undefined,
  RESEND_API_KEY: undefined,
  R2_ACCOUNT_ID: undefined,
  R2_ACCESS_KEY_ID: undefined,
  R2_SECRET_ACCESS_KEY: undefined,
  R2_BUCKET: undefined,
  R2_PUBLIC_URL: undefined,
}

describe('systemStatus', () => {
  it('flags every service as missing on a bare environment', () => {
    expect(systemStatus(base).every((s) => !s.ok)).toBe(true)
  })

  it('needs all five R2 variables for storage', () => {
    const partial = systemStatus({ ...base, R2_ACCOUNT_ID: 'x', R2_BUCKET: 'b' })
    expect(partial.find((s) => s.key === 'storage')?.ok).toBe(false)
    const full = systemStatus({
      ...base,
      R2_ACCOUNT_ID: 'x',
      R2_ACCESS_KEY_ID: 'k',
      R2_SECRET_ACCESS_KEY: 's',
      R2_BUCKET: 'b',
      R2_PUBLIC_URL: 'https://pub.example',
    })
    expect(full.find((s) => s.key === 'storage')?.ok).toBe(true)
  })

  it('never exposes a configured value', () => {
    const secret = 'super-secret-value-123'
    const out = JSON.stringify(systemStatus({ ...base, DATABASE_URL: secret, RESEND_API_KEY: secret }))
    expect(out).not.toContain(secret)
  })
})
