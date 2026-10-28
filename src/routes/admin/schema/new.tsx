import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { AdminPageHeader, LoadError } from '~/components/admin/admin-ui'
import { SchemaForm } from '~/components/admin/schema/SchemaForm'
import { SchemaPathSchema } from '~/lib/seo/custom-schema'
import { getSchemaTargetsFn } from '~/server/functions/custom-schemas'
import { listMediaLibraryFn } from '~/server/functions/media-admin'

export const Route = createFileRoute('/admin/schema/new')({
  // `?path=/blog/my-post` opens the form with that page already picked.
  validateSearch: z.object({ path: SchemaPathSchema.optional().catch(undefined) }),
  loader: {
    staleReloadMode: 'blocking',
    handler: async () => {
      // The image library needs media or pages access; without it images are typed in as links.
      const [targets, media] = await Promise.all([getSchemaTargetsFn(), listMediaLibraryFn().catch(() => null)])
      return { targets, assets: media?.ok ? media.assets : [] }
    },
  },
  component: NewSchemaPage,
})

function NewSchemaPage() {
  const { targets, assets } = Route.useLoaderData()
  const { path } = Route.useSearch()
  return (
    <>
      <AdminPageHeader title="Thêm schema" description="Chọn trang, chọn loại schema rồi điền nội dung. Khung bên phải hiện đúng JSON-LD sẽ nằm trong trang." />
      {targets.ok ? (
        <SchemaForm targets={targets.targets} assets={assets} initialPath={path} />
      ) : (
        <LoadError>Không tải được danh sách trang. Hãy kiểm tra database.</LoadError>
      )}
    </>
  )
}
