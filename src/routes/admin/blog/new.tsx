import { createFileRoute } from '@tanstack/react-router'
import { BlogPostEditor } from '~/components/admin/blog/BlogPostEditor'
import { getAdminAuthorsFn } from '~/server/functions/authors'
import { listMediaLibraryFn } from '~/server/functions/media-admin'

export const Route = createFileRoute('/admin/blog/new')({
  loader: {
    staleReloadMode: 'blocking',
    handler: async () => {
      const [res, authorsRes] = await Promise.all([listMediaLibraryFn(), getAdminAuthorsFn()])
      // New posts start with the byline of the author profile linked to this account.
      const mine = authorsRes.authors.find((a) => a.userId === authorsRes.currentUserId)
      return { assets: res.ok ? res.assets : [], authors: authorsRes.authors, defaultAuthorId: mine?.id ?? null }
    },
  },
  component: NewBlogPostPage,
})

function NewBlogPostPage() {
  const { assets, authors, defaultAuthorId } = Route.useLoaderData()
  return <BlogPostEditor mediaAssets={assets} authors={authors} defaultAuthorId={defaultAuthorId} />
}
