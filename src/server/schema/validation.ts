import { z } from 'zod'

export const ContactLeadSchema = z.object({
  type: z.enum(['contact', 'demo', 'newsletter']).default('demo'),
  name: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Please enter a valid work email address'),
  company: z.string().min(2, 'Company name is required'),
  jobTitle: z.string().optional(),
  country: z.string().min(2, 'Please select your country'),
  phone: z.string().optional(),
  companySize: z.string().optional(),
  screenCount: z.string().optional(),
  products: z.array(z.string()).min(1, 'Please select at least one product of interest'),
  message: z.string().min(5, 'Please provide details about your screen network or requirements'),
  consent: z.boolean().refine((val) => val === true, {
    message: 'You must consent to the privacy policy to submit',
  }),
  // Security honeypot & turnstile
  honeypot: z.string().max(0, 'Spam detected').optional().or(z.literal('')),
  turnstileToken: z.string().optional(),
  // Tracking
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional(),
  utmTerm: z.string().optional(),
  utmContent: z.string().optional(),
  referrer: z.string().optional(),
  landingPage: z.string().optional(),
})

export type ContactLeadInput = z.infer<typeof ContactLeadSchema>

/** Product slugs a visitor can ask to be notified about. */
export const PRODUCT_SLUGS = ['cms', 'pos', 'tracking', 'nfc'] as const

export const NewsletterSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  /** Set when the sign-up asks for a product's launch news rather than the newsletter. */
  product: z.enum(PRODUCT_SLUGS).optional(),
  consent: z.boolean().refine((val) => val === true, {
    message: 'Consent is required',
  }),
})

export type NewsletterInput = z.infer<typeof NewsletterSchema>
