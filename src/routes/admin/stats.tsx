import { createFileRoute } from '@tanstack/react-router'
import { AdminPageHeader, LoadError } from '~/components/admin/admin-ui'
import { MetricsEditor } from '~/components/admin/MetricsEditor'
import { getSiteAdminDataFn } from '~/server/functions/site-admin'

export const Route = createFileRoute('/admin/stats')({
  loader: {
    staleReloadMode: 'blocking',
    handler: () => getSiteAdminDataFn(),
  },
  component: StatsModule,
})

function StatsModule() {
  const data = Route.useLoaderData()
  return (
    <>
      <AdminPageHeader
        title="Company stats"
        description="Real figures shown under the vision on the About page, each with a source and the date it was taken."
      />
      {data.ok ? (
        <MetricsEditor saved={data.metrics} />
      ) : (
        <LoadError>Settings could not be loaded. Check DATABASE_URL and that migrations have run.</LoadError>
      )}
    </>
  )
}
