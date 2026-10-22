import { createFileRoute } from '@tanstack/react-router'
import { buildRssXml, textResponse } from '~/lib/seo/generators'

export const Route = createFileRoute('/rss.xml')({
  server: { handlers: { GET: () => textResponse(buildRssXml(), 'application/rss+xml') } },
})
