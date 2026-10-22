import { Link, useRouterState } from '@tanstack/react-router'
import { ChevronRight, Loader2, PanelsTopLeft } from 'lucide-react'
import { useEffect, useId, useState } from 'react'
import { ADMIN_PAGE_GROUPS } from '~/data/admin-pages'
import { cn } from '~/lib/cn'

const itemClass =
  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-background hover:text-foreground'
const activeProps = {
  className: 'bg-background text-foreground shadow-sm ring-1 ring-border',
  'aria-current': 'page' as const,
}

/** Collapsible "Pages" tree: every public page, grouped, each linking to its editor. */
export function PagesNavTree({ onNavigate, isPending }: { onNavigate?: () => void; isPending: (to: string) => boolean }) {
  const uid = useId()
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const inPages = pathname.startsWith('/admin/pages')
  const currentKey = pathname.match(/^\/admin\/pages\/([^/]+)/)?.[1]
  const currentGroup = ADMIN_PAGE_GROUPS.find((g) => g.pages.some((p) => p.key === currentKey))?.id

  const [open, setOpen] = useState(inPages)
  const [openGroups, setOpenGroups] = useState<Set<string>>(() => new Set(currentGroup ? [currentGroup] : ['main']))

  // Follow navigation: opening a page from elsewhere expands its branch.
  useEffect(() => {
    if (inPages) setOpen(true)
    if (currentGroup) setOpenGroups((s) => (s.has(currentGroup) ? s : new Set(s).add(currentGroup)))
  }, [inPages, currentGroup])

  const toggleGroup = (id: string) =>
    setOpenGroups((s) => {
      const next = new Set(s)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  return (
    <li>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={`${uid}-tree`}
        className={cn(itemClass, 'w-full', inPages && 'text-foreground')}
      >
        <PanelsTopLeft aria-hidden="true" className="size-4 shrink-0" />
        <span className="flex-1 text-left">Pages</span>
        <ChevronRight aria-hidden="true" className={cn('size-4 transition-transform motion-reduce:transition-none', open && 'rotate-90')} />
      </button>

      {open && (
        <ul id={`${uid}-tree`} className="mt-0.5 ml-5 space-y-0.5 border-l border-border pl-2">
          <li>
            <Link to="/admin/pages" onClick={onNavigate} activeOptions={{ exact: true }} className={itemClass} activeProps={activeProps}>
              All pages
            </Link>
          </li>
          {ADMIN_PAGE_GROUPS.map((group) => {
            const groupOpen = openGroups.has(group.id)
            return (
              <li key={group.id}>
                <button
                  type="button"
                  onClick={() => toggleGroup(group.id)}
                  aria-expanded={groupOpen}
                  aria-controls={`${uid}-${group.id}`}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-left font-mono text-[10px] tracking-[0.12em] text-muted-foreground uppercase hover:text-foreground"
                >
                  <ChevronRight
                    aria-hidden="true"
                    className={cn('size-3 transition-transform motion-reduce:transition-none', groupOpen && 'rotate-90')}
                  />
                  {group.label}
                  <span className="ml-auto opacity-70">{group.pages.length}</span>
                </button>
                {groupOpen && (
                  <ul id={`${uid}-${group.id}`} className="space-y-0.5">
                    {group.pages.map((page) => (
                      <li key={page.key}>
                        <Link
                          to="/admin/pages/$page"
                          params={{ page: page.key }}
                          onClick={onNavigate}
                          className={cn(itemClass, 'py-1.5 pl-6')}
                          activeProps={activeProps}
                        >
                          <span className="truncate">{page.label}</span>
                          {isPending(`/admin/pages/${page.key}`) && (
                            <Loader2 aria-hidden="true" className="ml-auto size-3.5 shrink-0 animate-spin motion-reduce:animate-none" />
                          )}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </li>
  )
}
