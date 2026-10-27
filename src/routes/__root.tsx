/// <reference types="vite/client" />
import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
  useRouterState,
} from '@tanstack/react-router'
import * as React from 'react'
import { SiteHeader } from '~/components/blocks/SiteHeader'
import { Footer } from '~/components/blocks/Footer'
import { CookieConsent } from '~/components/blocks/CookieConsent'
import { DefaultCatchBoundary } from '~/components/DefaultCatchBoundary'
import { NotFound } from '~/components/NotFound'
import { SHARE_IMAGE_SLOT } from '~/data/media-slots'
import { getOrganizationSchema, getWebSiteSchema } from '~/lib/seo/jsonld'
import { DEFAULT_OG_IMAGE, shareImageTags } from '~/lib/seo/meta'
import { getSiteConfigFn } from '~/server/functions/site'
import appCss from '~/styles/app.css?url'

export const Route = createRootRoute({
  // Admin site settings (sections, product status, stats, quotes, images).
  // The server caches them for 30s; the client reuses them for 30s too.
  loader: () => getSiteConfigFn(),
  staleTime: 30_000,
  head: ({ loaderData }) => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { name: 'theme-color', content: '#ffffff' },
      { name: 'color-scheme', content: 'light' },
      // Site-wide link preview image from /admin/seo; pages with their own (blog, case studies) replace it.
      ...shareImageTags(loaderData?.media[SHARE_IMAGE_SLOT] ?? { url: DEFAULT_OG_IMAGE, width: 1200, height: 630 }),
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
      // Fonts are self-hosted (@font-face in app.css). Preloading Manrope lets
      // the hero heading render in its final font without waiting for the CSS.
      {
        rel: 'preload',
        href: '/fonts/manrope-latin.woff2',
        as: 'font',
        type: 'font/woff2',
        crossOrigin: 'anonymous',
      },
    ],
    scripts: [
      {
        type: 'application/ld+json',
        children: JSON.stringify(getOrganizationSchema()),
      },
      {
        type: 'application/ld+json',
        children: JSON.stringify(getWebSiteSchema()),
      },
    ],
  }),
  errorComponent: DefaultCatchBoundary,
  notFoundComponent: () => <NotFound />,
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  // The admin has its own shell (sidebar, theme, <main>); the marketing chrome stays out of it.
  const isAdmin = useRouterState({ select: (s) => s.location.pathname.startsWith('/admin') })
  return (
    // The admin theme script may add `dark` before hydration.
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="min-h-screen flex flex-col font-sans antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 z-[60] px-4 py-2 bg-brand-gradient text-on-gradient font-mono text-sm rounded-md"
        >
          Skip to main content
        </a>
        {isAdmin ? (
          children
        ) : (
          <>
            <SiteHeader />
            {/* Decorative glows and illustrations may reach past the edge; clip (not hidden) keeps sticky elements working. */}
            <main id="main-content" className="flex-1 overflow-x-clip pt-16">
              {children}
            </main>
            <Footer />
            <CookieConsent />
          </>
        )}
        <Scripts />
      </body>
    </html>
  )
}
