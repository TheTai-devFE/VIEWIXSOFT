import { describe, it, expect } from 'vitest'
import { ContactLeadSchema, NewsletterSchema } from '../schema/validation'

describe('Lead Capture Validation', () => {
  it('should accept valid enterprise demo lead input', () => {
    const validData = {
      type: 'demo' as const,
      name: 'Elena Gomez',
      email: 'elena@burgercraft.net',
      company: 'BurgerCraft International',
      country: 'United States',
      products: ['Viewixsoft POS', 'Viewixsoft CMS'],
      message: 'Need 250ms menu sync for 600 drive-thru stores.',
      consent: true,
      screenCount: '201 – 1,000 Screens',
    }

    const result = ContactLeadSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it('should accept a lead without products of interest', () => {
    const result = ContactLeadSchema.safeParse({
      type: 'demo' as const,
      name: 'Elena Gomez',
      email: 'elena@burgercraft.net',
      company: 'BurgerCraft International',
      country: 'United States',
      message: 'We run 40 menu boards.',
      consent: true,
    })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.products).toEqual([])
  })

  it('should reject invalid work email addresses', () => {
    const invalidData = {
      type: 'demo' as const,
      name: 'John Doe',
      email: 'not-an-email',
      company: 'Acme Corp',
      country: 'United States',
      products: ['Viewixsoft CMS'],
      message: 'Testing email validation',
      consent: true,
    }

    const result = ContactLeadSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('email')
    }
  })

  it('should reject submission if consent is false', () => {
    const nonConsented = {
      type: 'demo' as const,
      name: 'John Doe',
      email: 'john@acme.com',
      company: 'Acme Corp',
      country: 'United States',
      products: ['Viewixsoft CMS'],
      message: 'Testing consent validation',
      consent: false,
    }

    const result = ContactLeadSchema.safeParse(nonConsented)
    expect(result.success).toBe(false)
  })

  it('should accept valid newsletter subscription', () => {
    const result = NewsletterSchema.safeParse({
      email: 'subscriber@company.com',
      consent: true,
    })
    expect(result.success).toBe(true)
  })

  it('should accept product launch topics alongside the newsletter', () => {
    const result = NewsletterSchema.safeParse({
      email: 'ops@retailer.com',
      consent: true,
      topics: ['newsletter', 'pos'],
    })
    expect(result.success).toBe(true)
  })

  it('should reject an unknown topic', () => {
    const result = NewsletterSchema.safeParse({
      email: 'ops@retailer.com',
      consent: true,
      topics: ['printer'],
    })
    expect(result.success).toBe(false)
  })

  it('should treat a sign-up without topics as the newsletter', () => {
    const result = NewsletterSchema.parse({ email: 'ops@retailer.com', consent: true })
    expect(result.topics).toEqual(['newsletter'])
  })

  it('should drop repeated topics', () => {
    const result = NewsletterSchema.parse({ email: 'ops@retailer.com', consent: true, topics: ['pos', 'pos', 'nfc'] })
    expect(result.topics).toEqual(['pos', 'nfc'])
  })
})
