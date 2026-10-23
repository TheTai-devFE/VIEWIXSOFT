import { createFileRoute, redirect } from '@tanstack/react-router'

/*
 * Viewixsoft CMS is the only available product, so /products sends visitors
 * straight to it with a temporary (307) redirect. When a second product ships,
 * build a products overview here, give it page content and add it back to
 * STATIC_PAGES for the sitemap.
 */
export const Route = createFileRoute('/products/')({
  beforeLoad: () => {
    throw redirect({ to: '/products/$slug', params: { slug: 'cms' } })
  },
})
