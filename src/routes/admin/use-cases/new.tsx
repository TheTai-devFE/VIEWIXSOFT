import { createFileRoute } from '@tanstack/react-router'
import { UseCaseEditor } from '~/components/admin/use-cases/UseCaseEditor'
import { listMediaLibraryFn } from '~/server/functions/media-admin'

export const Route = createFileRoute('/admin/use-cases/new')({
  loader: {
    staleReloadMode: 'blocking',
    handler: async () => {
      const res = await listMediaLibraryFn()
      return { assets: res.ok ? res.assets : [] }
    },
  },
  component: NewUseCasePage,
})

function NewUseCasePage() {
  const { assets } = Route.useLoaderData()
  return <UseCaseEditor mediaAssets={assets} />
}
