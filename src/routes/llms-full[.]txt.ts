import { createFileRoute } from '@tanstack/react-router'
import { buildLlmsFullTxt, textResponse } from '~/lib/seo/generators'
import { visibleProducts } from '~/lib/site-config'
import { postMarkdown } from '~/server/content/blog-raw'
import { loadSiteConfig } from '~/server/site/config'

export const Route = createFileRoute('/llms-full.txt')({
  server: {
    handlers: {
      GET: async () => textResponse(buildLlmsFullTxt(visibleProducts(await loadSiteConfig()), postMarkdown), 'text/plain'),
    },
  },
})
