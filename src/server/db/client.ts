import type { Lead, NewLead } from './schema'

// In-memory / file fallback store for development
class LeadRepository {
  private leads: Lead[] = [
    {
      id: 'e1a3b5c7-8901-4def-a234-56789abcdef0',
      type: 'demo',
      name: 'Marcus Vance',
      email: 'm.vance@aurabrands.com',
      company: 'Aura Fashion Brands',
      jobTitle: 'VP of Global Retail Operations',
      country: 'United States',
      phone: '+1 415 555 2671',
      companySize: '500-1000 employees',
      screenCount: '201 – 1,000 Screens',
      products: ['Viewixsoft CMS', 'Viewixsoft NFC'],
      message: 'Looking to replace USB updates across 450 stores with automated cloud playlist scheduling and NFC shelf tags.',
      consent: true,
      consentAt: new Date('2026-10-12T09:30:00Z'),
      utmSource: 'google',
      utmMedium: 'cpc',
      utmCampaign: 'enterprise-signage-q4',
      utmTerm: 'cloud digital signage software',
      utmContent: 'b2b-hero-cta',
      referrer: 'https://google.com/search?q=digital+signage+software',
      landingPage: '/',
      ipHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      status: 'qualified',
      notes: 'Demo scheduled for Friday 2 PM EST. Interested in bulk 450-store license.',
      createdAt: new Date('2026-10-12T09:30:00Z'),
      updatedAt: new Date('2026-10-13T14:15:00Z'),
    },
    {
      id: 'f2b4c6d8-9012-4efa-b345-67890bcdef12',
      type: 'contact',
      name: 'Elena Gomez',
      email: 'elena.gomez@burgercraft.net',
      company: 'BurgerCraft International',
      jobTitle: 'Chief Technology Officer',
      country: 'United Kingdom',
      phone: '+44 20 7946 0912',
      companySize: '1000+ employees',
      screenCount: '1,000+ Enterprise Fleet',
      products: ['Viewixsoft POS', 'Viewixsoft CMS'],
      message: 'Need POS synchronization for 600 drive-thru digital menu boards with sub-250ms item 86-ing.',
      consent: true,
      consentAt: new Date('2026-10-14T11:20:00Z'),
      utmSource: 'linkedin',
      utmMedium: 'social',
      utmCampaign: 'qsr-pos-sync',
      utmTerm: null,
      utmContent: null,
      referrer: 'https://linkedin.com/feed',
      landingPage: '/products/pos',
      ipHash: 'a89c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b771',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      status: 'contacted',
      notes: 'Sent technical whitepaper on POS webhook architecture.',
      createdAt: new Date('2026-10-14T11:20:00Z'),
      updatedAt: new Date('2026-10-14T15:00:00Z'),
    },
    {
      id: 'a3c5d7e9-0123-4fab-c456-78901cdef234',
      type: 'demo',
      name: 'Craig Henderson',
      email: 'craig@apexmediaooh.com',
      company: 'Apex Media Out-of-Home',
      jobTitle: 'Managing Director',
      country: 'Australia',
      phone: '+61 2 9374 4000',
      companySize: '200-500 employees',
      screenCount: '1,000+ Enterprise Fleet',
      products: ['Viewixsoft Tracking', 'Viewixsoft CMS'],
      message: 'Managing 15,000 roadside LED billboards. Require certified cryptographic proof-of-play for agency media audits.',
      consent: true,
      consentAt: new Date('2026-10-15T08:10:00Z'),
      utmSource: 'perplexity',
      utmMedium: 'referral',
      utmCampaign: 'geo-citation',
      utmTerm: 'proof of play digital billboards',
      utmContent: null,
      referrer: 'https://perplexity.ai/search',
      landingPage: '/products/tracking',
      ipHash: 'b71c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b992',
      userAgent: 'Mozilla/5.0 (X11; Linux x86_64)',
      status: 'new',
      notes: null,
      createdAt: new Date('2026-10-15T08:10:00Z'),
      updatedAt: new Date('2026-10-15T08:10:00Z'),
    }
  ]

  async getAllLeads(): Promise<Lead[]> {
    return [...this.leads].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  }

  async createLead(input: Omit<NewLead, 'id' | 'createdAt' | 'updatedAt' | 'status'> & { status?: string }): Promise<Lead> {
    const newLead: Lead = {
      id: crypto.randomUUID(),
      type: input.type || 'demo',
      name: input.name,
      email: input.email,
      company: input.company,
      jobTitle: input.jobTitle || null,
      country: input.country,
      phone: input.phone || null,
      companySize: input.companySize || null,
      screenCount: input.screenCount || null,
      products: input.products || [],
      message: input.message,
      consent: input.consent ?? true,
      consentAt: input.consentAt || new Date(),
      utmSource: input.utmSource || null,
      utmMedium: input.utmMedium || null,
      utmCampaign: input.utmCampaign || null,
      utmTerm: input.utmTerm || null,
      utmContent: input.utmContent || null,
      referrer: input.referrer || null,
      landingPage: input.landingPage || null,
      ipHash: input.ipHash || null,
      userAgent: input.userAgent || null,
      status: input.status || 'new',
      notes: input.notes || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    this.leads.unshift(newLead)
    return newLead
  }

  async updateLeadStatus(id: string, status: string, notes?: string): Promise<Lead | null> {
    const lead = this.leads.find((l) => l.id === id)
    if (!lead) return null
    lead.status = status
    if (notes !== undefined) {
      lead.notes = notes
    }
    lead.updatedAt = new Date()
    return lead
  }
}

export const leadRepo = new LeadRepository()
