import { createFileRoute } from '@tanstack/react-router'
import { ArrowUpRight } from 'lucide-react'
import { AdminPageHeader, LoadError, Panel, SaveAllActions } from '~/components/admin/admin-ui'
import { SeoSnippetEditor } from '~/components/admin/SeoSnippetEditor'
import { SeoGuide } from '~/components/admin/seo/SeoGuide'
import { ADMIN_PAGE_GROUPS } from '~/data/admin-pages'
import { pageDefaults } from '~/data/page-content'
import { useSaveAll } from '~/hooks/use-save-all'
import { AI_CRAWLER_POLICY, AI_CRAWLERS } from '~/lib/seo/site-pages'
import { useSiteConfig } from '~/lib/use-site-config'
import { getSiteAdminDataFn } from '~/server/functions/site-admin'

export const Route = createFileRoute('/admin/seo')({
  loader: {
    staleReloadMode: 'blocking',
    handler: () => getSiteAdminDataFn(),
  },
  component: SeoModule,
})

/** Generated files AI assistants and search engines read; nothing here is edited by hand. */
const MACHINE_FILES = [
  { href: '/llms.txt', label: 'llms.txt', purpose: 'Short summary of Viewixsoft and its key pages for AI assistants.' },
  { href: '/llms-full.txt', label: 'llms-full.txt', purpose: 'The full text of products, use cases and posts in one file.' },
  { href: '/products/cms.md', label: 'Markdown pages', purpose: 'Each content page also exists as plain text, e.g. /products/cms.md.' },
  { href: '/robots.txt', label: 'robots.txt', purpose: 'Tells search and AI bots which pages they may read.' },
  { href: '/sitemap.xml', label: 'sitemap.xml', purpose: 'Lists every public page so search engines find them.' },
]

function SeoModule() {
  const data = Route.useLoaderData()
  const config = useSiteConfig()
  const { bind, save, state, isDirty } = useSaveAll()

  return (
    <>
      <AdminPageHeader
        title="SEO & GEO"
        description="How your pages show up in Google search and in AI assistants such as ChatGPT, Claude and Perplexity."
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <SeoGuide />
            <SaveAllActions state={state} isDirty={isDirty} onSave={() => void save()} />
          </div>
        }
      />

      {data.ok ? (
        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
          <Panel
            title="Search appearance (SEO)"
            description="The blue title and grey text Google shows for each page. Every page already has a good default; change it only when you want different wording."
          >
            <div className="space-y-6">
              {ADMIN_PAGE_GROUPS.map((group) => (
                <section key={group.id} aria-labelledby={`seo-${group.id}`}>
                  <h3 id={`seo-${group.id}`} className="mb-2 text-sm font-semibold text-muted-foreground">
                    {group.label}
                  </h3>
                  <ul className="divide-y divide-border rounded-xl border border-border bg-background">
                    {group.pages.map((page) => {
                      // Product defaults depend on the product's current release status.
                      const defaults = pageDefaults(page.key, config.products)
                      if (!defaults) return null
                      const binding = bind(page.key)
                      return (
                        <SeoSnippetEditor
                          key={page.key}
                          ref={binding.ref}
                          onDirtyChange={binding.onDirtyChange}
                          page={page}
                          defaults={defaults}
                          saved={data.pages.find((p) => p.key === page.key)}
                        />
                      )
                    })}
                  </ul>
                </section>
              ))}
            </div>
          </Panel>

          <div className="min-w-0 xl:sticky xl:top-6">
            <Panel
              title="AI search (GEO)"
              description="GEO helps AI assistants read, quote and recommend Viewixsoft. It runs automatically: the files below are built from the site's content, so there is nothing to fill in."
            >
              <dl className="rounded-xl border border-border bg-background p-4 text-sm">
                <dt className="text-muted-foreground">AI bots reading the site</dt>
                <dd className="mt-1 font-medium text-foreground">
                  {AI_CRAWLER_POLICY === 'allow' ? 'Allowed' : 'Blocked'}
                  <span className="font-normal text-muted-foreground"> · {AI_CRAWLERS.length} bots listed in robots.txt</span>
                </dd>
                <dd className="mt-3 flex flex-wrap gap-1.5">
                  {AI_CRAWLERS.map((bot) => (
                    <span key={bot} className="rounded-md border border-border px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">
                      {bot}
                    </span>
                  ))}
                </dd>
              </dl>

              <ul className="mt-4 divide-y divide-border rounded-xl border border-border bg-background">
                {MACHINE_FILES.map((file) => (
                  <li key={file.href} className="px-4 py-3">
                    <a
                      href={file.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-mono text-sm text-signal-400 hover:underline"
                    >
                      {file.label}
                      <ArrowUpRight aria-hidden="true" className="size-3.5" />
                      <span className="sr-only">(opens in a new tab)</span>
                    </a>
                    <p className="mt-0.5 text-xs text-muted-foreground">{file.purpose}</p>
                  </li>
                ))}
              </ul>

              <p className="mt-4 text-xs text-muted-foreground">
                Blocking AI bots is a business decision, so it is not a switch here. Ask your developer if you want to
                change it.
              </p>
            </Panel>
          </div>
        </div>
      ) : (
        <LoadError>Settings could not be loaded. Check DATABASE_URL and that migrations have run.</LoadError>
      )}
    </>
  )
}
