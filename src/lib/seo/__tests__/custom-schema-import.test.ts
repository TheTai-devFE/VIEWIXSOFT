import { describe, expect, it } from 'vitest'
import { buildCustomJsonLd, CustomSchemaInputSchema } from '~/lib/seo/custom-schema'
import { importJsonLd, jsonLdTemplate } from '~/lib/seo/custom-schema-import'

const SAMPLES = [
  {
    type: 'HowTo',
    data: { name: 'Pair a screen', description: 'Link a player.', image: '/a.webp', totalTime: 'PT5M', supply: ['Player'], tool: ['Phone'], steps: [{ name: 'Plug', text: 'Plug in.', image: '' }, { text: 'Scan the code.' }] },
  },
  { type: 'FAQPage', data: { items: [{ question: 'Q?', answer: 'A.' }, { question: 'Q2?', answer: 'A2.' }] } },
  {
    type: 'Recipe',
    data: { name: 'Pho', image: '/pho.webp', prepTime: 'PT10M', recipeYield: '4 servings', keywords: 'soup, noodles', calories: '400 calories', ingredients: ['Noodles', 'Beef'], steps: [{ text: 'Boil.' }, { text: 'Serve.' }] },
  },
  { type: 'ImageGallery', data: { name: 'Installs', description: 'Lobby screens', images: [{ url: '/a.webp', caption: 'Lobby' }, { url: 'https://cdn.example/b.webp' }] } },
  { type: 'Product', data: { name: 'Player', images: ['/p.webp'], brand: 'Viewix', sku: 'VX-1', gtin: '0123456789012', offer: { price: '199', priceCurrency: 'EUR', availability: 'PreOrder' } } },
  { type: 'Service', data: { name: 'Installation', serviceType: 'Signage install', areaServed: 'Worldwide', offer: { price: '500', priceCurrency: 'USD' } } },
] as const

describe('importJsonLd', () => {
  it.each(SAMPLES)('reads the JSON-LD of a $type back into the same markup', (sample) => {
    const original = buildCustomJsonLd(CustomSchemaInputSchema.parse(sample), '/blog/post')
    const imported = importJsonLd(JSON.stringify(original))
    if (!imported.ok) throw new Error(imported.error)
    expect(imported.draft.type).toBe(sample.type)
    expect(imported.ignored).toEqual([])
    expect(buildCustomJsonLd(CustomSchemaInputSchema.parse(imported.draft), '/blog/post')).toEqual(original)
  })

  it('fills an FAQ from typical pasted markup', () => {
    const pasted = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [{ '@type': 'Question', name: 'How many screens?', acceptedAnswer: { '@type': 'Answer', text: 'Unlimited.' } }],
    }
    const res = importJsonLd(JSON.stringify(pasted))
    expect(res).toEqual({ ok: true, draft: { type: 'FAQPage', data: { items: [{ question: 'How many screens?', answer: 'Unlimited.' }] } }, ignored: [] })
  })

  it('accepts the shapes other tools write', () => {
    const howTo = importJsonLd(
      JSON.stringify({
        '@type': 'HowTo',
        name: 'Set up',
        image: { '@type': 'ImageObject', url: 'https://cdn.example/x.webp' },
        supply: [{ '@type': 'HowToSupply', name: 'Cable' }],
        step: [{ '@type': 'HowToSection', name: 'Part 1', itemListElement: [{ '@type': 'HowToStep', text: 'One' }, { '@type': 'HowToStep', text: 'Two' }] }, 'Three'],
      }),
    )
    if (!howTo.ok || howTo.draft.type !== 'HowTo') throw new Error('expected a HowTo')
    expect(howTo.draft.data.image).toBe('https://cdn.example/x.webp')
    expect(howTo.draft.data.supply).toEqual(['Cable'])
    expect(howTo.draft.data.steps.map((s) => s.text)).toEqual(['One', 'Two', 'Three'])

    const recipe = importJsonLd(JSON.stringify({ '@type': 'Recipe', name: 'Tea', image: ['/t.webp'], recipeYield: 2, recipeInstructions: 'Boil water.\nAdd tea.' }))
    if (!recipe.ok || recipe.draft.type !== 'Recipe') throw new Error('expected a Recipe')
    expect(recipe.draft.data.recipeYield).toBe('2')
    expect(recipe.draft.data.steps).toEqual([{ text: 'Boil water.' }, { text: 'Add tea.' }])

    const product = importJsonLd(JSON.stringify({ '@type': 'Product', name: 'X', brand: 'Acme', gtin13: '123', offers: [{ '@type': 'Offer', price: 9.5, availability: 'http://schema.org/OutOfStock' }] }))
    if (!product.ok || product.draft.type !== 'Product') throw new Error('expected a Product')
    expect(product.draft.data).toMatchObject({ brand: 'Acme', gtin: '123', offer: { price: '9.5', priceCurrency: 'USD', availability: 'OutOfStock' } })
  })

  it('reports properties the form does not keep', () => {
    const res = importJsonLd(JSON.stringify({ '@type': 'Product', name: 'X', aggregateRating: { ratingValue: 5 }, review: [] }))
    expect(res.ok && res.ignored).toEqual(['aggregateRating', 'review'])
  })

  it('keeps types without a form as raw JSON', () => {
    const event = { '@context': 'https://schema.org', '@type': 'Event', name: 'Launch', startDate: '2026-12-01' }
    expect(importJsonLd(JSON.stringify(event))).toEqual({ ok: true, draft: { type: 'Custom', data: { mode: 'json', json: event } }, ignored: [] })
  })

  it('unwraps a single-item @graph or array', () => {
    const faq = { '@type': 'FAQPage', mainEntity: [] }
    expect(importJsonLd(JSON.stringify({ '@graph': [faq] })).ok).toBe(true)
    expect(importJsonLd(JSON.stringify([faq])).ok).toBe(true)
  })

  it('explains what is wrong', () => {
    const error = (s: string) => {
      const res = importJsonLd(s)
      return res.ok ? null : res.error
    }
    expect(error('{"@type": "FAQPage",')).toMatch(/JSON chưa hợp lệ/)
    expect(error('"text"')).toMatch(/object/)
    expect(error('{"name": "x"}')).toMatch(/@type/)
    expect(error(JSON.stringify([{ '@type': 'A' }, { '@type': 'B' }]))).toMatch(/một schema/)
  })

  it('gives every type a starting template that reads back as that type', () => {
    for (const sample of SAMPLES) {
      const res = importJsonLd(JSON.stringify(jsonLdTemplate(sample.type)))
      expect(res.ok && res.draft.type).toBe(sample.type)
    }
  })
})
