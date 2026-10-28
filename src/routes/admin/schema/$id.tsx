import { createFileRoute, notFound } from '@tanstack/react-router'
import { AdminPageHeader, LoadError } from '~/components/admin/admin-ui'
import { SchemaForm } from '~/components/admin/schema/SchemaForm'
import { getAdminCustomSchemaFn } from '~/server/functions/custom-schemas'
import { listMediaLibraryFn } from '~/server/functions/media-admin'

export const Route = createFileRoute('/admin/schema/$id')({
  loader: {
    staleReloadMode: 'blocking',
    handler: async ({ params }) => {
      const [res, media] = await Promise.all([getAdminCustomSchemaFn({ data: { id: params.id } }), listMediaLibraryFn().catch(() => null)])
      if (!res.ok && res.error === 'not_found') throw notFound()
      return { res, assets: media?.ok ? media.assets : [] }
    },
  },
  component: EditSchemaPage,
})

function EditSchemaPage() {
  const { res, assets } = Route.useLoaderData()
  return (
    <>
      <AdminPageHeader
        title="Sửa schema"
        description={res.ok && res.schema.source === 'api' ? 'Schema này do tool gửi qua API. Bạn có thể sửa, duyệt hoặc tắt.' : undefined}
      />
      {res.ok ? (
        // Keyed by id so moving between schemas starts a fresh form.
        <SchemaForm key={res.schema.id} row={res.schema} targets={res.targets} assets={assets} />
      ) : (
        <LoadError>Không tải được schema. Hãy kiểm tra database.</LoadError>
      )}
    </>
  )
}
