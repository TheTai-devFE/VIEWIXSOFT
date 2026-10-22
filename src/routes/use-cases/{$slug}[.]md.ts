import { createFileRoute } from '@tanstack/react-router'
import { USE_CASES } from '~/content/useCases'
import { useCaseMarkdown, textResponse } from '~/lib/seo/generators'

// Markdown twin of /use-cases/$slug for LLM readers.
export const Route = createFileRoute('/use-cases/{$slug}.md')({
  server: {
    handlers: {
      GET: ({ params }) => {
        const item = USE_CASES.find((x) => x.slug === params.slug)
        if (!item) return new Response('Not found', { status: 404 })
        return textResponse(useCaseMarkdown(item), 'text/markdown')
      },
    },
  },
})
