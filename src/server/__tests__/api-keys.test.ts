import { describe, expect, it } from 'vitest'
import { bearerToken, CreateApiKeySchema } from '~/lib/api-keys'
import { generateApiKey, hashApiKey } from '~/server/api-keys/repository'

describe('API keys', () => {
  it('generates distinct prefixed keys with 256 bits of randomness', () => {
    const a = generateApiKey()
    const b = generateApiKey()
    expect(a).toMatch(/^vxs_[A-Za-z0-9_-]{43}$/)
    expect(a).not.toBe(b)
  })

  it('hashes a key the same way every time, never storing it as is', async () => {
    const key = generateApiKey()
    const hash = await hashApiKey(key)
    expect(hash).toMatch(/^[0-9a-f]{64}$/)
    expect(hash).toBe(await hashApiKey(key))
    expect(hash).not.toContain(key)
  })

  it('reads the bearer token', () => {
    expect(bearerToken('Bearer vxs_abc')).toBe('vxs_abc')
    expect(bearerToken('bearer vxs_abc')).toBe('vxs_abc')
    expect(bearerToken('Basic dXNlcjpwYXNz')).toBeNull()
    expect(bearerToken('Bearer a b')).toBeNull()
    expect(bearerToken(null)).toBeNull()
  })

  it('needs a name and at least one known scope', () => {
    expect(CreateApiKeySchema.safeParse({ name: 'SEO tool', scopes: ['schema:read'] }).success).toBe(true)
    expect(CreateApiKeySchema.safeParse({ name: ' ', scopes: ['schema:read'] }).success).toBe(false)
    expect(CreateApiKeySchema.safeParse({ name: 'SEO tool', scopes: [] }).success).toBe(false)
    expect(CreateApiKeySchema.safeParse({ name: 'SEO tool', scopes: ['admin:all'] }).success).toBe(false)
  })
})
