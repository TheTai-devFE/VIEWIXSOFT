import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'
import type { ReactNode, Ref } from 'react'
import { buttonSecondary } from '~/components/admin/admin-ui'
import type { EditorHandle } from '~/components/admin/admin-ui'
import { ContentField } from '~/components/admin/content/ContentField'
import { useSectionDraft } from '~/components/admin/content/use-section-draft'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { formatUsd } from '~/data/pricing'
import { cn } from '~/lib/cn'
import type { PricingPlans } from '~/lib/section-content'

const KEY = 'product-cms:pricing-plans'
const MAX_FEATURES = 8
const MAX_VOLUME = 6
const newId = (prefix: string) => `${prefix}-${Date.now().toString(36)}`

type VolumeDiscount = PricingPlans['customerServer']['volumeDiscounts'][number]

/** A number input; an empty box is kept as NaN so the schema can say what is missing. */
function NumberField({
  id,
  label,
  value,
  onChange,
  error,
  unit,
  step = 'any',
  hint,
}: {
  id: string
  label: string
  value: number
  onChange: (value: number) => void
  error?: string
  /** Shown inside the box: "$" before, "%" after. */
  unit?: '$' | '%'
  step?: string
  hint?: string
}) {
  const describedBy = [error && `${id}-error`, hint && `${id}-hint`].filter(Boolean).join(' ') || undefined
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <div className="relative mt-1.5">
        {unit === '$' && (
          <span aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-ink-500">
            $
          </span>
        )}
        <Input
          id={id}
          type="number"
          inputMode="decimal"
          min={0}
          step={step}
          value={Number.isNaN(value) ? '' : value}
          onChange={(e) => onChange(e.target.value === '' ? Number.NaN : Number(e.target.value))}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn('h-9 bg-background', unit === '$' && 'pl-7', unit === '%' && 'pr-8')}
        />
        {unit === '%' && (
          <span aria-hidden="true" className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-ink-500">
            %
          </span>
        )}
      </div>
      {hint && (
        <p id={`${id}-hint`} className="mt-1 text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="mt-1 text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}

function Group({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <fieldset className="rounded-xl border border-ink-800 p-4">
      <legend className="px-1 text-sm font-semibold text-ink-200">{title}</legend>
      {hint && <p className="mb-3 text-xs text-muted-foreground">{hint}</p>}
      {children}
    </fieldset>
  )
}

/**
 * Viewixsoft CMS prices. They show on this page, on /pricing, in the home
 * price summary, in the pricing FAQ, in search results and in llms-full.txt.
 */
export function PricingPlansEditor({
  initial,
  ref,
  onDirtyChange,
}: {
  initial: PricingPlans
  ref?: Ref<EditorHandle>
  onDirtyChange?: (dirty: boolean) => void
}) {
  const { values, update, errorAt, idFor } = useSectionDraft({ contentKey: KEY, name: 'Prices', initial, ref, onDirtyChange })
  const { termPlans, termFeatures, customerServer, sales } = values
  const arrowButton = cn(buttonSecondary, 'size-7 p-0')
  const best = termPlans.findIndex((t) => t.bestValue)

  const setPlan = (index: number, patch: Partial<PricingPlans['termPlans'][number]>) =>
    update((v) => ({ ...v, termPlans: v.termPlans.map((t, i) => (i === index ? { ...t, ...patch } : t)) }))
  const setServer = (patch: Partial<PricingPlans['customerServer']>) =>
    update((v) => ({ ...v, customerServer: { ...v.customerServer, ...patch } }))
  const setServerList = (fn: (list: VolumeDiscount[]) => VolumeDiscount[]) =>
    update((v) => ({ ...v, customerServer: { ...v.customerServer, volumeDiscounts: fn(v.customerServer.volumeDiscounts) } }))
  const setVolume = (index: number, patch: Partial<VolumeDiscount>) =>
    setServerList((list) => list.map((d, i) => (i === index ? { ...d, ...patch } : d)))
  const setFeatures = (fn: (list: PricingPlans['termFeatures']) => PricingPlans['termFeatures']) =>
    update((v) => ({ ...v, termFeatures: fn(v.termFeatures) }))
  const moveFeature = (from: number, to: number) =>
    setFeatures((list) => {
      const next = [...list]
      const [moved] = next.splice(from, 1)
      if (moved) next.splice(to, 0, moved)
      return next
    })

  return (
    // Enter in a field saves through the header button's handler, not a second path.
    <form noValidate onSubmit={(e) => e.preventDefault()} className="space-y-5">
      <p className="rounded-lg border border-warning/40 bg-ink-950 px-3 py-2 text-xs text-ink-300">
        These prices show everywhere on the site: this page, /pricing, the home price summary, the pricing FAQ, search
        results and the summary for AI assistants. Prices are in USD.
      </p>

      <Group title="Cloud plans (price per licence for the whole term)">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {termPlans.map((plan, i) => {
            const label = plan.years === 1 ? '1 year' : `${plan.years} years`
            return (
              <div key={plan.years} className="space-y-3 rounded-lg border border-ink-800 p-3">
                <p className="text-sm font-semibold text-ink-100">{label}</p>
                <NumberField
                  id={idFor(`termPlans.${i}.price`)}
                  label="Price"
                  unit="$"
                  value={plan.price}
                  onChange={(price) => setPlan(i, { price })}
                  error={errorAt(`termPlans.${i}.price`)}
                  hint={Number.isFinite(plan.price) && plan.years > 1 ? `≈ ${formatUsd(plan.price / plan.years)} / year` : undefined}
                />
                <NumberField
                  id={idFor(`termPlans.${i}.save`)}
                  label="Save badge"
                  unit="%"
                  step="1"
                  value={plan.save}
                  onChange={(save) => setPlan(i, { save })}
                  error={errorAt(`termPlans.${i}.save`)}
                  hint="0 hides the badge."
                />
              </div>
            )
          })}
        </div>

        <div role="radiogroup" aria-label="Best value plan" className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-ink-200">
          <span className="font-semibold">“Best value” label:</span>
          {[...termPlans.map((t) => (t.years === 1 ? '1 year' : `${t.years} years`)), 'None'].map((label, i) => (
            <label key={label} className="flex items-center gap-1.5">
              <input
                type="radio"
                name="best-value"
                checked={i === termPlans.length ? best === -1 : best === i}
                onChange={() => update((v) => ({ ...v, termPlans: v.termPlans.map((t, j) => ({ ...t, bestValue: j === i })) }))}
                className="size-4 accent-signal-500"
              />
              {label}
            </label>
          ))}
        </div>
        {errorAt('termPlans') && <p className="mt-2 text-xs text-destructive">{errorAt('termPlans')}</p>}

        <div className="mt-4 max-w-xs">
          <NumberField
            id={idFor('maxOnlineLicences')}
            label="Most licences on cloud plans"
            step="1"
            value={values.maxOnlineLicences}
            onChange={(maxOnlineLicences) => update((v) => ({ ...v, maxOnlineLicences }))}
            error={errorAt('maxOnlineLicences')}
          />
        </div>
      </Group>

      <Group title="Included in every cloud plan" hint="The tick list under the plan cards.">
        <ol className="divide-y divide-ink-800 rounded-xl border border-ink-800">
          {termFeatures.map((f, i) => {
            const label = `feature ${i + 1}`
            return (
              <li key={f.id} className="flex items-start gap-3 px-3 py-2.5">
                <ContentField
                  id={idFor(`termFeatures.${i}.text`)}
                  label={label}
                  srOnlyLabel
                  className="min-w-0 flex-1"
                  value={f.text}
                  onChange={(text) => setFeatures((list) => list.map((x, j) => (j === i ? { ...x, text } : x)))}
                  onBlur={() => undefined}
                  error={errorAt(`termFeatures.${i}.text`)}
                />
                <div className="mt-1 flex shrink-0 gap-0.5">
                  <button type="button" onClick={() => moveFeature(i, i - 1)} disabled={i === 0} aria-label={`Move ${label} up`} className={arrowButton}>
                    <ArrowUp aria-hidden="true" className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveFeature(i, i + 1)}
                    disabled={i === termFeatures.length - 1}
                    aria-label={`Move ${label} down`}
                    className={arrowButton}
                  >
                    <ArrowDown aria-hidden="true" className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setFeatures((list) => list.filter((_, j) => j !== i))}
                    aria-label={`Remove ${label}`}
                    className={cn(arrowButton, 'hover:text-destructive')}
                  >
                    <Trash2 aria-hidden="true" className="size-3.5" />
                  </button>
                </div>
              </li>
            )
          })}
        </ol>
        {errorAt('termFeatures') && <p className="mt-2 text-xs text-destructive">{errorAt('termFeatures')}</p>}
        <button
          type="button"
          disabled={termFeatures.length >= MAX_FEATURES}
          onClick={() => setFeatures((list) => [...list, { id: newId('feature'), text: '' }])}
          className={cn(buttonSecondary, 'mt-3')}
        >
          <Plus aria-hidden="true" className="size-4" />
          Add feature
        </button>
      </Group>

      <Group title="Customer Server (self-hosted, price per licence)">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <NumberField
            id={idFor('customerServer.minLicences')}
            label="Minimum licences"
            step="1"
            value={customerServer.minLicences}
            onChange={(minLicences) => setServer({ minLicences })}
            error={errorAt('customerServer.minLicences')}
          />
          <NumberField
            id={idFor('customerServer.endUserPrice')}
            label="End user price"
            unit="$"
            value={customerServer.endUserPrice}
            onChange={(endUserPrice) => setServer({ endUserPrice })}
            error={errorAt('customerServer.endUserPrice')}
          />
          <ContentField
            id={idFor('customerServer.resellerDiscount')}
            label="Reseller discount (text)"
            value={customerServer.resellerDiscount}
            onChange={(resellerDiscount) => setServer({ resellerDiscount })}
            onBlur={() => undefined}
            error={errorAt('customerServer.resellerDiscount')}
          />
          <NumberField
            id={idFor('customerServer.resellerPriceFrom')}
            label="Reseller price from"
            unit="$"
            value={customerServer.resellerPriceFrom}
            onChange={(resellerPriceFrom) => setServer({ resellerPriceFrom })}
            error={errorAt('customerServer.resellerPriceFrom')}
          />
          <NumberField
            id={idFor('customerServer.resellerPriceTo')}
            label="Reseller price to"
            unit="$"
            value={customerServer.resellerPriceTo}
            onChange={(resellerPriceTo) => setServer({ resellerPriceTo })}
            error={errorAt('customerServer.resellerPriceTo')}
          />
        </div>

        <p className="mt-5 mb-2 text-sm font-semibold text-ink-200">Volume discounts</p>
        {customerServer.volumeDiscounts.length === 0 ? (
          <p className="rounded-lg border border-dashed border-ink-700 p-4 text-center text-xs text-ink-400">
            No volume discounts, so the list is hidden.
          </p>
        ) : (
          <ol className="space-y-3">
            {customerServer.volumeDiscounts.map((d, i) => (
              <li key={d.id} className="grid items-end gap-3 rounded-lg border border-ink-800 p-3 sm:grid-cols-[1fr_1fr_1fr_auto]">
                <NumberField
                  id={idFor(`customerServer.volumeDiscounts.${i}.licences`)}
                  label="From licences"
                  step="1"
                  value={d.licences}
                  onChange={(licences) => setVolume(i, { licences })}
                  error={errorAt(`customerServer.volumeDiscounts.${i}.licences`)}
                />
                <NumberField
                  id={idFor(`customerServer.volumeDiscounts.${i}.percentOff`)}
                  label="Discount"
                  unit="%"
                  step="1"
                  value={d.percentOff}
                  onChange={(percentOff) => setVolume(i, { percentOff })}
                  error={errorAt(`customerServer.volumeDiscounts.${i}.percentOff`)}
                />
                <NumberField
                  id={idFor(`customerServer.volumeDiscounts.${i}.endUserPrice`)}
                  label="End user price"
                  unit="$"
                  value={d.endUserPrice}
                  onChange={(endUserPrice) => setVolume(i, { endUserPrice })}
                  error={errorAt(`customerServer.volumeDiscounts.${i}.endUserPrice`)}
                />
                <button
                  type="button"
                  onClick={() => setServerList((list) => list.filter((_, j) => j !== i))}
                  aria-label={`Remove volume discount ${i + 1}`}
                  className={cn(arrowButton, 'mb-1 hover:text-destructive')}
                >
                  <Trash2 aria-hidden="true" className="size-3.5" />
                </button>
              </li>
            ))}
          </ol>
        )}
        <button
          type="button"
          disabled={customerServer.volumeDiscounts.length >= MAX_VOLUME}
          onClick={() =>
            setServerList((list) => [...list, { id: newId('volume'), licences: Number.NaN, percentOff: Number.NaN, endUserPrice: Number.NaN }])
          }
          className={cn(buttonSecondary, 'mt-3')}
        >
          <Plus aria-hidden="true" className="size-4" />
          Add volume discount
        </button>
      </Group>

      <Group title="Sales contact (Enterprise tab)" hint="Empty fields are hidden.">
        <div className="grid gap-4 sm:grid-cols-3">
          <ContentField
            id={idFor('sales.email')}
            label="Email"
            value={sales.email}
            onChange={(email) => update((v) => ({ ...v, sales: { ...v.sales, email } }))}
            onBlur={() => undefined}
            error={errorAt('sales.email')}
          />
          <ContentField
            id={idFor('sales.phone')}
            label="Phone"
            value={sales.phone}
            onChange={(phone) => update((v) => ({ ...v, sales: { ...v.sales, phone } }))}
            onBlur={() => undefined}
            error={errorAt('sales.phone')}
          />
          <ContentField
            id={idFor('sales.hours')}
            label="Hours"
            value={sales.hours}
            onChange={(hours) => update((v) => ({ ...v, sales: { ...v.sales, hours } }))}
            onBlur={() => undefined}
            error={errorAt('sales.hours')}
          />
        </div>
      </Group>
    </form>
  )
}
