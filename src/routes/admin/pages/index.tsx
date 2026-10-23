import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowUpRight } from 'lucide-react'
import { AdminPageHeader } from '~/components/admin/admin-ui'
import { ADMIN_PAGE_GROUPS } from '~/data/admin-pages'
import { SECTION_PAGES } from '~/data/site-sections'

export const Route = createFileRoute('/admin/pages/')({
  component: PagesOverview,
})

function PagesOverview() {
  return (
    <>
      <AdminPageHeader title="Pages" description="Every public page of the website. Open one to manage it." />
      <div className="space-y-8">
        {ADMIN_PAGE_GROUPS.map((group) => (
          <section key={group.id} aria-labelledby={`pages-${group.id}`}>
            <h2 id={`pages-${group.id}`} className="mb-3 font-display text-lg font-semibold text-foreground">
              {group.label}
            </h2>
            <div className="overflow-x-auto rounded-2xl border border-border bg-card">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-muted-foreground">
                    <th scope="col" className="px-4 py-3 font-medium">Page</th>
                    <th scope="col" className="px-4 py-3 font-medium">URL</th>
                    <th scope="col" className="px-4 py-3 font-medium">Sections</th>
                  </tr>
                </thead>
                <tbody>
                  {group.pages.map((page) => (
                    <tr key={page.key} className="border-b border-border last:border-0">
                      <td className="px-4 py-3">
                        <Link
                          to="/admin/pages/$page"
                          params={{ page: page.key }}
                          className="font-medium text-foreground underline-offset-2 hover:underline"
                        >
                          {page.label}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <a
                          href={page.path}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 font-mono text-xs text-muted-foreground hover:text-foreground"
                        >
                          {page.path}
                          <ArrowUpRight aria-hidden="true" className="size-3.5" />
                          <span className="sr-only">(opens in a new tab)</span>
                        </a>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {page.sections ? SECTION_PAGES[page.sections].label : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}
      </div>
    </>
  )
}
