import { createFileRoute, Link } from '@tanstack/react-router'
import { AdminPageHeader, LoadError } from '~/components/admin/admin-ui'
import { can } from '~/lib/permissions'
import { SchemaList } from '~/components/admin/schema/SchemaList'
import { getAdminCustomSchemasFn } from '~/server/functions/custom-schemas'

export const Route = createFileRoute('/admin/schema/')({
  loader: { staleReloadMode: 'blocking', handler: () => getAdminCustomSchemasFn() },
  component: SchemaListPage,
})

function SchemaListPage() {
  const data = Route.useLoaderData()
  const { admin } = Route.useRouteContext()
  return (
    <>
      <AdminPageHeader
        title="Schema markup"
        description="Schema (HowTo, FAQ, Product…) gắn vào từng trang. Schema do tool gửi qua API nằm ở mục Chờ duyệt cho đến khi bạn bấm Duyệt."
        actions={
          admin && can(admin, 'api-keys') ? (
            <Link to="/admin/api-keys" className="text-sm font-medium text-signal-400 hover:underline">
              Khóa API cho tool bên ngoài →
            </Link>
          ) : undefined
        }
      />
      {data.ok ? (
        <SchemaList schemas={data.schemas} targets={data.targets} />
      ) : (
        <LoadError>Không tải được danh sách schema. Hãy kiểm tra database và chạy pnpm db:migrate.</LoadError>
      )}
    </>
  )
}
