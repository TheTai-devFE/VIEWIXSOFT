import { createFileRoute } from '@tanstack/react-router'
import { BLOG_POSTS } from '~/content/blog-posts'
import { blogPostMarkdown, textResponse } from '~/lib/seo/generators'

// Markdown twin of /blog/$slug for LLM readers.
export const Route = createFileRoute('/blog/{$slug}.md')({
  server: {
    handlers: {
      GET: ({ params }) => {
        const item = BLOG_POSTS.find((x) => x.slug === params.slug)
        if (!item) return new Response('Not found', { status: 404 })
        return textResponse(blogPostMarkdown(item), 'text/markdown')
      },
    },
  },
})
