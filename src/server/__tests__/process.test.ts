import { describe, expect, it, vi } from 'vitest'
import { processLead, processNewsletter } from '../leads/process'
import type { LeadDeps, NewsletterDeps } from '../leads/process'

const NOW = new Date('2026-10-22T10:00:00Z')
const ctx = { ip: '203.0.113.7', userAgent: 'test', now: NOW }

const validLead = {
  type: 'demo',
  name: 'Ana Silva',
  email: 'Ana@Example.com',
  company: 'Example Retail',
  country: 'Portugal',
  products: ['Viewixsoft CMS'],
  message: 'We run 40 screens in 8 stores.',
  consent: true,
  turnstileToken: 'token',
}

function leadDeps(overrides: Partial<LeadDeps> = {}): LeadDeps {
  return {
    verifyCaptcha: vi.fn(async () => true),
    hashIp: vi.fn(async (ip: string) => `hash:${ip}`),
    countRecent: vi.fn(async () => ({ byIp: 0, byEmail: 0 })),
    insertLead: vi.fn(async () => ({ id: 'lead-1' })),
    notify: vi.fn(async () => undefined),
    onEmailError: vi.fn(),
    onSaveError: vi.fn(),
    ...overrides,
  }
}

describe('processLead', () => {
  it('stores a valid lead with a hashed IP and consent time, then emails', async () => {
    const deps = leadDeps()
    const result = await processLead(validLead, ctx, deps)
    expect(result.ok).toBe(true)
    expect(deps.insertLead).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'ana@example.com', ipHash: 'hash:203.0.113.7', consentAt: NOW }),
    )
    expect(deps.notify).toHaveBeenCalledOnce()
  })

  it('never passes the raw IP to storage', async () => {
    const deps = leadDeps()
    await processLead(validLead, ctx, deps)
    const stored = JSON.stringify(vi.mocked(deps.insertLead).mock.calls[0]?.[0])
    expect(stored).not.toContain('"203.0.113.7"')
  })

  it('rejects invalid input with field errors and stores nothing', async () => {
    const deps = leadDeps()
    const result = await processLead({ ...validLead, email: 'nope', consent: false }, ctx, deps)
    expect(result).toMatchObject({ ok: false, error: 'validation' })
    if (!result.ok) expect(Object.keys(result.fieldErrors ?? {})).toEqual(expect.arrayContaining(['email', 'consent']))
    expect(deps.insertLead).not.toHaveBeenCalled()
  })

  it('rejects a failed Turnstile check', async () => {
    const deps = leadDeps({ verifyCaptcha: vi.fn(async () => false) })
    const result = await processLead(validLead, ctx, deps)
    expect(result).toMatchObject({ ok: false, error: 'captcha' })
    expect(deps.insertLead).not.toHaveBeenCalled()
  })

  it('answers a filled honeypot like a success but stores nothing', async () => {
    const deps = leadDeps()
    const result = await processLead({ ...validLead, honeypot: 'https://spam.example' }, ctx, deps)
    expect(result.ok).toBe(true)
    expect(deps.insertLead).not.toHaveBeenCalled()
    expect(deps.notify).not.toHaveBeenCalled()
  })

  it.each([
    { byIp: 5, byEmail: 0 },
    { byIp: 0, byEmail: 3 },
  ])('rate-limits at %o', async (counts) => {
    const deps = leadDeps({ countRecent: vi.fn(async () => counts) })
    const result = await processLead(validLead, ctx, deps)
    expect(result).toMatchObject({ ok: false, error: 'rate_limited' })
    expect(deps.insertLead).not.toHaveBeenCalled()
  })

  it('counts the last hour only', async () => {
    const deps = leadDeps()
    await processLead(validLead, ctx, deps)
    expect(deps.countRecent).toHaveBeenCalledWith(
      expect.objectContaining({ since: new Date('2026-10-22T09:00:00Z'), email: 'ana@example.com' }),
    )
  })

  it('keeps the lead when email sending fails', async () => {
    const deps = leadDeps({ notify: vi.fn(async () => Promise.reject(new Error('resend down'))) })
    const result = await processLead(validLead, ctx, deps)
    expect(result.ok).toBe(true)
    expect(deps.insertLead).toHaveBeenCalledOnce()
    expect(deps.onEmailError).toHaveBeenCalledOnce()
  })

  it('returns a server error without details when storage fails', async () => {
    const deps = leadDeps({ insertLead: vi.fn(async () => Promise.reject(new Error('relation "leads" does not exist'))) })
    const result = await processLead(validLead, ctx, deps)
    expect(result).toMatchObject({ ok: false, error: 'server' })
    expect(JSON.stringify(result)).not.toContain('relation')
    // Hidden from the visitor, but reported so the server can log it.
    expect(deps.onSaveError).toHaveBeenCalledWith(expect.any(Error))
  })
})

function newsletterDeps(overrides: Partial<NewsletterDeps> = {}): NewsletterDeps {
  return {
    verifyCaptcha: vi.fn(async () => true),
    upsertSubscriber: vi.fn(async () => ({ needsConfirmation: true })),
    sendConfirmation: vi.fn(async () => undefined),
    onEmailError: vi.fn(),
    onSaveError: vi.fn(),
    ...overrides,
  }
}

describe('processNewsletter', () => {
  const valid = { email: 'ops@example.com', consent: true, topics: ['pos'] }

  it('stores a pending subscriber and sends a confirmation email', async () => {
    const deps = newsletterDeps()
    const result = await processNewsletter(valid, ctx, deps)
    expect(result.ok).toBe(true)
    expect(deps.upsertSubscriber).toHaveBeenCalledWith({ email: 'ops@example.com', topics: ['pos'], consentAt: NOW })
    expect(deps.sendConfirmation).toHaveBeenCalledWith('ops@example.com', ['pos'])
  })

  it('signs up for the newsletter when no topic is picked', async () => {
    const deps = newsletterDeps()
    await processNewsletter({ email: 'ops@example.com', consent: true }, ctx, deps)
    expect(deps.upsertSubscriber).toHaveBeenCalledWith({ email: 'ops@example.com', topics: ['newsletter'], consentAt: NOW })
  })

  it('does not resend confirmation to an active subscriber', async () => {
    const deps = newsletterDeps({ upsertSubscriber: vi.fn(async () => ({ needsConfirmation: false })) })
    await processNewsletter(valid, ctx, deps)
    expect(deps.sendConfirmation).not.toHaveBeenCalled()
  })

  it('requires consent', async () => {
    const deps = newsletterDeps()
    const result = await processNewsletter({ ...valid, consent: false }, ctx, deps)
    expect(result).toMatchObject({ ok: false, error: 'validation' })
    expect(deps.upsertSubscriber).not.toHaveBeenCalled()
  })

  it('rejects a failed Turnstile check', async () => {
    const deps = newsletterDeps({ verifyCaptcha: vi.fn(async () => false) })
    expect(await processNewsletter(valid, ctx, deps)).toMatchObject({ ok: false, error: 'captcha' })
  })

  it('reports a database failure and returns a generic error', async () => {
    const deps = newsletterDeps({ upsertSubscriber: vi.fn(async () => Promise.reject(new Error('malformed array literal'))) })
    const result = await processNewsletter(valid, ctx, deps)
    expect(result).toMatchObject({ ok: false, error: 'server' })
    expect(JSON.stringify(result)).not.toContain('malformed')
    expect(deps.onSaveError).toHaveBeenCalledWith(expect.any(Error))
  })

  it('drops honeypot submissions silently', async () => {
    const deps = newsletterDeps()
    const result = await processNewsletter({ ...valid, honeypot: 'x' }, ctx, deps)
    expect(result.ok).toBe(true)
    expect(deps.upsertSubscriber).not.toHaveBeenCalled()
  })
})
