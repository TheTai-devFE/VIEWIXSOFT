import { createFileRoute } from '@tanstack/react-router'
import { textResponse, useCaseMarkdown } from '~/lib/seo/generators'
import { loadPublishedContent } from '~/server/content/published'
import { loadSiteConfig } from '~/server/site/config'

// Markdown twin of /case-studies/$slug for LLM readers. Industry guides carry no customer figures or quotes.
export const Route = createFileRoute('/case-studies/{$slug}.md')({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const { useCases } = await loadPublishedContent(await loadSiteConfig())
        const item = useCases.find((u) => u.slug === params.slug)
        if (!item) return new Response('Not found', { status: 404 })
        return textResponse(useCaseMarkdown(item), 'text/markdown')
      },
    },
  },
})
