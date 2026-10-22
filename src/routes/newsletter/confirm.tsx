import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { z } from 'zod'
import { generateMetaTags } from '~/lib/seo/meta'
import { confirmNewsletterFn } from '~/server/functions/leads'

export const Route = createFileRoute('/newsletter/confirm')({
  validateSearch: z.object({
    email: z.string().email().optional().catch(undefined),
    token: z.string().max(200).optional().catch(undefined),
  }),
  head: () => {
    const seo = generateMetaTags({
      title: 'Confirm your email',
      description: 'Confirm your Viewixsoft newsletter sign-up.',
      noindex: true,
      canonicalUrl: '/newsletter/confirm',
    })
    return { meta: seo.meta }
  },
  component: ConfirmPage,
})

// A button instead of confirming on page load: link scanners in mail servers
// open every link, and must not confirm on the reader's behalf.
function ConfirmPage() {
  const { email, token } = Route.useSearch()
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'failed'>('idle')
  const valid = Boolean(email && token)

  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="font-display text-3xl font-semibold tracking-tight text-ink-50">
        {state === 'done' ? 'You are subscribed' : 'Confirm your email'}
      </h1>
      <div role="status" className="mt-4 text-ink-400">
        {state === 'done' && <p>Thanks. We will only email you about what you signed up for.</p>}
        {state === 'failed' && <p>This link is invalid or expired. Sign up again to get a new one.</p>}
        {state !== 'done' && state !== 'failed' && valid && <p>Confirm that {email} should get Viewixsoft emails.</p>}
        {!valid && <p>This confirmation link is incomplete. Open the link from the email again.</p>}
      </div>
      {valid && (state === 'idle' || state === 'busy') && (
        <button
          type="button"
          disabled={state === 'busy'}
          onClick={async () => {
            if (!email || !token) return
            setState('busy')
            try {
              const res = await confirmNewsletterFn({ data: { email, token } })
              setState(res.ok ? 'done' : 'failed')
            } catch {
              setState('failed')
            }
          }}
          className="bg-brand-gradient mt-8 rounded-lg px-6 py-3 text-sm font-semibold text-on-gradient hover:opacity-90 disabled:opacity-60"
        >
          {state === 'busy' ? 'Confirming…' : 'Confirm my email'}
        </button>
      )}
      <p className="mt-10">
        <Link to="/" className="text-sm font-semibold text-signal-400 hover:text-signal-300">
          Back to the home page
        </Link>
      </p>
    </div>
  )
}
