import { createFileRoute, notFound, Link } from '@tanstack/react-router'
import { BLOG_POSTS } from '~/content/blog-posts'
import { PRODUCTS } from '~/content/products'
import { Breadcrumbs } from '~/components/layout/Breadcrumbs'
import { generateMetaTags, SITE_URL } from '~/lib/seo/meta'
import { blogPostSeo } from '~/lib/seo/page-seo'
import { getArticleSchema, getBreadcrumbSchema } from '~/lib/seo/jsonld'
import { CtaBand } from '~/components/blocks/CtaBand'
import { 
  Calendar, Clock, CheckCircle2, 
  ArrowLeft, ArrowRight, Bookmark, Share2, Sparkles 
} from 'lucide-react'

export const Route = createFileRoute('/blog/$slug')({
  loader: ({ params }) => {
    const post = BLOG_POSTS.find((p) => p.slug === params.slug)
    if (!post) {
      throw notFound()
    }
    // Same product first, then the rest.
    const relatedPosts = BLOG_POSTS.filter((p) => p.slug !== post.slug)
      .sort((a, b) => Number(b.product === post.product) - Number(a.product === post.product))
      .slice(0, 2)
    const product = PRODUCTS.find((p) => p.slug === post.product)
    return { post, relatedPosts, productName: product?.name ?? post.product }
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
    })

    const breadcrumbs = [
      { name: 'Home', path: '/' },
      { name: 'Blog', path: '/blog' },
      { name: p.title, path: `/blog/${p.slug}` },
    ]

    return {
      meta: seo.meta,
      links: seo.links,
      scripts: [
        {
          type: 'application/ld+json',
          children: JSON.stringify(getArticleSchema({
            title: p.title,
            description: p.description,
            path: `/blog/${p.slug}`,
            publishedAt: p.publishedAt,
            updatedAt: p.updatedAt,
            authorName: p.author.name,
            image: p.cover.src,
            keywords: p.tags,
          })),
        },
        {
          type: 'application/ld+json',
          children: JSON.stringify(getBreadcrumbSchema(breadcrumbs)),
        },
      ],
    }
  },
  component: BlogPostPage,
})

function BlogPostPage() {
  const { post, relatedPosts, productName } = Route.useLoaderData()

  return (
    <div className="py-12 md:py-20 max-w-4xl mx-auto px-4 sm:px-6 space-y-12">
      <Breadcrumbs items={[
        { name: 'Home', path: '/' },
        { name: 'Blog', path: '/blog' },
        { name: post.title, path: `/blog/${post.slug}` },
      ]} />

      {/* Post Header */}
      <header className="space-y-6 border-b border-ink-800 pb-8">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <Link
            to="/products/$slug"
            params={{ slug: post.product }}
            className="px-3 py-1 rounded-full bg-signal-950/60 border border-signal-800/40 text-signal-400 font-mono font-medium hover:text-signal-300"
          >
            {productName}
          </Link>
          <span className="text-ink-500">•</span>
          <span className="flex items-center gap-1.5 text-ink-400">
            <Calendar className="w-3.5 h-3.5" />
            Published: {post.publishedAt}
          </span>
          <span className="text-ink-500">•</span>
          <span className="flex items-center gap-1.5 text-ink-400 font-mono">
            <Clock className="w-3.5 h-3.5" />
            {post.readTime}
          </span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-ink-50 tracking-tight leading-tight">
          {post.title}
        </h1>

        <p className="text-lg text-ink-300 leading-relaxed font-normal">
          {post.description}
        </p>

        {/* Author Bio Bar */}
        <div className="flex items-center justify-between pt-4">
          <div className="flex items-center gap-3">
            <img
              src={post.author.avatar}
              alt={post.author.name}
              className="w-12 h-12 rounded-full object-cover border-2 border-signal-500/40"
              loading="lazy"
            />
            <div>
              <div className="font-bold text-sm text-ink-50">{post.author.name}</div>
              <div className="text-xs text-signal-400">{post.author.role}</div>
            </div>
          </div>
        </div>
      </header>

      {/* Key Takeaways Callout Box */}
      <section className="p-6 sm:p-8 rounded-2xl panel border border-signal-500/30 bg-ink-950 space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold font-mono text-signal-400 uppercase tracking-wider">
          <Sparkles className="w-4 h-4 text-signal-400" /> Key takeaways
        </div>
        <ul className="space-y-2.5">
          {post.keyTakeaways.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-ink-200">
              <CheckCircle2 className="w-4 h-4 text-signal-400 shrink-0 mt-0.5" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Article Body */}
      <article className="prose prose-invert prose-cyan max-w-none space-y-6 text-ink-300 text-base leading-relaxed">
        {post.content.split('\n\n').map((paragraph, idx) => {
          if (paragraph.startsWith('## ')) {
            return (
              <h2 key={idx} className="text-2xl sm:text-3xl font-extrabold text-ink-50 pt-6 border-b border-ink-800 pb-3">
                {paragraph.replace('## ', '')}
              </h2>
            )
          }
          if (paragraph.startsWith('### ')) {
            return (
              <h3 key={idx} className="text-xl font-bold text-signal-300 pt-4">
                {paragraph.replace('### ', '')}
              </h3>
            )
          }
          return <p key={idx}>{paragraph}</p>
        })}
      </article>

      {/* Author Bio Box */}
      <div className="p-8 rounded-2xl panel border border-ink-800 flex flex-col sm:flex-row gap-5 items-start sm:items-center">
        <img
          src={post.author.avatar}
          alt={post.author.name}
          className="w-16 h-16 rounded-2xl object-cover border border-signal-500/40"
          loading="lazy"
        />
        <div className="space-y-1">
          <h4 className="font-bold text-ink-50 text-base">Written by {post.author.name}</h4>
          <p className="text-xs text-signal-400">{post.author.role}</p>
          <p className="text-xs text-ink-400 leading-relaxed pt-1">{post.author.bio}</p>
        </div>
      </div>

      {/* Related Posts */}
      <div className="space-y-6 pt-12 border-t border-ink-900">
        <h3 className="text-xl font-bold text-ink-50">Related posts</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {relatedPosts.map((rel) => (
            <Link
              key={rel.slug}
              to="/blog/$slug"
              params={{ slug: rel.slug }}
              className="p-6 rounded-2xl panel border border-ink-800 hover:border-signal-500/40 transition-all flex flex-col justify-between space-y-3 group"
            >
              <div className="space-y-2">
                <span className="text-[11px] font-mono text-signal-400">{rel.category}</span>
                <h4 className="text-base font-bold text-ink-50 group-hover:text-signal-400 transition-colors">
                  {rel.title}
                </h4>
              </div>
              <div className="text-xs text-ink-400 flex items-center gap-1 font-mono">
                Read post <ArrowRight className="w-3.5 h-3.5 text-signal-400" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      <CtaBand />
    </div>
  )
}
