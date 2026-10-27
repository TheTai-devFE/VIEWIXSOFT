import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { ArrowUpRight, Eye, EyeOff, Lock, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { AdminPageHeader, LoadError } from '~/components/admin/admin-ui'
import { ADMIN_PAGE_GROUPS } from '~/data/admin-pages'
import { SECTION_PAGES } from '~/data/site-sections'
import { getSiteAdminDataFn, togglePageVisibilityFn } from '~/server/functions/site-admin'
import { getPageVisibility } from '~/lib/page-visibility'
import { cn } from '~/lib/cn'

export const Route = createFileRoute('/admin/pages/')({
  loader: {
    staleReloadMode: 'blocking',
    handler: () => getSiteAdminDataFn(),
  },
  component: PagesOverview,
})

function PagesOverview() {
  const router = useRouter()
  const data = Route.useLoaderData()
  const rawVisibility = data.ok
    ? ((data.content.find((c) => c.page === 'global' && c.sectionKey === 'page_visibility')?.content as Record<string, boolean> | undefined) ?? {})
    : {}

  const [visibility, setVisibility] = useState<Record<string, boolean>>(rawVisibility)
  const [togglingKey, setTogglingKey] = useState<string | null>(null)

  const handleToggle = async (pageKey: string, currentVisible: boolean) => {
    const next = !currentVisible
    setTogglingKey(pageKey)
    setVisibility((prev) => ({ ...prev, [pageKey]: next }))

    try {
      const res = await togglePageVisibilityFn({ data: { pageKey, visible: next } })
      if (!res.ok) {
        // Revert on failure
        setVisibility((prev) => ({ ...prev, [pageKey]: currentVisible }))
      } else {
        await router.invalidate()
      }
    } catch {
      setVisibility((prev) => ({ ...prev, [pageKey]: currentVisible }))
    } finally {
      setTogglingKey(null)
    }
  }

  return (
    <>
      <AdminPageHeader
        title="Pages & Visibility"
        description="Manage page content, sections, and show/hide pages site-wide."
      />

      <div className="mb-6 rounded-2xl border border-ink-800 bg-ink-900/60 p-4 text-xs text-ink-300">
        <p className="font-semibold text-ink-100">💡 Page Visibility Control:</p>
        <p className="mt-1 text-ink-400">
          Pages set to <span className="font-semibold text-rose-400">Hidden</span> are automatically removed from the header navigation, mobile drawer, and footer links, and will return a 404 page if visited directly.
        </p>
      </div>

      {!data.ok && (
        <div className="mb-6">
          <LoadError>Settings could not be loaded. Check your database connection.</LoadError>
        </div>
      )}

      <div className="space-y-8">
        {ADMIN_PAGE_GROUPS.map((group) => (
          <section key={group.id} aria-labelledby={`pages-${group.id}`}>
            <h2 id={`pages-${group.id}`} className="mb-3 font-display text-lg font-semibold text-foreground">
              {group.label}
            </h2>
            <div className="overflow-x-auto rounded-2xl border border-border bg-card">
              <table className="w-full min-w-[620px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-muted-foreground uppercase tracking-wider font-mono">
                    <th scope="col" className="px-5 py-3 font-medium">Page</th>
                    <th scope="col" className="px-5 py-3 font-medium">URL</th>
                    <th scope="col" className="px-5 py-3 font-medium">Sections</th>
                    <th scope="col" className="px-5 py-3 text-right font-medium">Visibility</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {group.pages.map((page) => {
                    const isHome = page.key === 'home'
                    const isVisible = isHome ? true : visibility[page.key] !== false
                    const isToggling = togglingKey === page.key

                    return (
                      <tr key={page.key} className="hover:bg-muted/20">
                        <td className="px-5 py-3.5">
                          <Link
                            to="/admin/pages/$page"
                            params={{ page: page.key }}
                            className="font-medium text-foreground underline-offset-2 hover:underline hover:text-signal-400"
                          >
                            {page.label}
                          </Link>
                        </td>
                        <td className="px-5 py-3.5">
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
                        <td className="px-5 py-3.5 text-muted-foreground">
                          {page.sections ? SECTION_PAGES[page.sections].label : '—'}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          {isHome ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/40 px-2.5 py-1 font-mono text-xs text-muted-foreground">
                              <Lock className="size-3" />
                              Always visible
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleToggle(page.key, isVisible)}
                              disabled={isToggling}
                              title={isVisible ? 'Click to Hide this page' : 'Click to Show this page'}
                              className={cn(
                                'inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-mono text-xs font-semibold transition-all',
                                isVisible
                                  ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                                  : 'border border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20',
                                isToggling && 'opacity-50 cursor-wait',
                              )}
                            >
                              {isVisible ? (
                                <>
                                  <Eye className="size-3.5" />
                                  Visible
                                </>
                              ) : (
                                <>
                                  <EyeOff className="size-3.5" />
                                  Hidden
                                </>
                              )}
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>
        ))}
      </div>
    </>
  )
}
