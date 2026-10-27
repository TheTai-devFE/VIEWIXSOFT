import { createFileRoute } from '@tanstack/react-router'
import { AdminPageHeader, LoadError } from '~/components/admin/admin-ui'
import { ProductsEditor } from '~/components/admin/ProductsEditor'
import { getSiteAdminDataFn } from '~/server/functions/site-admin'

export const Route = createFileRoute('/admin/products')({
  loader: {
    staleReloadMode: 'blocking',
    handler: () => getSiteAdminDataFn(),
  },
  component: ProductsModule,
})

function ProductsModule() {
  const data = Route.useLoaderData()
  return (
    <>
      <AdminPageHeader title="Product status" description="Release state of each product. Only mark one available once it can be bought." />
      {data.ok ? (
        <ProductsEditor saved={data.products} />
      ) : (
        <LoadError>Settings could not be loaded. Check DATABASE_URL and that migrations have run.</LoadError>
      )}
    </>
  )
}
