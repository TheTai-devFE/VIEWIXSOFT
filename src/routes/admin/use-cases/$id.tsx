import { createFileRoute, notFound } from '@tanstack/react-router'
import { UseCaseEditor } from '~/components/admin/use-cases/UseCaseEditor'
import { getAdminUseCaseByIdFn } from '~/server/functions/use-cases'
import { listMediaLibraryFn } from '~/server/functions/media-admin'

export const Route = createFileRoute('/admin/use-cases/$id')({
  loader: {
    staleReloadMode: 'blocking',
    handler: async ({ params }) => {
      const [ucRes, mediaRes] = await Promise.all([
        getAdminUseCaseByIdFn({ data: { id: params.id } }),
        listMediaLibraryFn(),
      ])

      if (!ucRes.ok || !ucRes.useCase) {
        throw notFound()
      }

      return {
        useCase: ucRes.useCase,
        assets: mediaRes.ok ? mediaRes.assets : [],
        ownership: { createdBy: ucRes.useCase.createdBy, updatedBy: ucRes.useCase.updatedBy, people: ucRes.people, canEdit: ucRes.canEdit },
      }
    },
  },
  component: EditUseCasePage,
})

function EditUseCasePage() {
  const { useCase, assets, ownership } = Route.useLoaderData()
  return <UseCaseEditor initialUseCase={useCase} mediaAssets={assets} ownership={ownership} />
}
