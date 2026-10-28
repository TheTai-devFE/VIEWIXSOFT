import { describe, expect, it } from 'vitest'
import {
  blankSchema,
  buildCustomJsonLd,
  CUSTOM_SCHEMA_TYPES,
  CustomSchemaFormSchema,
  CustomSchemaInputSchema,
  ldScripts,
  mergeJsonLd,
  SchemaPathSchema,
  serializeJsonLd,
} from '~/lib/seo/custom-schema'

const parse = (input: unknown) => CustomSchemaInputSchema.parse(input)

describe('custom schema input', () => {
  it('rejects every blank starting form, so empty markup is never saved', () => {
    for (const type of CUSTOM_SCHEMA_TYPES) {
      expect(CustomSchemaInputSchema.safeParse(blankSchema(type)).success, type).toBe(false)
    }
  })

  it('accepts site paths and rejects anything else', () => {
    for (const ok of ['/', '/about', '/blog/my-post', '/legal/privacy']) expect(SchemaPathSchema.safeParse(ok).success, ok).toBe(true)
    for (const bad of ['', 'about', '/About', '/blog/', '/blog?x=1', 'https://evil.example/', '//evil.example']) {
      expect(SchemaPathSchema.safeParse(bad).success, bad).toBe(false)
    }
  })

  it('only takes https links or site paths for images', () => {
    const gallery = (url: string) => ({ type: 'ImageGallery', data: { name: 'Screens', images: [{ url }] } })
    expect(CustomSchemaInputSchema.safeParse(gallery('https://cdn.example/a.webp')).success).toBe(true)
    expect(CustomSchemaInputSchema.safeParse(gallery('/images/a.webp')).success).toBe(true)
    expect(CustomSchemaInputSchema.safeParse(gallery('//evil.example/a.webp')).success).toBe(false)
    expect(CustomSchemaInputSchema.safeParse(gallery('javascript:alert(1)')).success).toBe(false)
  })

  it('needs an @type in raw JSON and a valid type name in label: value mode', () => {
    expect(CustomSchemaInputSchema.safeParse({ type: 'Custom', data: { mode: 'json', json: { name: 'x' } } }).success).toBe(false)
    expect(CustomSchemaInputSchema.safeParse({ type: 'Custom', data: { mode: 'json', json: [] } }).success).toBe(false)
    const fields = (schemaType: string) => ({ type: 'Custom', data: { mode: 'fields', schemaType, properties: [{ label: 'name', value: 'x' }] } })
    expect(CustomSchemaInputSchema.safeParse(fields('Event')).success).toBe(true)
    expect(CustomSchemaInputSchema.safeParse(fields('event')).success).toBe(false)
  })

  it('caps raw JSON size', () => {
    const json = { '@type': 'Thing', description: 'x'.repeat(25_000) }
    expect(CustomSchemaInputSchema.safeParse({ type: 'Custom', data: { mode: 'json', json } }).success).toBe(false)
  })

  it('validates the whole form', () => {
    const form = { path: '/pricing', schema: { type: 'FAQPage', data: { items: [{ question: 'Q?', answer: 'A.' }] } } }
    expect(CustomSchemaFormSchema.parse(form).name).toBe('')
  })
})

describe('buildCustomJsonLd', () => {
  it('builds a HowTo with numbered steps and leaves out empty fields', () => {
    const ld = buildCustomJsonLd(
      parse({ type: 'HowTo', data: { name: 'Pair a screen', totalTime: 'PT5M', supply: ['', 'Player'], steps: [{ text: 'Plug in.' }, { name: 'Pair', text: 'Scan the code.' }] } }),
      '/blog/pair',
    )
    expect(ld).toEqual({
      '@context': 'https://schema.org',
      '@type': 'HowTo',
      name: 'Pair a screen',
      totalTime: 'PT5M',
      supply: [{ '@type': 'HowToSupply', name: 'Player' }],
      step: [
        { '@type': 'HowToStep', position: 1, text: 'Plug in.' },
        { '@type': 'HowToStep', position: 2, name: 'Pair', text: 'Scan the code.' },
      ],
    })
  })

  it('builds an FAQPage', () => {
    const ld = buildCustomJsonLd(parse({ type: 'FAQPage', data: { items: [{ question: 'Q?', answer: 'A.' }] } }), '/')
    expect(ld.mainEntity).toEqual([{ '@type': 'Question', name: 'Q?', acceptedAnswer: { '@type': 'Answer', text: 'A.' } }])
  })

  it('builds a Recipe with absolute images', () => {
    const ld = buildCustomJsonLd(
      parse({ type: 'Recipe', data: { name: 'Pho', image: '/images/pho.webp', ingredients: ['Noodles'], steps: [{ text: 'Cook.' }], calories: '400 calories' } }),
      '/blog/pho',
    )
    expect(ld.image).toEqual(['https://viewixsoft.com/images/pho.webp'])
    expect(ld.recipeIngredient).toEqual(['Noodles'])
    expect(ld.nutrition).toEqual({ '@type': 'NutritionInformation', calories: '400 calories' })
  })

  it('builds an ImageGallery of ImageObjects', () => {
    const ld = buildCustomJsonLd(parse({ type: 'ImageGallery', data: { name: 'Installs', images: [{ url: '/a.webp', caption: 'Lobby' }] } }), '/about')
    expect(ld.url).toBe('https://viewixsoft.com/about')
    expect(ld.image).toEqual([{ '@type': 'ImageObject', contentUrl: 'https://viewixsoft.com/a.webp', caption: 'Lobby' }])
  })

  it('adds an Offer to a Product only when a price is given', () => {
    const withPrice = buildCustomJsonLd(parse({ type: 'Product', data: { name: 'Player', offer: { price: '199' } } }), '/products/cms')
    expect(withPrice.offers).toEqual({
      '@type': 'Offer',
      price: '199',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      url: 'https://viewixsoft.com/products/cms',
    })
    const noPrice = buildCustomJsonLd(parse({ type: 'Product', data: { name: 'Player', offer: { price: '' } } }), '/products/cms')
    expect(noPrice).not.toHaveProperty('offers')
  })

  it('names Viewixsoft as the provider of a Service', () => {
    const ld = buildCustomJsonLd(parse({ type: 'Service', data: { name: 'Installation' } }), '/contact')
    expect(ld.provider).toEqual({ '@type': 'Organization', name: 'Viewixsoft', url: 'https://viewixsoft.com/' })
    expect(ld.url).toBe('https://viewixsoft.com/contact')
  })

  it('turns label: value rows into properties', () => {
    const ld = buildCustomJsonLd(
      parse({ type: 'Custom', data: { mode: 'fields', schemaType: 'Event', properties: [{ label: 'name', value: 'Launch' }, { label: 'startDate', value: '2026-12-01' }] } }),
      '/',
    )
    expect(ld).toEqual({ '@context': 'https://schema.org', '@type': 'Event', name: 'Launch', startDate: '2026-12-01' })
  })

  it('keeps raw JSON but always uses the schema.org context', () => {
    const ld = buildCustomJsonLd(parse({ type: 'Custom', data: { mode: 'json', json: { '@context': 'https://evil.example', '@type': 'Course', name: 'X' } } }), '/')
    expect(ld).toEqual({ '@context': 'https://schema.org', '@type': 'Course', name: 'X' })
  })
})

describe('page JSON-LD', () => {
  const builtInFaq = { '@type': 'FAQPage', mainEntity: [] }
  const breadcrumb = { '@type': 'BreadcrumbList' }

  it('lets a custom FAQ replace the built-in one', () => {
    const custom = { '@type': 'FAQPage', mainEntity: [{ name: 'Custom' }] }
    expect(mergeJsonLd([breadcrumb, builtInFaq], [custom])).toEqual([breadcrumb, custom])
  })

  it('keeps built-in markup of other types', () => {
    const howTo = { '@type': 'HowTo' }
    expect(mergeJsonLd([breadcrumb, builtInFaq], [howTo])).toEqual([breadcrumb, builtInFaq, howTo])
    expect(mergeJsonLd([breadcrumb])).toEqual([breadcrumb])
  })

  it('escapes < so a value cannot close the script tag', () => {
    const json = serializeJsonLd({ name: '</script><script>alert(1)</script>' })
    expect(json).not.toContain('<')
    expect(JSON.parse(json)).toEqual({ name: '</script><script>alert(1)</script>' })
  })

  it('renders head script entries', () => {
    expect(ldScripts([breadcrumb])).toEqual([{ type: 'application/ld+json', children: '{"@type":"BreadcrumbList"}' }])
  })
})
