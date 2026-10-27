import { Suspense, lazy, useEffect, useRef, useState } from 'react'
import type { ComponentProps } from 'react'
import type { SubscribeForm as SubscribeFormComponent } from '~/components/blocks/SubscribeForm'

const SubscribeForm = lazy(() => import('~/components/blocks/SubscribeForm').then((m) => ({ default: m.SubscribeForm })))

// Start loading well before the form scrolls into view, so it is swapped in
// off screen and the swap never counts as a layout shift.
const LOAD_MARGIN = '800px 0px'

/**
 * SubscribeForm for the bottom of a page (home, blog). The form brings TanStack
 * Form, the schema and Turnstile, so it loads only as the visitor scrolls
 * toward it. Forms are not indexable content, so the SSR HTML only carries an
 * empty box of about the same height.
 */
export function LazySubscribeForm({ className, ...props }: ComponentProps<typeof SubscribeFormComponent>) {
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

  const placeholder = <div aria-hidden="true" className="min-h-48" />

  return (
    // The spacing sits on the wrapper so the placeholder takes the same room as the form.
    <div ref={ref} className={className}>
      {near ? (
        <Suspense fallback={placeholder}>
          <SubscribeForm {...props} />
        </Suspense>
      ) : (
        placeholder
      )}
    </div>
  )
}
