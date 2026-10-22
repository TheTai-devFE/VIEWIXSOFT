import '@tanstack/react-start/server-only'
import { z } from 'zod'

/**
 * Server environment, validated with Zod. Read it through `getEnv()` inside a
 * request: on Cloudflare Workers the variables only exist during a request.
 * Optional groups switch a feature off in local development instead of failing
 * (no Turnstile key → verification skipped, no Resend key → emails logged).
 */
const optional = z
  .string()
  .optional()
  .transform((v) => (v && v.trim() !== '' ? v : undefined))

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  SITE_URL: z.string().url().default('https://viewixsoft.com'),

  DATABASE_URL: optional,

  BETTER_AUTH_SECRET: optional,
  BETTER_AUTH_URL: optional,

  /** Salt for hashing visitor IPs. Rotate only with care: it breaks rate-limit history. */
  IP_HASH_SALT: optional,

  TURNSTILE_SECRET_KEY: optional,

  RESEND_API_KEY: optional,
  EMAIL_FROM: z.string().default('Viewixsoft <hello@viewixsoft.com>'),
  SALES_NOTIFICATION_EMAIL: z.string().email().default('sales@viewix.hk'),

  R2_ACCOUNT_ID: optional,
  R2_ACCESS_KEY_ID: optional,
  R2_SECRET_ACCESS_KEY: optional,
  R2_BUCKET: optional,
  /** Public base URL of the bucket, e.g. https://media.viewixsoft.com (no trailing slash). */
  R2_PUBLIC_URL: optional,
})

export type Env = z.infer<typeof EnvSchema>

export function getEnv(): Env {
  const parsed = EnvSchema.safeParse(process.env)
  if (!parsed.success) {
    const fields = parsed.error.issues.map((i) => i.path.join('.')).join(', ')
    throw new Error(`Invalid environment variables: ${fields}`)
  }
  return parsed.data
}

type SecretKey = 'DATABASE_URL' | 'BETTER_AUTH_SECRET' | 'IP_HASH_SALT' | 'TURNSTILE_SECRET_KEY'

const DEV_FALLBACKS: Record<Exclude<SecretKey, 'DATABASE_URL' | 'TURNSTILE_SECRET_KEY'>, string> = {
  BETTER_AUTH_SECRET: 'dev-only-secret-change-me-dev-only-secret',
  IP_HASH_SALT: 'dev-only-salt',
}

/**
 * A secret a feature can't run safely without. Production fails closed: the
 * feature (forms, admin sign-in) errors while public pages keep working.
 * Development gets a fixed placeholder so the app runs without setup.
 */
export function requireSecret(key: Exclude<SecretKey, 'DATABASE_URL' | 'TURNSTILE_SECRET_KEY'>): string {
  const env = getEnv()
  const value = env[key]
  if (value) return value
  if (env.NODE_ENV === 'production') throw new Error(`${key} is not set`)
  return DEV_FALLBACKS[key]
}

export function isProduction() {
  return getEnv().NODE_ENV === 'production'
}
