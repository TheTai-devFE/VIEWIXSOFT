import '@tanstack/react-start/server-only'
import { getEnv } from '~/server/env'
import { logger } from '~/server/logger'

export interface EmailMessage {
  to: string
  subject: string
  html: string
  text: string
  replyTo?: string
  /** Short label for logs, e.g. "lead.sales"; never the address. */
  tag: string
}

/**
 * Sends through the Resend HTTP API (no SDK needed on Workers). Without
 * RESEND_API_KEY the send is skipped and logged, which keeps local runs quiet.
 */
export async function sendEmail(message: EmailMessage) {
  const env = getEnv()
  if (!env.RESEND_API_KEY) {
    logger.info('email.skipped', { tag: message.tag, reason: 'RESEND_API_KEY not set' })
    return { ok: true as const, skipped: true }
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: env.EMAIL_FROM,
      to: [message.to],
      subject: message.subject,
      html: message.html,
      text: message.text,
      ...(message.replyTo ? { reply_to: message.replyTo } : {}),
    }),
  })
  if (!res.ok) throw new Error(`Resend responded ${res.status}`)
  return { ok: true as const, skipped: false }
}
