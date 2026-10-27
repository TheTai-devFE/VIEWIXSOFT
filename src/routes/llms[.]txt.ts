import { createFileRoute } from '@tanstack/react-router'
import { buildLlmsTxt, textResponse } from '~/lib/seo/generators'
import { visibleProducts } from '~/lib/site-config'
import { loadPublishedContent } from '~/server/content/published'
import { loadSiteConfig } from '~/server/site/config'

export const Route = createFileRoute('/llms.txt')({
  server: {
    handlers: {
      GET: async () => {
        const config = await loadSiteConfig()
        return textResponse(buildLlmsTxt(visibleProducts(config), await loadPublishedContent(config)), 'text/plain')
      },
    },
  },
})
