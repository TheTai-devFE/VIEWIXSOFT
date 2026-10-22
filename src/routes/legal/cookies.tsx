import { createFileRoute } from '@tanstack/react-router'
import { generateMetaTags } from '~/lib/seo/meta'

export const Route = createFileRoute('/legal/cookies')({
  head: () => {
    const seo = generateMetaTags({
      title: 'Cookie Policy — Viewixsoft',
      description: 'How Viewixsoft uses essential cookies and cookieless privacy-friendly telemetry.',
      canonicalUrl: '/legal/cookies',
    })
    return {
      meta: seo.meta,
      links: seo.links,
    }
  },
  component: CookiesPage,
})

function CookiesPage() {
  return (
    <div className="py-16 md:py-24 max-w-4xl mx-auto px-4 sm:px-6 space-y-12">
      <div className="space-y-4 border-b border-ink-800 pb-8">
        <h1 className="text-3xl sm:text-5xl font-black text-ink-50">Cookie Policy</h1>
        <p className="text-ink-400 text-sm">Effective as of October 2026</p>
      </div>

      <div className="prose prose-invert prose-cyan max-w-none space-y-6 text-ink-300 text-sm leading-relaxed">
        <h2 className="text-xl font-bold text-ink-50">1. Minimal and Cookieless by Default</h2>
        <p>
          Viewixsoft respects user privacy by employing cookieless analytics on public marketing pages wherever possible. We do not use third-party cross-site advertising tracking cookies.
        </p>

        <h2 className="text-xl font-bold text-ink-50">2. Essential Cookies</h2>
        <p>
          Essential session cookies are utilized strictly within protected areas (such as the <code>/admin</code> dashboard) to authenticate administrators and protect against CSRF attacks.
        </p>
      </div>
    </div>
  )
}
