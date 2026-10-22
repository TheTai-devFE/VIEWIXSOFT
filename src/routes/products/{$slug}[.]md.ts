import { createFileRoute } from '@tanstack/react-router'
import { PRODUCTS } from '~/content/products'
import { productMarkdown, textResponse } from '~/lib/seo/generators'

// Markdown twin of /products/$slug for LLM readers.
export const Route = createFileRoute('/products/{$slug}.md')({
  server: {
    handlers: {
      GET: ({ params }) => {
        const item = PRODUCTS.find((x) => x.slug === params.slug)
        if (!item) return new Response('Not found', { status: 404 })
        return textResponse(productMarkdown(item), 'text/markdown')
      },
    },
  },
})
