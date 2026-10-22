import { createServerFn } from '@tanstack/react-start'
import { ContactLeadSchema, NewsletterSchema } from '~/server/schema/validation'
import { leadRepo } from '~/server/db/client'

// Helper to hash IP for GDPR compliance
function hashIp(ip: string): string {
  let hash = 0
  for (let i = 0; i < ip.length; i++) {
    const char = ip.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash |= 0
  }
  return 'ip_' + Math.abs(hash).toString(16)
}

export const submitLeadFn = createServerFn({ method: 'POST' })
  .validator((data: unknown) => ContactLeadSchema.parse(data))
  .handler(async ({ data }) => {
    // 1. Anti-spam honeypot check
    if (data.honeypot && data.honeypot.trim().length > 0) {
      console.warn('[Anti-Spam] Honeypot triggered, dropping submission quietly.')
      return { success: true, message: 'Your request has been received.' }
    }

    // 2. Anonymize IP
    const clientIp = '127.0.0.1' // Server-side extracted IP in production
    const ipHash = hashIp(clientIp)

    // 3. Save lead to repository
    const lead = await leadRepo.createLead({
      type: data.type,
      name: data.name,
      email: data.email,
      company: data.company,
      jobTitle: data.jobTitle,
      country: data.country,
      phone: data.phone,
      companySize: data.companySize,
      screenCount: data.screenCount,
      products: data.products,
      message: data.message,
      consent: data.consent,
      utmSource: data.utmSource,
      utmMedium: data.utmMedium,
      utmCampaign: data.utmCampaign,
      utmTerm: data.utmTerm,
      utmContent: data.utmContent,
      referrer: data.referrer,
      landingPage: data.landingPage,
      ipHash,
      userAgent: 'Web Client',
      status: 'new',
    })

    // 4. Trigger Email notification (Mock/Console log for Resend in dev)
    console.info('[Email Notification - Resend Mock]')
    console.info(`-> To Sales (sales@viewixsoft.com): New Lead from ${lead.name} (${lead.company}) — ${lead.products?.join(', ')}`)
    console.info(`-> To User (${lead.email}): Thank you for requesting a Viewixsoft demo. Our team will contact you within 2 hours.`)

    return {
      success: true,
      leadId: lead.id,
      message: 'Thank you! Your demo request has been received. Our solutions team will reach out within 2 hours.',
    }
  })

export const subscribeNewsletterFn = createServerFn({ method: 'POST' })
  .validator((data: unknown) => NewsletterSchema.parse(data))
  .handler(async ({ data }) => {
    await leadRepo.createLead({
      type: 'newsletter',
      name: 'Newsletter Subscriber',
      email: data.email,
      company: 'N/A',
      country: 'Global',
      message: data.product ? `Launch notification: ${data.product}` : 'Newsletter subscription',
      consent: data.consent,
      status: 'new',
      products: data.product ? [data.product] : [],
    })

    // No email address in logs (PII).
    console.info(`[Newsletter] New ${data.product ? `launch notification (${data.product})` : 'subscriber'}`)
    return {
      success: true,
      message: data.product
        ? 'Thanks. We will email you when it launches.'
        : 'You have been subscribed to Viewixsoft updates.',
    }
  })
