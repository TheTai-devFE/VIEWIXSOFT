import { createFileRoute } from '@tanstack/react-router'
import { buildRssXml, textResponse } from '~/lib/seo/generators'
import { loadPublishedContent } from '~/server/content/published'
import { loadSiteConfig } from '~/server/site/config'

export const Route = createFileRoute('/rss.xml')({
  server: {
    handlers: {
      GET: async () => {
        const { posts } = await loadPublishedContent(await loadSiteConfig())
        return textResponse(buildRssXml(posts.map((p) => p.post)), 'application/rss+xml')
      },
    },
  },
})
