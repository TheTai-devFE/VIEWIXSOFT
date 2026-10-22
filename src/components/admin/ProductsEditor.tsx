import { useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { Panel, SaveStatus, selectClass } from '~/components/admin/admin-ui'
import type { SaveState } from '~/components/admin/admin-ui'
import { PRODUCTS } from '~/content/products'
import { PRODUCT_STATUSES } from '~/lib/enums'
import type { ProductStatus } from '~/lib/enums'
import { saveProductStatusFn } from '~/server/functions/site-admin'

const LABELS: Record<ProductStatus, string> = {
  available: 'Available (full page, demo CTA)',
  'coming-soon': 'Coming soon (launch sign-up)',
  hidden: 'Hidden (404, removed from menus and sitemap)',
}

/** Release state per product; changes apply site-wide within a minute. */
export function ProductsEditor({ saved }: { saved: { slug: string; status: ProductStatus }[] }) {
  const router = useRouter()
  const [state, setState] = useState<SaveState>({ kind: 'idle' })
  const current = (slug: string, fallback: ProductStatus) => saved.find((s) => s.slug === slug)?.status ?? fallback

  return (
    <Panel
      title="Products"
      description="Only mark a product available once it can be bought. Hidden products return 404."
    >
      <ul className="space-y-3">
        {PRODUCTS.map((p) => (
          <li key={p.slug} className="flex flex-wrap items-center justify-between gap-3">
            <label htmlFor={`product-status-${p.slug}`} className="text-sm font-medium text-ink-50">
              {p.name}
            </label>
            <select
              id={`product-status-${p.slug}`}
              defaultValue={current(p.slug, p.status)}
              onChange={async (e) => {
                const status = PRODUCT_STATUSES.find((s) => s === e.target.value)
                if (!status) return
                setState({ kind: 'saving' })
                try {
                  const res = await saveProductStatusFn({ data: { slug: p.slug, status } })
                  if (!res.ok) return setState({ kind: 'error', message: res.error })
                  setState({ kind: 'saved' })
                  await router.invalidate()
                } catch {
                  setState({ kind: 'error', message: 'Saving failed. Check your connection.' })
                }
              }}
              className={selectClass}
            >
              {PRODUCT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {LABELS[s]}
                </option>
              ))}
            </select>
          </li>
        ))}
      </ul>
      <div className="mt-4">
        <SaveStatus state={state} />
      </div>
    </Panel>
  )
}
