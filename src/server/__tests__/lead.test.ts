import { describe, it, expect } from 'vitest'
import { ContactLeadSchema, NewsletterSchema } from '../schema/validation'
import { leadRepo } from '../db/client'

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

  it('should accept a launch notification for a coming-soon product', () => {
    const result = NewsletterSchema.safeParse({
      email: 'ops@retailer.com',
      consent: true,
      product: 'pos',
    })
    expect(result.success).toBe(true)
  })

  it('should reject a launch notification for an unknown product', () => {
    const result = NewsletterSchema.safeParse({
      email: 'ops@retailer.com',
      consent: true,
      product: 'printer',
    })
    expect(result.success).toBe(false)
  })
})

describe('Lead Repository Persistence', () => {
  it('should create and retrieve new leads', async () => {
    const initialLeads = await leadRepo.getAllLeads()
    const initialCount = initialLeads.length

    const created = await leadRepo.createLead({
      name: 'Test Executive',
      email: 'test@signagenetwork.com',
      company: 'Test Signage Network',
      country: 'Singapore',
      message: 'Pilot testing lead repository storage',
      consent: true,
      products: ['Viewixsoft CMS'],
    })

    expect(created.id).toBeDefined()
    expect(created.name).toBe('Test Executive')

    const updatedLeads = await leadRepo.getAllLeads()
    expect(updatedLeads.length).toBe(initialCount + 1)
  })

  it('should update lead pipeline status and internal notes', async () => {
    const leads = await leadRepo.getAllLeads()
    const targetLead = leads[0]

    const updated = await leadRepo.updateLeadStatus(
      targetLead.id,
      'qualified',
      'Follow-up call completed with positive feedback.'
    )

    expect(updated).not.toBeNull()
    expect(updated?.status).toBe('qualified')
    expect(updated?.notes).toBe('Follow-up call completed with positive feedback.')
  })
})
