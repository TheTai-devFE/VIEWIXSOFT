import { createFileRoute } from '@tanstack/react-router'
import { buildSitemapXml, sitemapEntries, textResponse } from '~/lib/seo/generators'
import { visibleProducts } from '~/lib/site-config'
import { loadSiteConfig } from '~/server/site/config'

export const Route = createFileRoute('/sitemap.xml')({
  server: {
    handlers: {
      GET: async () => {
        const products = visibleProducts(await loadSiteConfig())
        return textResponse(buildSitemapXml(sitemapEntries(products)), 'application/xml')
      },
    },
  },
})
