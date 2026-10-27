import { useState } from 'react'
import { createFileRoute, notFound, Link } from '@tanstack/react-router'
import { ArrowLeft, ArrowRight, Check, ChevronDown, Share2 } from 'lucide-react'
import { CtaBand } from '~/components/blocks/CtaBand'
import { FaqAccordion } from '~/components/blocks/FaqAccordion'
import { NewsletterSignup } from '~/components/blocks/NewsletterSignup'
import { MarkdownRenderer, parseInline } from '~/components/blog/MarkdownRenderer'
import { PostBody, postBodyPromise } from '~/components/blog/post-body'
import { BLOG_POSTS } from '~/content/blog'
import { PRODUCTS } from '~/content/products'
import { getArticleSchema, getBreadcrumbSchema, getFaqSchema } from '~/lib/seo/jsonld'
import { assetUrl, generateMetaTags } from '~/lib/seo/meta'
import { blogPostSeo } from '~/lib/seo/page-seo'
import { getPublishedBlogPostBySlugFn, getPublishedBlogPostsFn } from '~/server/functions/blog'
import { blogPostFromRow } from '~/lib/blog-post-from-row'
import { getSiteConfigFn } from '~/server/functions/site'
import { isPageVisible } from '~/lib/page-visibility'

const formatDate = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  })

export const Route = createFileRoute('/blog/$slug')({
  loader: async ({ params }) => {
    const config = await getSiteConfigFn()
    if (!isPageVisible(config, 'blog')) throw notFound()

    // The database copy wins; the MDX files cover slugs it does not have.
    const [dbRes, listRes] = await Promise.all([
      getPublishedBlogPostBySlugFn({ data: { slug: params.slug } }),
      getPublishedBlogPostsFn(),
    ])
    const fromDb = dbRes.ok ? blogPostFromRow(dbRes.post, dbRes.author) : null
    const post = fromDb ?? BLOG_POSTS.find((p) => p.slug === params.slug)
    if (!post) throw notFound()
    // Load the compiled MDX before rendering so the full text is in the SSR HTML.
    if (!fromDb) await postBodyPromise(post.slug)

    // Related posts come from the admin and the MDX files alike, same product first.
    const dbPosts = listRes.ok ? listRes.posts.map((row) => blogPostFromRow(row)) : []
    const dbSlugs = new Set(dbPosts.map((p) => p.slug))
    const relatedPosts = [...dbPosts, ...BLOG_POSTS.filter((p) => !dbSlugs.has(p.slug))]
      .filter((p) => p.slug !== post.slug)
      .sort((a, b) => Number(b.product === post.product) - Number(a.product === post.product) || b.publishedAt.localeCompare(a.publishedAt))
      .slice(0, 2)
    const productName = PRODUCTS.find((p) => p.slug === post.product)?.name ?? post.product
    return { post, dbContent: dbRes.ok ? dbRes.post.content : null, relatedPosts, productName }
  },

  head: ({ loaderData }) => {
    if (!loaderData?.post) return {}
    const p = loaderData.post
    const seo = generateMetaTags({
      ...blogPostSeo(p),
      canonicalUrl: `/blog/${p.slug}`,
      ogType: 'article',
      ogImage: assetUrl(p.cover.src),
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
              authorJobTitle: p.author.role || undefined,
              authorImage: p.author.kind === 'person' ? p.author.avatar : undefined,
              authorUrl: p.author.url,
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
  const { post, dbContent, relatedPosts, productName } = Route.useLoaderData()
  const [copied, setCopied] = useState(false)

  const handleShare = async () => {
    if (typeof window === 'undefined') return
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: post.description,
          url: window.location.href,
        })
        return
      } catch {
        // Fallback to clipboard
      }
    }
    await navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const validTakeaways = post.keyTakeaways.filter(
    (t) => t && t.trim().length > 15 && t.trim() !== post.description.trim(),
  )

  return (
    <div className="page-x py-8 sm:py-12 md:py-16 space-y-10">
      {/* 1. Header Area: Back Pill + Category + Title + Meta/Share (Centered max-w-4xl) */}
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center gap-2.5">
          <Link
            to="/blog"
            className="inline-flex items-center gap-1.5 rounded-full border border-ink-800/80 bg-ink-950/60 px-3.5 py-1 text-xs font-medium text-ink-300 transition-all hover:border-ink-700 hover:text-ink-50"
          >
            <ArrowLeft className="size-3.5" />
            All posts
          </Link>
          <span className="text-xs text-ink-600">/</span>
          <Link
            to="/products/$slug"
            params={{ slug: post.product }}
            className="text-xs font-medium text-ink-400 transition-colors hover:text-ink-200"
          >
            {productName || post.category}
          </Link>
        </div>

        {/* Headline */}
        <h1 className="font-display text-4xl font-extrabold tracking-tight text-balance text-ink-50 sm:text-5xl md:text-[52px] lg:text-[56px] leading-[1.14]">
          {post.title}
        </h1>

        {/* Author & Meta Line + Share Button */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ink-800/60 pb-6 pt-1">
          <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-ink-400">
            <img
              src={post.author.avatar}
              alt={post.author.name}
              width={32}
              height={32}
              className="size-8 rounded-full border border-ink-800 object-cover"
            />
            <span className="font-semibold text-ink-50">{post.author.name}</span>
            {post.author.role && <span>, {post.author.role}</span>}
            <span className="text-ink-600">·</span>
            <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
            {post.updatedAt > post.publishedAt && (
              <>
                <span className="text-ink-600">·</span>
                <span>
                  Updated <time dateTime={post.updatedAt}>{formatDate(post.updatedAt)}</time>
                </span>
              </>
            )}
            <span className="text-ink-600">·</span>
            <span>{post.readingMinutes} min read</span>
          </div>

          {/* Share Button */}
          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 rounded-full border border-ink-800/80 bg-ink-950/60 px-3.5 py-1.5 text-xs font-medium text-ink-300 transition-all hover:border-ink-700 hover:text-ink-50 cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="size-3.5 text-emerald-400" />
                <span className="font-semibold text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="size-3.5 text-ink-400" />
                <span>Share</span>
                <ChevronDown className="size-3 text-ink-500" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. Hero Image Banner (Centered max-w-5xl) */}
      <div className="mx-auto max-w-5xl overflow-hidden rounded-3xl border border-ink-800/80 bg-gradient-to-br from-ink-950 via-[#0a0d18] to-signal-950 shadow-2xl aspect-[16/9] w-full">
        {post.cover.src && !post.cover.src.includes('retail-screens.webp') ? (
          <img
            src={post.cover.src}
            alt={post.cover.alt || post.title}
            className="h-full w-full object-cover"
            loading="eager"
          />
        ) : (
          <div className="relative flex h-full w-full flex-col items-center justify-center p-6 text-center sm:p-12">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(124,58,237,0.18)_0%,transparent_70%)]" />
            <div className="relative z-10 flex flex-col items-center max-w-3xl">
              <span className="mb-4 inline-flex items-center rounded-full border border-signal-800/80 bg-signal-950/80 px-3.5 py-1 font-mono text-xs font-medium text-signal-300">
                {productName}
              </span>
              <h2 className="font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl md:text-5xl">
                {post.title}
              </h2>
              <p className="mt-4 max-w-xl text-xs sm:text-sm text-ink-400 leading-relaxed">
                Viewixsoft Platform &bull; Cloud Signage &amp; Edge Architecture
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 3. Centered Single-Column Editorial Reading Experience (max-w-3xl) */}
      <div className="mx-auto max-w-3xl space-y-8 pt-2">
        {/* Lead Paragraph */}
        {post.description && (
          <div className="text-lg sm:text-[19px] leading-[1.8] text-ink-200 font-normal">
            {parseInline(post.description)}
          </div>
        )}

        {/* Key Takeaways Card (if meaningful) */}
        {validTakeaways.length >= 2 && (
          <section
            aria-labelledby="takeaways-title"
            className="relative overflow-hidden rounded-2xl border border-signal-800/80 bg-ink-950/80 p-6 shadow-sm sm:p-7"
          >
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-signal-500 via-signal-400 to-signal-300" />
            <div className="mb-3 flex items-center gap-2">
              <span className="font-mono text-xs font-bold tracking-wider text-signal-300 uppercase">
                Key Takeaways
              </span>
            </div>
            <ul className="space-y-3">
              {validTakeaways.map((item, idx) => (
                <li key={idx} className="flex items-start gap-3 text-sm sm:text-[15px] leading-relaxed text-ink-200">
                  <span className="mt-1.5 size-1.5 rounded-full bg-signal-400 shrink-0" />
                  <span>{parseInline(item)}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Article Body */}
        <article className="space-y-6 text-base sm:text-[17px] leading-[1.8]">
          {dbContent ? <MarkdownRenderer content={dbContent} /> : <PostBody slug={post.slug} />}
        </article>

        {/* FAQ: answers in the SSR HTML and as FAQPage JSON-LD (see head). */}
        {post.faq && post.faq.length > 0 && (
          <section aria-labelledby="post-faq-title" className="mt-14 space-y-4">
            <h2 id="post-faq-title" className="font-display text-2xl font-semibold tracking-tight text-ink-50">
              Frequently asked questions
            </h2>
            <FaqAccordion items={post.faq} className="mx-0 max-w-none" />
          </section>
        )}

        {/* Author Bio Footer */}
        <aside aria-label="About the author" className="mt-14 flex items-start gap-4 rounded-3xl border border-ink-800/80 bg-ink-950/40 p-6 sm:p-8">
          <img
            src={post.author.avatar}
            alt=""
            width={64}
            height={64}
            loading="lazy"
            className="size-16 shrink-0 rounded-2xl border border-ink-800 object-cover"
          />
          <div>
            <p className="text-lg font-bold text-ink-50">Written by {post.author.name}</p>
            {post.author.role && <p className="text-xs text-signal-400 font-medium">{post.author.role}</p>}
            {post.author.bio && <p className="mt-2 text-sm text-ink-300 leading-relaxed">{post.author.bio}</p>}
            {post.author.url && (
              <a
                href={post.author.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-block text-xs font-semibold text-signal-300 hover:text-signal-200"
              >
                More about {post.author.name} ↗
              </a>
            )}
          </div>
        </aside>
      </div>

      {/* 4. Related Posts (Centered max-w-4xl) */}
      {relatedPosts.length > 0 && (
        <section aria-labelledby="related-title" className="mx-auto max-w-4xl space-y-6 border-t border-ink-800/80 pt-12">
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

      {/* 5. Newsletter Signup (Centered max-w-4xl) */}
      <div className="mx-auto max-w-4xl">
        <NewsletterSignup />
      </div>
      <CtaBand />
    </div>
  )
}
