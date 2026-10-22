import { Link } from '@tanstack/react-router'
import { ChevronRight } from 'lucide-react'

export interface BreadcrumbItem {
  name: string
  path: string
}

/** Visible trail matching the page's BreadcrumbList JSON-LD; the last item is the current page. */
export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-2 text-xs text-ink-400">
        {items.map((item, i) => {
          const last = i === items.length - 1
          return (
            <li key={item.path} className="flex min-w-0 items-center gap-2">
              {last ? (
                <span aria-current="page" className="truncate font-semibold text-signal-400">
                  {item.name}
                </span>
              ) : (
                <>
                  <Link to={item.path} className="hover:text-ink-200">
                    {item.name}
                  </Link>
                  <ChevronRight aria-hidden="true" className="size-3.5 text-ink-600" />
                </>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
