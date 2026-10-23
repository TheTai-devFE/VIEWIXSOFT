import { describe, expect, it } from 'vitest'
import { pickClientIp } from '../security/client-ip'

function headers(values: Record<string, string>) {
  return (name: string) => values[name]
}

describe('pickClientIp', () => {
  it('trusts cf-connecting-ip on Cloudflare', () => {
    const get = headers({ 'cf-connecting-ip': '203.0.113.7', 'x-forwarded-for': '198.51.100.1' })
    expect(pickClientIp(get, 'cloudflare')).toBe('203.0.113.7')
  })

  it('ignores a client-sent cf-connecting-ip on Vercel', () => {
    const get = headers({ 'cf-connecting-ip': '1.2.3.4', 'x-forwarded-for': '203.0.113.7' })
    expect(pickClientIp(get, 'vercel')).toBe('203.0.113.7')
  })

  it('takes the first X-Forwarded-For entry', () => {
    const get = headers({ 'x-forwarded-for': '203.0.113.7, 10.0.0.1' })
    expect(pickClientIp(get, 'vercel')).toBe('203.0.113.7')
  })

  it('returns undefined without headers', () => {
    expect(pickClientIp(headers({}), 'vercel')).toBeUndefined()
  })
})
