import { createFileRoute } from '@tanstack/react-router'
import { buildSitemapXml, textResponse } from '~/lib/seo/generators'

export const Route = createFileRoute('/sitemap.xml')({
  server: { handlers: { GET: () => textResponse(buildSitemapXml(), 'application/xml') } },
})
