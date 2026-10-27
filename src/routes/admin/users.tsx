import { createFileRoute } from '@tanstack/react-router'
import { AdminPageHeader, LoadError } from '~/components/admin/admin-ui'
import { UsersEditor } from '~/components/admin/users/UsersEditor'
import { listUsersFn } from '~/server/functions/users'

export const Route = createFileRoute('/admin/users')({
  loader: {
    staleReloadMode: 'blocking',
    handler: () => listUsersFn(),
  },
  component: UsersModule,
})

function UsersModule() {
  const data = Route.useLoaderData()
  return (
    <>
      <AdminPageHeader
        title="Người dùng & quyền"
        description="Tạo tài khoản cho đội ngũ (ví dụ Marketing viết bài) và chọn từng mục họ được dùng. Người không có quyền sẽ không thấy mục đó trên menu và không mở được."
      />
      {data.ok ? (
        <UsersEditor users={data.users} authorByUser={data.authorByUser} currentUserId={data.currentUserId} />
      ) : (
        <LoadError>Không tải được danh sách tài khoản. Hãy kiểm tra database và chạy pnpm db:migrate.</LoadError>
      )}
    </>
  )
}
