import { createFileRoute, Link, notFound, useRouter } from '@tanstack/react-router'
import { ArrowUpRight, Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import type { ReactNode } from 'react'
import { AdminPageHeader, LoadError, Panel, SaveAllActions } from '~/components/admin/admin-ui'
import { DevicesContentEditor, initialDevicesContent } from '~/components/admin/content/DevicesContentEditor'
import { ContactSectionEditor } from '~/components/admin/content/ContactSectionEditor'
import { FaqContentEditor } from '~/components/admin/content/FaqContentEditor'
import { HowItWorksContentEditor } from '~/components/admin/content/HowItWorksContentEditor'
import { IntroVideoEditor } from '~/components/admin/content/IntroVideoEditor'
import { PAGE_TEXT_EDITORS, isPageTextEditorKey } from '~/components/admin/content/page-text-editors'
import { SectionTextEditor } from '~/components/admin/content/SectionTextEditor'
import { PricingPlansEditor } from '~/components/admin/content/PricingPlansEditor'
import { SpecTableEditor } from '~/components/admin/content/SpecTableEditor'
import { PartnersContentEditor } from '~/components/admin/content/PartnersContentEditor'
import { MediaSlotsEditor } from '~/components/admin/MediaSlotsEditor'
import { SectionsEditor } from '~/components/admin/SectionsEditor'
import { findAdminPage, pagesSharingSections } from '~/data/admin-pages'
import { slotsForSection } from '~/data/media-slots'
import { SECTION_PAGES } from '~/data/site-sections'
import type { SectionDef } from '~/data/site-sections'
import { useSaveAll } from '~/hooks/use-save-all'
import { resolveSectionContent, sectionContentKey } from '~/lib/section-content'
import { listMediaLibraryFn } from '~/server/functions/media-admin'
import { getSiteAdminDataFn, togglePageVisibilityFn } from '~/server/functions/site-admin'
import { cn } from '~/lib/cn'

export const Route = createFileRoute('/admin/pages/$page')({
  loader: {
    staleReloadMode: 'blocking',
    handler: async ({ params }) => {
      const found = findAdminPage(params.page)
      if (!found) throw notFound()
      const [settings, media] = await Promise.all([getSiteAdminDataFn(), listMediaLibraryFn()])
      return { ...found, settings, media }
    },
  },
  component: PageEditor,
})

const LOAD_ERROR = 'Settings could not be loaded. Check DATABASE_URL and that migrations have run.'

function PageEditor() {
  const router = useRouter()
  const { page, group, settings, media } = Route.useLoaderData()
  const shared = pagesSharingSections(page)
  const { bind, save, state, isDirty } = useSaveAll()

  const rawVisibility = settings.ok
    ? ((settings.content.find((c) => c.page === 'global' && c.sectionKey === 'page_visibility')?.content as Record<string, boolean> | undefined) ?? {})
    : {}
  const [isVisible, setIsVisible] = useState(page.key === 'home' ? true : rawVisibility[page.key] !== false)
  const [togglingVisibility, setTogglingVisibility] = useState(false)

  const handleToggleVisibility = async () => {
    if (page.key === 'home') return
    const next = !isVisible
    setIsVisible(next)
    setTogglingVisibility(true)
    try {
      const res = await togglePageVisibilityFn({ data: { pageKey: page.key, visible: next } })
      if (!res.ok) setIsVisible(!next)
      else await router.invalidate()
    } catch {
      setIsVisible(!next)
    } finally {
      setTogglingVisibility(false)
    }
  }

  const defs: readonly SectionDef[] = page.sections ? SECTION_PAGES[page.sections].sections : []
  const [picked, setSelected] = useState('')
  // Falls back to the first section when the pick is not on this page (e.g. after moving to another page).
  const selected = defs.some((d) => d.key === picked) ? picked : (defs[0]?.key ?? '')
  const sections = bind('sections')
  const pageSlots = slotsForSection(page.key, undefined)

  // One image editor per section, all mounted so picks survive switching sections until Save.
  const imageEditor = (sectionKey: string | undefined) => {
    const slots = slotsForSection(page.key, sectionKey)
    if (!slots.length || !media.ok) return null
    const binding = bind(`images:${sectionKey ?? ''}`)
    return (
      <MediaSlotsEditor
        ref={binding.ref}
        onDirtyChange={binding.onDirtyChange}
        pageKey={page.key}
        slots={slots}
        assets={media.assets}
        saved={media.slots}
      />
    )
  }

  // The text and items of a section, for sections listed in src/lib/section-content.ts.
  const contentEditor = (sectionKey: string) => {
    if (!page.sections || !settings.ok || !media.ok) return null
    const key = sectionContentKey(page.sections, sectionKey)
    if (!key) return null
    const stored = settings.content.find((c) => `${c.page}:${c.sectionKey}` === key)?.content
    const binding = bind(`content:${key}`)
    const common = { ref: binding.ref, onDirtyChange: binding.onDirtyChange, assets: media.assets }
    if (isPageTextEditorKey(key)) {
      const editor = PAGE_TEXT_EDITORS[key]
      const text = (
        <SectionTextEditor
          {...common}
          contentKey={key}
          name={editor.name}
          spec={editor.spec}
          initial={resolveSectionContent(key, stored)}
        />
      )
      // Prices and the spec table are stored on their own (other pages read them) but edited with their section.
      const dataKey = key === 'product-cms:pricing' ? 'product-cms:pricing-plans' : key === 'product-cms:specs' ? 'product-cms:spec-table' : null
      if (!dataKey) return text
      const dataStored = settings.content.find((c) => `${c.page}:${c.sectionKey}` === dataKey)?.content
      const data = bind(`content:${dataKey}`)
      return (
        <div className="space-y-8">
          {text}
          <div className="border-t border-ink-800 pt-6">
            {dataKey === 'product-cms:pricing-plans' ? (
              <PricingPlansEditor
                ref={data.ref}
                onDirtyChange={data.onDirtyChange}
                initial={resolveSectionContent(dataKey, dataStored)}
              />
            ) : (
              <SpecTableEditor
                ref={data.ref}
                onDirtyChange={data.onDirtyChange}
                initial={resolveSectionContent(dataKey, dataStored)}
              />
            )}
          </div>
        </div>
      )
    }
    switch (key) {
      case 'home:devices':
        return <DevicesContentEditor {...common} initial={initialDevicesContent(stored, media.slots, media.assets)} />
      case 'home:hero':
        return <PartnersContentEditor {...common} initial={resolveSectionContent(key, stored)} />
      case 'home:faq':
        return <FaqContentEditor ref={binding.ref} onDirtyChange={binding.onDirtyChange} initial={resolveSectionContent(key, stored)} />
      case 'home:how-it-works':
        return <HowItWorksContentEditor ref={binding.ref} onDirtyChange={binding.onDirtyChange} initial={resolveSectionContent(key, stored)} />
      case 'home:demo-form':
        return <ContactSectionEditor ref={binding.ref} onDirtyChange={binding.onDirtyChange} initial={resolveSectionContent(key, stored)} />
      case 'product-cms:faq':
      case 'about:faq':
        return (
          <FaqContentEditor
            ref={binding.ref}
            onDirtyChange={binding.onDirtyChange}
            contentKey={key}
            initial={resolveSectionContent(key, stored)}
          />
        )
      case 'product-cms:intro-video':
        return <IntroVideoEditor {...common} initial={resolveSectionContent(key, stored)} />
    }
  }

  return (
    <>
      <AdminPageHeader
        title={page.label}
        description={`${group.label} · ${page.path}`}
        actions={
          <SaveAllActions state={state} isDirty={isDirty} onSave={() => void save()}>
            {page.key !== 'home' && (
              <button
                type="button"
                onClick={handleToggleVisibility}
                disabled={togglingVisibility}
                title={isVisible ? 'Click to hide this page site-wide' : 'Click to make this page visible site-wide'}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
                  isVisible
                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                    : 'border-rose-500/40 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20',
                  togglingVisibility && 'opacity-50 cursor-wait',
                )}
              >
                {isVisible ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                {isVisible ? 'Visible' : 'Hidden'}
              </button>
            )}
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
          </SaveAllActions>
        }
      />

      {!settings.ok ? (
        <LoadError>{LOAD_ERROR}</LoadError>
      ) : page.sections ? (
        <div className="grid items-start gap-6 lg:grid-cols-[18rem_minmax(0,1fr)]">
          <div className="lg:sticky lg:top-6">
            {/* Keyed so moving between pages starts from that page's saved order. */}
            <SectionsEditor
              key={page.key}
              ref={sections.ref}
              onDirtyChange={sections.onDirtyChange}
              page={page.sections}
              saved={settings.sections}
              selected={selected}
              onSelect={setSelected}
              notice={shared.length > 0 ? `Shared with ${shared.map((p) => p.label).join(', ')}.` : undefined}
            />
          </div>

          <div key={page.key} className="min-w-0">
            {defs.map((def) => (
              <div key={def.key} hidden={def.key !== selected}>
                <SectionDetail def={def} content={contentEditor(def.key)} images={imageEditor(def.key)} />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div key={page.key} className="max-w-5xl">
          {pageSlots.length > 0 ? (
            <Panel title="Images" description="Choose an image from the library for each place on this page.">
              {media.ok ? imageEditor(undefined) : <LoadError>{LOAD_ERROR}</LoadError>}
            </Panel>
          ) : (
            <Panel title="Nothing to change here">
              <p className="text-sm text-muted-foreground">This page has no sections or images that can be changed.</p>
            </Panel>
          )}
        </div>
      )}

      <p className="mt-6 text-sm text-muted-foreground">
        How this page shows in Google is set in{' '}
        <Link to="/admin/seo" className="font-medium text-signal-400 underline-offset-2 hover:underline">
          SEO &amp; GEO
        </Link>
        .
      </p>
    </>
  )
}

/** The selected section: what it is, why it might not show, and what can be changed in it. */
function SectionDetail({ def, content, images }: { def: SectionDef; content: ReactNode; images: ReactNode }) {
  return (
    <Panel title={def.label} description={def.locked ? 'Always shown: it holds the page heading or its main call to action.' : undefined}>
      {def.note && <p className="mb-4 rounded-lg bg-ink-950 px-3 py-2 text-xs text-ink-400">{def.note}</p>}
      {content}
      {images && (
        <section aria-label={`${def.label} images`} className={content ? 'mt-6' : undefined}>
          <h3 className="mb-2 text-sm font-semibold text-ink-200">Images</h3>
          {images}
        </section>
      )}
      {!content && !images && <p className="text-sm text-muted-foreground">Nothing in this section can be changed here yet.</p>}
    </Panel>
  )
}
