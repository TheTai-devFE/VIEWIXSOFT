import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { AdminPageHeader, LoadError } from '~/components/admin/admin-ui'
import { SectionsEditor } from '~/components/admin/SectionsEditor'
import { SECTION_PAGES, SECTION_PAGE_KEYS } from '~/data/site-sections'
import type { SectionPage } from '~/data/site-sections'
import { cn } from '~/lib/cn'
import { getSiteAdminDataFn } from '~/server/functions/site-admin'

export const Route = createFileRoute('/admin/pages')({
  validateSearch: z.object({
    page: z.enum(SECTION_PAGE_KEYS as [SectionPage, ...SectionPage[]]).optional().catch(undefined),
  }),
  loader: () => getSiteAdminDataFn(),
  component: PagesModule,
})

function PagesModule() {
  const data = Route.useLoaderData()
  const page = Route.useSearch().page ?? 'home'
  const navigate = Route.useNavigate()

  return (
    <>
      <AdminPageHeader
        title="Pages & sections"
        description="Show, hide and reorder the sections of each page. Sections that need real data stay hidden until it exists."
      />
      {!data.ok ? (
        <LoadError>Settings could not be loaded. Check DATABASE_URL and that migrations have run.</LoadError>
      ) : (
        <>
          <nav aria-label="Pages" className="mb-6 flex flex-wrap gap-2">
            {SECTION_PAGE_KEYS.map((key) => (
              <button
                key={key}
                type="button"
                aria-pressed={key === page}
                onClick={() => void navigate({ search: { page: key }, replace: true })}
                className={cn(
                  'rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
                  key === page
                    ? 'border-transparent bg-brand-gradient text-on-gradient'
                    : 'border-border text-muted-foreground hover:text-foreground',
                )}
              >
                {SECTION_PAGES[key].label}
              </button>
            ))}
          </nav>
          {/* Keyed so switching pages starts from that page's saved order. */}
          <SectionsEditor key={page} page={page} saved={data.sections} />
        </>
      )}
    </>
  )
}
