import { createFileRoute } from '@tanstack/react-router'
import { buildLlmsFullTxt, textResponse } from '~/lib/seo/generators'
import { visibleProducts } from '~/lib/site-config'
import { loadSiteConfig } from '~/server/site/config'

export const Route = createFileRoute('/llms-full.txt')({
  server: {
    handlers: {
      GET: async () => textResponse(buildLlmsFullTxt(visibleProducts(await loadSiteConfig())), 'text/plain'),
    },
  },
})
