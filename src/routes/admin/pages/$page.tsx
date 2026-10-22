import { createFileRoute, notFound } from '@tanstack/react-router'
import { ArrowUpRight } from 'lucide-react'
import { AdminPageHeader, LoadError, Panel } from '~/components/admin/admin-ui'
import { SectionsEditor } from '~/components/admin/SectionsEditor'
import { findAdminPage, pagesSharingSections } from '~/data/admin-pages'
import { getSiteAdminDataFn } from '~/server/functions/site-admin'

export const Route = createFileRoute('/admin/pages/$page')({
  loader: async ({ params }) => {
    const found = findAdminPage(params.page)
    if (!found) throw notFound()
    return { ...found, settings: await getSiteAdminDataFn() }
  },
  component: PageEditor,
})

function PageEditor() {
  const { page, group, settings } = Route.useLoaderData()
  const shared = pagesSharingSections(page)

  return (
    <>
      <AdminPageHeader
        title={page.label}
        description={`${group.label} page`}
        actions={
          <a
            href={page.path}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            View {page.path}
            <ArrowUpRight aria-hidden="true" className="size-4" />
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        }
      />

      <div className="space-y-6">
        {page.sections ? (
          <>
            {shared.length > 0 && (
              <p className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
                These sections are shared with {shared.length} other page{shared.length > 1 ? 's' : ''} built from the same
                template ({shared.map((p) => p.label).join(', ')}). A change here applies to all of them.
              </p>
            )}
            {settings.ok ? (
              // Keyed so moving between pages starts from that page's saved order.
              <SectionsEditor key={page.key} page={page.sections} saved={settings.sections} />
            ) : (
              <LoadError>Settings could not be loaded. Check DATABASE_URL and that migrations have run.</LoadError>
            )}
          </>
        ) : (
          <Panel title="Sections">
            <p className="text-sm text-muted-foreground">This page has no sections that can be shown, hidden or reordered yet.</p>
          </Panel>
        )}

        <Panel title="Hero and search appearance">
          <p className="text-sm text-muted-foreground">
            Next step: edit this page's heading and intro text, and the title and description shown in Google.
          </p>
        </Panel>
      </div>
    </>
  )
}
