import { createFileRoute, notFound } from '@tanstack/react-router'
import { BlogPostEditor } from '~/components/admin/blog/BlogPostEditor'
import { getAdminBlogPostByIdFn } from '~/server/functions/blog'
import { getAdminAuthorsFn } from '~/server/functions/authors'
import { listMediaLibraryFn } from '~/server/functions/media-admin'

export const Route = createFileRoute('/admin/blog/$id')({
  loader: {
    staleReloadMode: 'blocking',
    handler: async ({ params }) => {
      const [postRes, mediaRes, authorsRes] = await Promise.all([
        getAdminBlogPostByIdFn({ data: { id: params.id } }),
        listMediaLibraryFn(),
        getAdminAuthorsFn(),
      ])

      if (!postRes.ok || !postRes.post) {
        throw notFound()
      }

      return {
        post: postRes.post,
        assets: mediaRes.ok ? mediaRes.assets : [],
        authors: authorsRes.authors,
        ownership: { createdBy: postRes.post.createdBy, updatedBy: postRes.post.updatedBy, people: postRes.people, canEdit: postRes.canEdit },
      }
    },
  },
  component: EditBlogPostPage,
})

function EditBlogPostPage() {
  const { post, assets, authors, ownership } = Route.useLoaderData()
  return <BlogPostEditor initialPost={post} mediaAssets={assets} authors={authors} ownership={ownership} />
}
