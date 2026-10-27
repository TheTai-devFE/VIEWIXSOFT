import { createFileRoute } from '@tanstack/react-router'
import { blogPostMarkdown, textResponse } from '~/lib/seo/generators'
import { loadPublishedContent } from '~/server/content/published'
import { loadSiteConfig } from '~/server/site/config'

// Markdown twin of /blog/$slug for LLM readers: posts from the admin and the MDX files. Drafts are never served.
export const Route = createFileRoute('/blog/{$slug}.md')({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const { posts } = await loadPublishedContent(await loadSiteConfig())
        const found = posts.find((p) => p.post.slug === params.slug)
        if (!found) return new Response('Not found', { status: 404 })
        return textResponse(blogPostMarkdown(found.post, found.body), 'text/markdown')
      },
    },
  },
})
