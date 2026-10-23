import { z } from 'zod'

export const ContactLeadSchema = z.object({
  type: z.enum(['contact', 'demo']).default('demo'),
  name: z.string().trim().min(2, 'Full name must be at least 2 characters').max(120),
  email: z.string().trim().toLowerCase().email('Please enter a valid work email address').max(254),
  company: z.string().trim().min(2, 'Company name is required').max(160),
  jobTitle: z.string().trim().max(120).optional(),
  country: z.string().trim().min(2, 'Please select your country').max(80),
  phone: z.string().trim().max(40).optional(),
  companySize: z.string().max(60).optional(),
  screenCount: z.string().max(60).optional(),
  products: z.array(z.string().max(60)).max(8).default([]),
  message: z.string().trim().min(5, 'Please provide details about your screen network or requirements').max(5000),
  consent: z.boolean().refine((val) => val === true, {
    message: 'You must consent to the privacy policy to submit',
  }),
  // Security honeypot & turnstile
  // Accepted here and checked in the pipeline, so a bot gets a normal-looking reply.
  honeypot: z.string().max(500).optional(),
  turnstileToken: z.string().max(4096).optional(),
  // Tracking
  utmSource: z.string().max(200).optional(),
  utmMedium: z.string().max(200).optional(),
  utmCampaign: z.string().max(200).optional(),
  utmTerm: z.string().max(200).optional(),
  utmContent: z.string().max(200).optional(),
  referrer: z.string().max(500).optional(),
  landingPage: z.string().max(500).optional(),
})

export type ContactLeadInput = z.infer<typeof ContactLeadSchema>
export type LeadInput = ContactLeadInput

/** Product slugs a visitor can ask to be notified about. */
export const PRODUCT_SLUGS = ['cms', 'pos', 'tracking', 'nfc'] as const

export const NewsletterSchema = z.object({
  email: z.string().trim().toLowerCase().email('Please enter a valid email address').max(254),
  honeypot: z.string().max(500).optional(),
  turnstileToken: z.string().max(4096).optional(),
  /** Set when the sign-up asks for a product's launch news rather than the newsletter. */
  product: z.enum(PRODUCT_SLUGS).optional(),
  consent: z.boolean().refine((val) => val === true, {
    message: 'Consent is required',
  }),
})

export type NewsletterInput = z.infer<typeof NewsletterSchema>
