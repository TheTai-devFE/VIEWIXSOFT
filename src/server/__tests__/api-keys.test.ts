import { describe, expect, it } from 'vitest'
import { bearerToken, CreateApiKeySchema, effectiveScopes, scopesAllowed } from '~/lib/api-keys'
import type { Permission } from '~/lib/permissions'
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

describe('personal key scopes', () => {
  const member = (permissions: Permission[], banned = false) => ({ role: 'user' as const, permissions, banned })

  it('lets an account give only the Blog/Schema access it has', () => {
    expect(scopesAllowed({ role: 'admin', permissions: [] })).toEqual(['schema:read', 'schema:write', 'blog:write'])
    expect(scopesAllowed({ role: 'user', permissions: ['blog', 'api-keys'] })).toEqual(['blog:write'])
    expect(scopesAllowed({ role: 'user', permissions: ['schema'] })).toEqual(['schema:read', 'schema:write'])
    expect(scopesAllowed({ role: 'user', permissions: ['leads'] })).toEqual([])
  })

  it("cuts a key down to what its owner may do on each request", () => {
    const all = ['schema:read', 'schema:write', 'blog:write']
    expect(effectiveScopes(all, member(['api-keys', 'blog']))).toEqual(['blog:write'])
    expect(effectiveScopes(['blog:write'], member(['api-keys', 'schema']))).toEqual([])
    expect(effectiveScopes(all, { role: 'admin', permissions: [], banned: false })).toEqual(all)
  })

  it('stops a key whose owner is locked, deleted or lost the api-keys permission', () => {
    expect(effectiveScopes(['blog:write'], member(['api-keys', 'blog'], true))).toEqual([])
    expect(effectiveScopes(['blog:write'], null)).toEqual([])
    expect(effectiveScopes(['blog:write'], member(['blog']))).toEqual([])
  })
})
