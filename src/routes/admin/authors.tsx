import { createFileRoute } from '@tanstack/react-router'
import { AdminPageHeader, LoadError } from '~/components/admin/admin-ui'
import { AuthorsEditor } from '~/components/admin/authors/AuthorsEditor'
import { getAdminAuthorsFn } from '~/server/functions/authors'
import { listMediaLibraryFn } from '~/server/functions/media-admin'

export const Route = createFileRoute('/admin/authors')({
  loader: {
    staleReloadMode: 'blocking',
    handler: async () => {
      const [authors, media] = await Promise.all([getAdminAuthorsFn(), listMediaLibraryFn()])
      return { authors, assets: media.ok ? media.assets : [] }
    },
  },
  component: AuthorsModule,
})

function AuthorsModule() {
  const { authors, assets } = Route.useLoaderData()
  return (
    <>
      <AdminPageHeader
        title="Tác giả"
        description="Hồ sơ người viết bài blog. Tác giả thật, có chức danh, ảnh và giới thiệu giúp Google và AI tin bài viết hơn (E-E-A-T)."
      />
      {authors.ok ? (
        <AuthorsEditor authors={authors.authors} assets={assets} accounts={authors.accounts} />
      ) : (
        <LoadError>Không tải được danh sách tác giả. Hãy kiểm tra database và chạy pnpm db:migrate.</LoadError>
      )}
    </>
  )
}
