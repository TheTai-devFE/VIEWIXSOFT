import { createFileRoute, notFound, Link } from '@tanstack/react-router'
import { ArrowRight, Calendar, CheckCircle2, Clock, RefreshCw } from 'lucide-react'
import { CtaBand } from '~/components/blocks/CtaBand'
import { FaqAccordion } from '~/components/blocks/FaqAccordion'
import { NewsletterSignup } from '~/components/blocks/NewsletterSignup'
import { PostBody, postBodyPromise } from '~/components/blog/post-body'
import { Breadcrumbs } from '~/components/layout/Breadcrumbs'
import { BLOG_POSTS } from '~/content/blog'
import { PRODUCTS } from '~/content/products'
import { getArticleSchema, getBreadcrumbSchema, getFaqSchema } from '~/lib/seo/jsonld'
import { generateMetaTags, SITE_URL } from '~/lib/seo/meta'
import { blogPostSeo } from '~/lib/seo/page-seo'

const formatDate = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })

export const Route = createFileRoute('/blog/$slug')({
  loader: async ({ params }) => {
    const post = BLOG_POSTS.find((p) => p.slug === params.slug)
    if (!post) throw notFound()
    // Load the compiled MDX before rendering so the full text is in the SSR HTML.
    await postBodyPromise(post.slug)
    const relatedPosts = BLOG_POSTS.filter((p) => p.slug !== post.slug)
      .sort((a, b) => Number(b.product === post.product) - Number(a.product === post.product))
      .slice(0, 2)
    const productName = PRODUCTS.find((p) => p.slug === post.product)?.name ?? post.product
    return { post, relatedPosts, productName }
  },
  head: ({ loaderData }) => {
    if (!loaderData?.post) return {}
    const p = loaderData.post
    const seo = generateMetaTags({
      ...blogPostSeo(p),
      canonicalUrl: `/blog/${p.slug}`,
      ogType: 'article',
      ogImage: `${SITE_URL}${p.cover.src}`,
      markdownPath: `/blog/${p.slug}.md`,
      noindex: p.draft,
    })
    const breadcrumbs = [
      { name: 'Home', path: '/' },
      { name: 'Blog', path: '/blog' },
      { name: p.title, path: `/blog/${p.slug}` },
    ]
    return {
      meta: [
        ...seo.meta,
        { property: 'article:published_time', content: p.publishedAt },
        { property: 'article:modified_time', content: p.updatedAt },
      ],
      links: seo.links,
      scripts: [
        {
          type: 'application/ld+json',
          children: JSON.stringify(
            getArticleSchema({
              title: p.title,
              description: p.description,
              path: `/blog/${p.slug}`,
              publishedAt: p.publishedAt,
              updatedAt: p.updatedAt,
              authorName: p.author.name,
              authorType: p.author.kind === 'person' ? 'Person' : 'Organization',
              image: p.cover.src,
              keywords: p.tags,
            }),
          ),
        },
        { type: 'application/ld+json', children: JSON.stringify(getBreadcrumbSchema(breadcrumbs)) },
        ...(p.faq?.length ? [{ type: 'application/ld+json', children: JSON.stringify(getFaqSchema(p.faq)) }] : []),
      ],
    }
  },
  component: BlogPostPage,
})

function BlogPostPage() {
  const { post, relatedPosts, productName } = Route.useLoaderData()

  return (
    <div className="mx-auto max-w-6xl space-y-12 px-4 py-12 sm:px-6 md:py-20 lg:px-8">
      <Breadcrumbs
        items={[
          { name: 'Home', path: '/' },
          { name: 'Blog', path: '/blog' },
          { name: post.title, path: `/blog/${post.slug}` },
        ]}
      />

      <header className="max-w-3xl space-y-6">
        {post.draft && (
          <p className="inline-block rounded-full border border-dashed border-ink-600 px-3 py-1 font-mono text-xs text-ink-400">
            Draft: visible in the dev server only
          </p>
        )}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-ink-400">
          <Link
            to="/products/$slug"
            params={{ slug: post.product }}
            className="rounded-full border border-signal-800 bg-signal-950 px-3 py-1 font-mono font-medium text-signal-300 hover:text-signal-200"
          >
            {productName}
          </Link>
          <span className="flex items-center gap-1.5">
            <Calendar aria-hidden="true" className="size-3.5" />
            Published <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
          </span>
          {post.updatedAt !== post.publishedAt && (
            <span className="flex items-center gap-1.5">
              <RefreshCw aria-hidden="true" className="size-3.5" />
              Updated <time dateTime={post.updatedAt}>{formatDate(post.updatedAt)}</time>
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <Clock aria-hidden="true" className="size-3.5" />
            {post.readingMinutes} min read
          </span>
        </div>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-balance text-ink-50 sm:text-5xl">
          {post.title}
        </h1>
        <p className="text-lg text-pretty text-ink-300">{post.description}</p>
        <p className="text-sm text-ink-400">
          By <span className="font-semibold text-ink-100">{post.author.name}</span>, {post.author.role}
        </p>
      </header>

      <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_16rem]">
        <div className="min-w-0 space-y-10">
          <section
            aria-labelledby="takeaways-title"
            className="space-y-4 rounded-2xl border border-signal-800 bg-ink-950 p-6 sm:p-8"
          >
            <h2 id="takeaways-title" className="font-mono text-xs font-bold tracking-wider text-signal-400 uppercase">
              Key takeaways
            </h2>
            <ul className="space-y-2.5">
              {post.keyTakeaways.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-ink-200">
                  <CheckCircle2 aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-signal-400" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <article className="space-y-6 text-base">
            <PostBody slug={post.slug} />
          </article>

          {post.faq && post.faq.length > 0 && (
            <section aria-labelledby="post-faq-title" className="space-y-6 border-t border-ink-800 pt-10">
              <h2 id="post-faq-title" className="font-display text-2xl font-semibold tracking-tight text-ink-50">
                Frequently asked questions
              </h2>
              <FaqAccordion items={post.faq} />
            </section>
          )}

          <aside aria-label="About the author" className="flex items-start gap-4 rounded-2xl border border-ink-800 p-6">
            <img
              src={post.author.avatar}
              alt=""
              width={56}
              height={56}
              loading="lazy"
              className="size-14 shrink-0 rounded-xl border border-ink-800 object-cover"
            />
            <div>
              <p className="font-semibold text-ink-50">Written by {post.author.name}</p>
              <p className="text-xs text-signal-400">{post.author.role}</p>
              <p className="mt-2 text-sm text-ink-400">{post.author.bio}</p>
            </div>
          </aside>
        </div>

        {post.toc.length > 1 && (
          <nav aria-labelledby="toc-title" className="hidden lg:block">
            <div className="sticky top-24 space-y-3">
              <h2 id="toc-title" className="font-mono text-xs font-bold tracking-wider text-ink-500 uppercase">
                On this page
              </h2>
              <ol className="space-y-2 border-l border-ink-800 text-sm">
                {post.toc.map((item) => (
                  <li key={item.id} className={item.depth === 3 ? 'pl-7' : 'pl-4'}>
                    <a href={`#${item.id}`} className="text-ink-400 hover:text-ink-50">
                      {item.text}
                    </a>
                  </li>
                ))}
              </ol>
            </div>
          </nav>
        )}
      </div>

      {relatedPosts.length > 0 && (
        <section aria-labelledby="related-title" className="space-y-6 border-t border-ink-800 pt-12">
          <h2 id="related-title" className="font-display text-xl font-semibold text-ink-50">
            Related posts
          </h2>
          <ul className="grid gap-6 sm:grid-cols-2">
            {relatedPosts.map((rel) => (
              <li key={rel.slug}>
                <Link
                  to="/blog/$slug"
                  params={{ slug: rel.slug }}
                  className="group flex h-full flex-col justify-between gap-3 rounded-2xl border border-ink-800 p-6 transition-colors hover:border-signal-500"
                >
                  <span className="font-mono text-[11px] text-signal-400">{rel.category}</span>
                  <span className="font-semibold text-ink-50 group-hover:text-signal-400">{rel.title}</span>
                  <span className="flex items-center gap-1 font-mono text-xs text-ink-400">
                    Read post <ArrowRight aria-hidden="true" className="size-3.5 text-signal-400" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <NewsletterSignup />
      <CtaBand />
    </div>
  )
}
