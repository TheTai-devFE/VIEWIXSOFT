import { createFileRoute } from '@tanstack/react-router'
import { BLOG_POSTS } from '~/content/blog'
import { blogPostMarkdown, textResponse } from '~/lib/seo/generators'
import { postMarkdown } from '~/server/content/blog-raw'

// Markdown twin of /blog/$slug for LLM readers. Drafts are never served.
export const Route = createFileRoute('/blog/{$slug}.md')({
  server: {
    handlers: {
      GET: ({ params }) => {
        const post = BLOG_POSTS.find((x) => x.slug === params.slug && !x.draft)
        const body = post && postMarkdown(post.slug)
        if (!post || body === null || body === undefined) return new Response('Not found', { status: 404 })
        return textResponse(blogPostMarkdown(post, body), 'text/markdown')
      },
    },
  },
})
