import { ContactLeadSchema, NewsletterSchema } from '~/server/schema/validation'
import type { LeadInput, NewsletterInput, NewsletterTopic } from '~/server/schema/validation'
import { isRateLimited, LEAD_LIMITS } from '~/server/security/rate-limit'

/*
 * Lead and newsletter pipelines as plain functions. Every side effect comes in
 * through `deps`, so tests cover each path without a database or network, and
 * the server functions in ~/server/functions/leads.ts only wire real deps in.
 */

export type SubmitError = 'validation' | 'captcha' | 'rate_limited' | 'server'
export type SubmitResult =
  | { ok: true; message: string }
  | { ok: false; error: SubmitError; message: string; fieldErrors?: Record<string, string> }

export interface RequestContext {
  ip?: string
  userAgent?: string
  now: Date
}

export interface LeadDeps {
  verifyCaptcha: (token: string | undefined, ip: string | undefined) => Promise<boolean>
  hashIp: (ip: string) => Promise<string>
  countRecent: (q: { ipHash?: string; email: string; since: Date }) => Promise<{ byIp: number; byEmail: number }>
  insertLead: (lead: LeadInput & { ipHash?: string; userAgent?: string; consentAt: Date }) => Promise<{ id: string }>
  notify: (lead: LeadInput, id: string) => Promise<void>
  onEmailError: (error: unknown) => void
  /** Storage failed; the visitor only sees a generic message, so this is where it gets logged. */
  onSaveError: (error: unknown) => void
}

const MESSAGES = {
  lead: 'Thanks. We received your request and will email you to book a time.',
  validation: 'Please check the highlighted fields.',
  captcha: 'We could not verify that you are human. Please try again.',
  rateLimited: 'You have sent several requests recently. Please try again in an hour or email us directly.',
  server: 'Something went wrong on our side. Please try again or email us directly.',
}

function fieldErrors(error: { issues: readonly { path: readonly PropertyKey[]; message: string }[] }) {
  const out: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = issue.path.map(String).join('.')
    if (key && !out[key]) out[key] = issue.message
  }
  return out
}

export async function processLead(raw: unknown, ctx: RequestContext, deps: LeadDeps): Promise<SubmitResult> {
  // 1. Validate on the server with the same schema the form uses.
  const parsed = ContactLeadSchema.safeParse(raw)
  if (!parsed.success) {
    return { ok: false, error: 'validation', message: MESSAGES.validation, fieldErrors: fieldErrors(parsed.error) }
  }
  const lead = parsed.data

  // 2. Turnstile.
  if (!(await deps.verifyCaptcha(lead.turnstileToken, ctx.ip))) {
    return { ok: false, error: 'captcha', message: MESSAGES.captcha }
  }

  // 3. Honeypot: answer like a success so the bot learns nothing, but store nothing.
  if (lead.honeypot && lead.honeypot.trim() !== '') return { ok: true, message: MESSAGES.lead }

  try {
    // 4. Rate limit by IP hash and by email.
    const ipHash = ctx.ip ? await deps.hashIp(ctx.ip) : undefined
    const since = new Date(ctx.now.getTime() - LEAD_LIMITS.windowMs)
    const counts = await deps.countRecent({ ipHash, email: lead.email, since })
    if (isRateLimited(counts)) return { ok: false, error: 'rate_limited', message: MESSAGES.rateLimited }

    // 5. Store the lead.
    const { id } = await deps.insertLead({ ...lead, ipHash, userAgent: ctx.userAgent, consentAt: ctx.now })

    // 6. Email sales and the visitor. A failed email never loses the lead.
    try {
      await deps.notify(lead, id)
    } catch (error) {
      deps.onEmailError(error)
    }
    return { ok: true, message: MESSAGES.lead }
  } catch (error) {
    deps.onSaveError(error)
    return { ok: false, error: 'server', message: MESSAGES.server }
  }
}

export interface NewsletterDeps {
  verifyCaptcha: (token: string | undefined, ip: string | undefined) => Promise<boolean>
  /** Adds the topics and returns whether the address still needs confirming. */
  upsertSubscriber: (q: { email: string; topics: NewsletterTopic[]; consentAt: Date }) => Promise<{ needsConfirmation: boolean }>
  sendConfirmation: (email: string, topics: NewsletterTopic[]) => Promise<void>
  onEmailError: (error: unknown) => void
  /** Storage failed; the visitor only sees a generic message, so this is where it gets logged. */
  onSaveError: (error: unknown) => void
}

export async function processNewsletter(raw: unknown, ctx: RequestContext, deps: NewsletterDeps): Promise<SubmitResult> {
  const parsed = NewsletterSchema.safeParse(raw)
  if (!parsed.success) {
    return { ok: false, error: 'validation', message: MESSAGES.validation, fieldErrors: fieldErrors(parsed.error) }
  }
  const input: NewsletterInput = parsed.data
  const launchOnly = !input.topics.includes('newsletter')
  const done = launchOnly
    ? 'Thanks. Check your inbox to confirm, and we will email you when it launches.'
    : 'Thanks. Check your inbox to confirm your subscription.'

  if (!(await deps.verifyCaptcha(input.turnstileToken, ctx.ip))) {
    return { ok: false, error: 'captcha', message: MESSAGES.captcha }
  }
  if (input.honeypot && input.honeypot.trim() !== '') return { ok: true, message: done }

  try {
    const { needsConfirmation } = await deps.upsertSubscriber({ email: input.email, topics: input.topics, consentAt: ctx.now })
    if (needsConfirmation) {
      try {
        await deps.sendConfirmation(input.email, input.topics)
      } catch (error) {
        deps.onEmailError(error)
      }
    }
    return { ok: true, message: needsConfirmation ? done : 'Thanks. You are already subscribed, and we added these topics.' }
  } catch (error) {
    deps.onSaveError(error)
    return { ok: false, error: 'server', message: MESSAGES.server }
  }
}
