import { createFileRoute } from '@tanstack/react-router'
import { MetricsEditor } from '~/components/admin/MetricsEditor'
import { ProductsEditor } from '~/components/admin/ProductsEditor'
import { SectionsEditor } from '~/components/admin/SectionsEditor'
import { TestimonialsEditor } from '~/components/admin/TestimonialsEditor'
import { SECTION_PAGE_KEYS } from '~/data/site-sections'
import { getSiteAdminDataFn } from '~/server/functions/site-admin'

export const Route = createFileRoute('/admin/site')({
  loader: () => getSiteAdminDataFn(),
  component: SiteSettingsPage,
})

function SiteSettingsPage() {
  const data = Route.useLoaderData()

  return (
    <div className="space-y-8 py-8">
      <header>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-ink-50">Site sections</h1>
        <p className="mt-2 max-w-2xl text-sm text-ink-400">
          Choose what each page shows. Sections that need real data (stats, quotes, results) stay hidden on the live
          site until that data is entered here, even when they are ticked.
        </p>
      </header>

      {!data.ok ? (
        <p role="alert" className="rounded-xl border border-destructive/40 p-4 text-sm text-destructive">
          Settings could not be loaded. Check DATABASE_URL and that migrations have run (pnpm db:migrate).
        </p>
      ) : (
        <>
          <ProductsEditor saved={data.products} />
          <div className="grid gap-6 xl:grid-cols-2">
            {SECTION_PAGE_KEYS.map((page) => (
              <SectionsEditor key={page} page={page} saved={data.sections} />
            ))}
          </div>
          <MetricsEditor saved={data.metrics} />
          <TestimonialsEditor saved={data.testimonials} />
        </>
      )}
    </div>
  )
}
