import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { PRODUCTS } from '~/content/products'
import { sendEmail } from '~/server/email/send'
import { leadConfirmationEmail, newsletterConfirmEmail, salesNotificationEmail } from '~/server/email/templates'
import { getEnv, requireSecret } from '~/server/env'
import { confirmSubscriber, countRecentLeads, insertLead, upsertSubscriber } from '~/server/leads/repository'
import { processLead, processNewsletter } from '~/server/leads/process'
import type { SubmitResult } from '~/server/leads/process'
import { errorFields, logger } from '~/server/logger'
import { hashIp, signToken, verifyToken } from '~/server/security/crypto'
import { getClientIp, getUserAgent } from '~/server/security/request'
import { verifyTurnstile } from '~/server/security/turnstile'

const NEWSLETTER_PURPOSE = 'newsletter-confirm'

function context() {
  return { ip: getClientIp(), userAgent: getUserAgent(), now: new Date() }
}

// Input is validated inside the pipeline with the shared Zod schema, so the
// result can carry field errors instead of throwing.
export const submitLeadFn = createServerFn({ method: 'POST' })
  .validator((data: unknown) => data)
  .handler(async ({ data }): Promise<SubmitResult> => {
    const env = getEnv()
    const production = env.NODE_ENV === 'production'
    const result = await processLead(data, context(), {
      verifyCaptcha: (token, ip) => verifyTurnstile(token, ip, env.TURNSTILE_SECRET_KEY, production),
      hashIp: (ip) => hashIp(ip, requireSecret('IP_HASH_SALT')),
      countRecent: countRecentLeads,
      insertLead,
      notify: async (lead, id) => {
        const sales = salesNotificationEmail(lead, { adminUrl: `${env.SITE_URL}/admin/leads?lead=${id}` })
        const visitor = leadConfirmationEmail(lead)
        await Promise.all([
          sendEmail({ to: env.SALES_NOTIFICATION_EMAIL, replyTo: lead.email, tag: 'lead.sales', ...sales }),
          sendEmail({ to: lead.email, replyTo: env.SALES_NOTIFICATION_EMAIL, tag: 'lead.confirmation', ...visitor }),
        ])
      },
      onEmailError: (error) => logger.error('lead.email_failed', errorFields(error)),
      onSaveError: (error) => logger.error('lead.save_failed', errorFields(error)),
    })
    logger.info('lead.submitted', { ok: result.ok, error: result.ok ? undefined : result.error })
    return result
  })

export const subscribeNewsletterFn = createServerFn({ method: 'POST' })
  .validator((data: unknown) => data)
  .handler(async ({ data }): Promise<SubmitResult> => {
    const env = getEnv()
    const result = await processNewsletter(data, context(), {
      verifyCaptcha: (token, ip) => verifyTurnstile(token, ip, env.TURNSTILE_SECRET_KEY, env.NODE_ENV === 'production'),
      upsertSubscriber,
      sendConfirmation: async (email, topics) => {
        const token = await signToken(requireSecret('BETTER_AUTH_SECRET'), NEWSLETTER_PURPOSE, email)
        const url = `${env.SITE_URL}/newsletter/confirm?email=${encodeURIComponent(email)}&token=${token}`
        const productNames = PRODUCTS.filter((p) => topics.some((t) => t === p.slug)).map((p) => p.name)
        const content = newsletterConfirmEmail(url, { newsletter: topics.includes('newsletter'), productNames })
        await sendEmail({ to: email, tag: 'newsletter.confirm', ...content })
      },
      onEmailError: (error) => logger.error('newsletter.email_failed', errorFields(error)),
      onSaveError: (error) => logger.error('newsletter.save_failed', errorFields(error)),
    })
    logger.info('newsletter.submitted', { ok: result.ok, error: result.ok ? undefined : result.error })
    return result
  })

const ConfirmSchema = z.object({ email: z.string().email().max(254), token: z.string().min(10).max(200) })

export const confirmNewsletterFn = createServerFn({ method: 'POST' })
  .validator((data: unknown) => ConfirmSchema.parse(data))
  .handler(async ({ data }) => {
    try {
      const valid = await verifyToken(requireSecret('BETTER_AUTH_SECRET'), NEWSLETTER_PURPOSE, data.email, data.token)
      if (!valid) return { ok: false as const }
      return { ok: await confirmSubscriber(data.email) }
    } catch (error) {
      logger.error('newsletter.confirm_failed', errorFields(error))
      return { ok: false as const }
    }
  })
