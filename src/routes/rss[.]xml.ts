import { createFileRoute } from '@tanstack/react-router'
import { buildRssXml, textResponse } from '~/lib/seo/generators'
import { loadPublishedContent } from '~/server/content/published'
import { loadSiteConfig } from '~/server/site/config'

export const Route = createFileRoute('/rss.xml')({
  server: {
    handlers: {
      GET: async () => {
        const config = await loadSiteConfig()
        const { posts } = await loadPublishedContent(config)
        return textResponse(buildRssXml(posts.map((p) => p.post), config.slugs), 'application/rss+xml')
      },
    },
  },
})
