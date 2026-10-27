import { Suspense, lazy, useEffect, useRef, useState } from 'react'
import type { ComponentProps } from 'react'
import type { LeadForm as LeadFormComponent } from '~/components/blocks/LeadForm'

const LeadForm = lazy(() => import('~/components/blocks/LeadForm').then((m) => ({ default: m.LeadForm })))

// Start loading well before the form scrolls into view, so it is swapped in
// off screen and the swap never counts as a layout shift.
const LOAD_MARGIN = '800px 0px'

/**
 * LeadForm for pages where it sits far below the fold (e.g. /products/cms).
 * The form brings TanStack Form, the lead schema and the animated Select, so
 * it loads only as the visitor scrolls toward it. Forms are not indexable
 * content, so the SSR HTML only carries a box of the same footprint.
 */
export function LazyLeadForm(props: ComponentProps<typeof LeadFormComponent>) {
  const ref = useRef<HTMLDivElement>(null)
  const [near, setNear] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (typeof IntersectionObserver === 'undefined') {
      setNear(true)
      return
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return
        setNear(true)
        observer.disconnect()
      },
      { rootMargin: LOAD_MARGIN },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const placeholder = <div aria-hidden="true" className="min-h-144 rounded-3xl border border-ink-800 bg-ink-900" />

  return (
    <div ref={ref}>
      {near ? (
        <Suspense fallback={placeholder}>
          <LeadForm {...props} />
        </Suspense>
      ) : (
        placeholder
      )}
    </div>
  )
}
