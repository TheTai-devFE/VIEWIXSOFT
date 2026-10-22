import { createFileRoute } from '@tanstack/react-router'
import { AdminPageHeader, LoadError } from '~/components/admin/admin-ui'
import { TestimonialsEditor } from '~/components/admin/TestimonialsEditor'
import { getSiteAdminDataFn } from '~/server/functions/site-admin'

export const Route = createFileRoute('/admin/testimonials')({
  loader: () => getSiteAdminDataFn(),
  component: TestimonialsModule,
})

function TestimonialsModule() {
  const data = Route.useLoaderData()
  return (
    <>
      <AdminPageHeader title="Customer quotes" description="Quotes shown on the About page. Add one only with the customer's written approval." />
      {data.ok ? (
        <TestimonialsEditor saved={data.testimonials} />
      ) : (
        <LoadError>Settings could not be loaded. Check DATABASE_URL and that migrations have run.</LoadError>
      )}
    </>
  )
}
