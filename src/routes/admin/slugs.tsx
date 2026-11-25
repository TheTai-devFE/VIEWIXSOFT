import { createFileRoute } from '@tanstack/react-router'
import { AdminPageHeader, LoadError } from '~/components/admin/admin-ui'
import { SlugsManager } from '~/components/admin/slugs/SlugsManager'
import { getAdminSlugsDataFn } from '~/server/functions/slugs'

export const Route = createFileRoute('/admin/slugs')({
  loader: {
    staleReloadMode: 'blocking',
    handler: () => getAdminSlugsDataFn(),
  },
  component: AdminSlugsPage,
})

function AdminSlugsPage() {
  const data = Route.useLoaderData()

  return (
    <>
      <AdminPageHeader
        title="Đường dẫn (Slug)"
        description="Chỉnh sửa đường dẫn URL cho toàn bộ trang, danh mục, bài viết và quản lý chuyển hướng 301 tự động."
      />

      {!data.ok ? (
        <LoadError>
          Không tải được cấu hình đường dẫn. Hãy kiểm tra DATABASE_URL và đảm bảo đã chạy migration mới (pnpm db:migrate).
        </LoadError>
      ) : (
        <SlugsManager
          initialPageSlugs={data.pageSlugs}
          initialRedirects={data.redirects}
          initialPosts={data.posts}
          initialUseCases={data.useCases}
        />
      )}
    </>
  )
}
