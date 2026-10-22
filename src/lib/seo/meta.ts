export interface SeoOptions {
  /** Page name without the brand; " — Viewixsoft" is appended unless the title already names the brand. */
  title: string
  description: string
  canonicalUrl?: string
  ogType?: 'website' | 'article'
  ogImage?: string
  noindex?: boolean
  /** Path of the page's Markdown twin (e.g. `/products/cms.md`), advertised for LLM readers. */
  markdownPath?: string
}

export const SITE_URL = 'https://viewixsoft.com'
export const SITE_NAME = 'Viewixsoft'
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.jpg`
export const LOGO_URL = `${SITE_URL}/logo.png`

export const TITLE_MAX = 60
export const DESCRIPTION_MAX = 155

type MetaTag = Record<string, string>
type LinkTag = Record<string, string>

export function buildTitle(title: string) {
  return title.includes(SITE_NAME) ? title : `${title} — ${SITE_NAME}`
}

export function absoluteUrl(path = '/') {
  return path === '/' ? `${SITE_URL}/` : `${SITE_URL}${path}`
}

export function generateMetaTags(options: SeoOptions) {
  const fullTitle = buildTitle(options.title)
  const canonical = absoluteUrl(options.canonicalUrl)
  const image = options.ogImage ?? DEFAULT_OG_IMAGE

  const meta: MetaTag[] = [
    { title: fullTitle },
    { name: 'description', content: options.description },
    {
      name: 'robots',
      content: options.noindex
        ? 'noindex, nofollow'
        : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
    },

    { property: 'og:site_name', content: SITE_NAME },
    { property: 'og:type', content: options.ogType ?? 'website' },
    { property: 'og:title', content: fullTitle },
    { property: 'og:description', content: options.description },
    { property: 'og:url', content: canonical },
    { property: 'og:image', content: image },
    { property: 'og:image:width', content: '1200' },
    { property: 'og:image:height', content: '630' },
    { property: 'og:locale', content: 'en_US' },

    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: fullTitle },
    { name: 'twitter:description', content: options.description },
    { name: 'twitter:image', content: image },
  ]

  const links: LinkTag[] = [
    { rel: 'canonical', href: canonical },
    { rel: 'alternate', href: canonical, hrefLang: 'en' },
    { rel: 'alternate', href: canonical, hrefLang: 'x-default' },
  ]
  if (options.markdownPath) {
    links.push({ rel: 'alternate', type: 'text/markdown', href: `${SITE_URL}${options.markdownPath}` })
  }

  return { meta, links }
}
