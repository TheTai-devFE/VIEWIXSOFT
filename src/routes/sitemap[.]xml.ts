import { createFileRoute } from '@tanstack/react-router'
import { buildSitemapXml, sitemapEntries, textResponse } from '~/lib/seo/generators'
import { visibleProducts } from '~/lib/site-config'
import { loadPublishedContent } from '~/server/content/published'
import { loadSiteConfig } from '~/server/site/config'

export const Route = createFileRoute('/sitemap.xml')({
  server: {
    handlers: {
      GET: async () => {
        const config = await loadSiteConfig()
        const content = await loadPublishedContent(config)
        return textResponse(buildSitemapXml(sitemapEntries(visibleProducts(config), config, content)), 'application/xml')
      },
    },
  },
})
