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
        description={
          data.isAdmin
            ? 'Khóa cho tool bên ngoài (tool SEO, tool AI viết bài…) gửi schema markup và bài nháp vào site. Bạn thấy và thu hồi được khóa của mọi tài khoản.'
            : 'Khóa cá nhân cho tool của bạn (tool SEO, tool AI viết bài…). Khóa chỉ có các quyền Blog/Schema mà tài khoản bạn đang có; bài gửi bằng khóa thuộc về bạn.'
        }
      />
      {data.ok ? (
        <ApiKeysEditor keys={data.keys} isAdmin={data.isAdmin} allowedScopes={data.allowedScopes} />
      ) : (
        <LoadError>Không tải được danh sách khóa. Hãy kiểm tra database và chạy pnpm db:migrate.</LoadError>
      )}
    </>
  )
}
