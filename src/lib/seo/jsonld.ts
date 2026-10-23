import { CONTACT_EMAILS } from '~/data/company'
import { SOCIAL_LINKS } from '~/data/social'
import { DEFAULT_OG_IMAGE, LOGO_URL, SITE_NAME, SITE_URL } from './meta'

// Official profiles only: the social links in src/data/social.ts that have a URL.
// TODO(content): add Crunchbase, G2 etc. once those listings exist.
export const SAME_AS: string[] = SOCIAL_LINKS.flatMap((s) => (s.url ? [s.url] : []))

export function getOrganizationSchema() {
  const sales = CONTACT_EMAILS.find((c) => c.department === 'Sales')
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: `${SITE_URL}/`,
    logo: LOGO_URL,
    description: 'Digital signage software for advertising screens, kiosks and menu boards, built for Viewix hardware.',
    parentOrganization: { '@type': 'Organization', name: 'Viewix', url: 'https://viewixfactory.com/' },
    ...(SAME_AS.length ? { sameAs: SAME_AS } : {}),
    ...(sales
      ? {
          contactPoint: {
            '@type': 'ContactPoint',
            email: sales.email,
            contactType: 'sales',
            areaServed: 'Worldwide',
            availableLanguage: ['en'],
          },
        }
      : {}),
  }
}

export function getWebSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: `${SITE_URL}/`,
    inLanguage: 'en',
  }
}

export function getSoftwareApplicationSchema(product: {
  name: string
  description: string
  slug: string
  category?: string
  supportedOS?: string[]
  /** Only for products with published prices; omitted otherwise. */
  offer?: { price: number; currency: string; description: string }
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: product.name,
    url: `${SITE_URL}/products/${product.slug}`,
    image: DEFAULT_OG_IMAGE,
    applicationCategory: 'BusinessApplication',
    ...(product.supportedOS?.length ? { operatingSystem: product.supportedOS.join(', ') } : {}),
    description: product.description,
    ...(product.offer
      ? {
          offers: {
            '@type': 'Offer',
            price: product.offer.price.toFixed(2),
            priceCurrency: product.offer.currency,
            description: product.offer.description,
          },
        }
      : {}),
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL
    }
  }
}

export function getBreadcrumbSchema(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.path === '/' ? `${SITE_URL}/` : `${SITE_URL}${item.path}`
    }))
  }
}

export function getFaqSchema(faqs: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer
      }
    }))
  }
}

export function getArticleSchema(article: {
  type?: 'BlogPosting' | 'Article'
  title: string
  description: string
  /** Site path of the page, e.g. `/blog/my-post` or `/use-cases/retail`. */
  path: string
  publishedAt: string
  updatedAt: string
  authorName: string
  /** Set for a person; omitted for a team byline, which is published as the Organization. */
  authorType?: 'Person' | 'Organization'
  image?: string
  keywords?: string[]
}) {
  const url = `${SITE_URL}${article.path}`
  return {
    '@context': 'https://schema.org',
    '@type': article.type ?? 'BlogPosting',
    headline: article.title,
    description: article.description,
    url,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    image: article.image ? `${SITE_URL}${article.image}` : DEFAULT_OG_IMAGE,
    inLanguage: 'en',
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    ...(article.keywords?.length ? { keywords: article.keywords.join(', ') } : {}),
    author: {
      '@type': article.authorType ?? 'Person',
      name: article.authorName,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: { '@type': 'ImageObject', url: LOGO_URL },
    },
  }
}

/** Uploaded files may live on another host (R2), so only site paths get the site URL. */
const absolute = (url: string) => (/^https?:\/\//.test(url) ? url : `${SITE_URL}${url}`)

export function getVideoSchema(video: {
  title: string
  description: string
  src: string
  poster: string
  uploadDate: string
  duration?: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: video.title,
    description: video.description,
    contentUrl: absolute(video.src),
    thumbnailUrl: absolute(video.poster),
    uploadDate: video.uploadDate,
    ...(video.duration ? { duration: video.duration } : {}),
  }
}
