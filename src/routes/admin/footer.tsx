import { createFileRoute } from '@tanstack/react-router'
import { AdminPageHeader, LoadError } from '~/components/admin/admin-ui'
import { FooterEditor } from '~/components/admin/FooterEditor'
import { getFooterSettingsFn } from '~/server/functions/site-admin'

export const Route = createFileRoute('/admin/footer')({
  loader: {
    staleReloadMode: 'blocking',
    handler: () => getFooterSettingsFn(),
  },
  component: FooterAdminModule,
})

function FooterAdminModule() {
  const data = Route.useLoaderData()

  return (
    <>
      <AdminPageHeader
        title="Footer info"
        description="Edit legal entity information, registered business address, department contacts, social links, and copyright text shown across all pages."
      />
      {data.ok ? (
        <FooterEditor initial={data.footer} />
      ) : (
        <LoadError>Footer settings could not be loaded. Check your database connection.</LoadError>
      )}
    </>
  )
}
