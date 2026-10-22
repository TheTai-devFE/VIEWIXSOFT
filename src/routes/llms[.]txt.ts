import { createFileRoute } from '@tanstack/react-router'
import { buildLlmsTxt, textResponse } from '~/lib/seo/generators'
import { visibleProducts } from '~/lib/site-config'
import { loadSiteConfig } from '~/server/site/config'

export const Route = createFileRoute('/llms.txt')({
  server: {
    handlers: {
      GET: async () => textResponse(buildLlmsTxt(visibleProducts(await loadSiteConfig())), 'text/plain'),
    },
  },
})
