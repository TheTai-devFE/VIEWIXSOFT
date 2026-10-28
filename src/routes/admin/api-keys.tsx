import { createFileRoute } from '@tanstack/react-router'
import { AdminPageHeader, LoadError } from '~/components/admin/admin-ui'
import { ApiKeysEditor } from '~/components/admin/api-keys/ApiKeysEditor'
import { getApiKeysFn } from '~/server/functions/api-keys'

export const Route = createFileRoute('/admin/api-keys')({
  loader: { staleReloadMode: 'blocking', handler: () => getApiKeysFn() },
  component: ApiKeysModule,
})

function ApiKeysModule() {
  const data = Route.useLoaderData()
  return (
    <>
      <AdminPageHeader
        title="Khóa API"
        description="Cho phép tool bên ngoài (tool SEO, tool AI viết bài…) gửi schema markup và bài nháp vào site. Giống “Mật khẩu ứng dụng” của WordPress."
      />
      {data.ok ? (
        <ApiKeysEditor keys={data.keys} />
      ) : (
        <LoadError>Không tải được danh sách khóa. Hãy kiểm tra database và chạy pnpm db:migrate.</LoadError>
      )}
    </>
  )
}
