import { createFileRoute } from '@tanstack/react-router'
import { productMarkdown, textResponse } from '~/lib/seo/generators'
import { visibleProducts } from '~/lib/site-config'
import { loadSiteConfig } from '~/server/site/config'

// Markdown twin of /products/$slug for LLM readers; hidden products 404 here too.
export const Route = createFileRoute('/products/{$slug}.md')({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const item = visibleProducts(await loadSiteConfig()).find((x) => x.slug === params.slug)
        if (!item) return new Response('Not found', { status: 404 })
        return textResponse(productMarkdown(item), 'text/markdown')
      },
    },
  },
})
