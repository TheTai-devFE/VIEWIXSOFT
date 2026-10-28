import type { z } from 'zod'
import { CUSTOM_SCHEMA_TYPES, PRODUCT_AVAILABILITY } from './custom-schema'
import type { CustomSchemaInputSchema, CustomSchemaType } from './custom-schema'

/**
 * The reverse of `buildCustomJsonLd`: reads schema.org JSON-LD pasted in the
 * admin (from ChatGPT, an SEO tool, another site) back into the form fields of
 * the matching type. Types without a form become a "Custom" raw-JSON schema.
 * Messages are admin UI copy, so they are in Vietnamese.
 */

type Draft = z.input<typeof CustomSchemaInputSchema>
type Json = Record<string, unknown>

export type JsonLdImport =
  | { ok: true; draft: Draft; ignored: string[] }
  | { ok: false; error: string }

const isObject = (v: unknown): v is Json => typeof v === 'object' && v !== null && !Array.isArray(v)
const list = (v: unknown): unknown[] => (Array.isArray(v) ? v : v === undefined || v === null ? [] : [v])
const text = (v: unknown): string => (typeof v === 'string' ? v.trim() : typeof v === 'number' ? String(v) : '')
/** A name from a string or a `{ name }` object (Brand, Place, HowToTool…). */
const named = (v: unknown) => (isObject(v) ? text(v.name) : text(v))
/** An image link from a string, an ImageObject or the first of a list. */
const imageUrl = (v: unknown): string => {
  const first = list(v)[0]
  return isObject(first) ? text(first.contentUrl) || text(first.url) : text(first)
}
const firstObject = (v: unknown) => list(v).find(isObject)

/** Top-level keys each form keeps; anything else is reported as ignored. */
const KNOWN_KEYS: Record<Exclude<CustomSchemaType, 'Custom'>, string[]> = {
  HowTo: ['name', 'description', 'image', 'totalTime', 'supply', 'tool', 'step'],
  FAQPage: ['mainEntity'],
  Recipe: [
    'name', 'description', 'image', 'author', 'prepTime', 'cookTime', 'totalTime', 'recipeYield', 'recipeCategory',
    'recipeCuisine', 'keywords', 'nutrition', 'recipeIngredient', 'recipeInstructions',
  ],
  ImageGallery: ['name', 'description', 'url', 'image', 'associatedMedia'],
  Product: ['name', 'description', 'image', 'brand', 'sku', 'gtin', 'gtin8', 'gtin12', 'gtin13', 'gtin14', 'offers'],
  Service: ['name', 'description', 'serviceType', 'areaServed', 'url', 'provider', 'offers'],
}

/** HowTo steps, flattening HowToSection groups into one list. */
function howToSteps(v: unknown) {
  return list(v).flatMap((s): { name: string; text: string; image: string }[] => {
    if (isObject(s) && s['@type'] === 'HowToSection') return howToSteps(s.itemListElement)
    if (isObject(s)) return [{ name: text(s.name), text: text(s.text) || text(s.name), image: imageUrl(s.image) }]
    return text(s) ? [{ name: '', text: text(s), image: '' }] : []
  })
}

function recipeSteps(v: unknown) {
  if (typeof v === 'string') return v.split('\n').map((t) => ({ text: t.trim() })).filter((s) => s.text)
  return howToSteps(v).map((s) => ({ text: s.text }))
}

function offerOf(v: unknown) {
  const o = firstObject(v)
  if (!o) return undefined
  return { price: text(o.price), priceCurrency: text(o.priceCurrency) || 'USD' }
}

function toDraft(type: Exclude<CustomSchemaType, 'Custom'>, j: Json): Draft {
  switch (type) {
    case 'HowTo':
      return {
        type,
        data: {
          name: text(j.name),
          description: text(j.description),
          image: imageUrl(j.image),
          totalTime: text(j.totalTime),
          supply: list(j.supply).map(named).filter(Boolean),
          tool: list(j.tool).map(named).filter(Boolean),
          steps: howToSteps(j.step),
        },
      }
    case 'FAQPage':
      return {
        type,
        data: {
          items: list(j.mainEntity)
            .filter(isObject)
            .map((q) => ({ question: text(q.name), answer: text(firstObject(q.acceptedAnswer)?.text) })),
        },
      }
    case 'Recipe':
      return {
        type,
        data: {
          name: text(j.name),
          description: text(j.description),
          image: imageUrl(j.image),
          prepTime: text(j.prepTime),
          cookTime: text(j.cookTime),
          totalTime: text(j.totalTime),
          recipeYield: text(list(j.recipeYield)[0]),
          recipeCategory: text(j.recipeCategory),
          recipeCuisine: text(j.recipeCuisine),
          keywords: list(j.keywords).map(text).filter(Boolean).join(', '),
          calories: text(firstObject(j.nutrition)?.calories),
          ingredients: list(j.recipeIngredient).map(text).filter(Boolean),
          steps: recipeSteps(j.recipeInstructions),
        },
      }
    case 'ImageGallery':
      return {
        type,
        data: {
          name: text(j.name),
          description: text(j.description),
          images: [...list(j.image), ...list(j.associatedMedia)]
            .map((img) => ({ url: imageUrl(img), caption: isObject(img) ? text(img.caption) || text(img.name) : '' }))
            .filter((img) => img.url),
        },
      }
    case 'Product': {
      const o = firstObject(j.offers)
      const availability = text(o?.availability).split('/').pop() ?? ''
      const offer = offerOf(j.offers)
      return {
        type,
        data: {
          name: text(j.name),
          description: text(j.description),
          images: list(j.image).map(imageUrl).filter(Boolean),
          brand: named(j.brand),
          sku: text(j.sku),
          gtin: text(j.gtin) || text(j.gtin13) || text(j.gtin12) || text(j.gtin14) || text(j.gtin8),
          ...(offer
            ? { offer: { ...offer, availability: PRODUCT_AVAILABILITY.find((a) => a === availability) ?? 'InStock' } }
            : {}),
        },
      }
    }
    case 'Service': {
      const offer = offerOf(j.offers)
      return {
        type,
        data: {
          name: text(j.name),
          description: text(j.description),
          serviceType: text(j.serviceType),
          areaServed: list(j.areaServed).map(named).filter(Boolean).join(', '),
          url: text(j.url),
          ...(offer ? { offer } : {}),
        },
      }
    }
  }
}

/** Reads pasted JSON text into a form draft. */
export function importJsonLd(source: string): JsonLdImport {
  let parsed: unknown
  try {
    parsed = JSON.parse(source)
  } catch {
    return { ok: false, error: 'JSON chưa hợp lệ. Kiểm tra dấu ngoặc, dấu phẩy và dấu nháy kép.' }
  }
  // A one-item @graph or a one-item array is read as that item.
  if (isObject(parsed) && Array.isArray(parsed['@graph']) && parsed['@graph'].length === 1) parsed = parsed['@graph'][0]
  if (Array.isArray(parsed) && parsed.length === 1) parsed = parsed[0]
  if (Array.isArray(parsed) || (isObject(parsed) && Array.isArray(parsed['@graph']))) {
    return { ok: false, error: 'Mỗi lần chỉ nhập một schema. Hãy tách từng khối JSON-LD ra.' }
  }
  if (!isObject(parsed)) return { ok: false, error: 'JSON phải là một object { … }.' }
  const type = parsed['@type']
  if (typeof type !== 'string' || !type) return { ok: false, error: 'JSON-LD cần có "@type", ví dụ "FAQPage".' }

  const known = CUSTOM_SCHEMA_TYPES.find((t): t is Exclude<CustomSchemaType, 'Custom'> => t === type && t !== 'Custom')
  if (!known) return { ok: true, draft: { type: 'Custom', data: { mode: 'json', json: parsed } }, ignored: [] }

  const keep = new Set(['@context', '@type', '@id', ...KNOWN_KEYS[known]])
  return { ok: true, draft: toDraft(known, parsed), ignored: Object.keys(parsed).filter((k) => !keep.has(k)) }
}

/** A JSON-LD skeleton per type, shown when the form is still too empty to build one. */
export function jsonLdTemplate(type: CustomSchemaType): Json {
  const base = { '@context': 'https://schema.org', '@type': type === 'Custom' ? 'Thing' : type }
  switch (type) {
    case 'HowTo':
      return { ...base, name: '', step: [{ '@type': 'HowToStep', name: '', text: '' }] }
    case 'FAQPage':
      return { ...base, mainEntity: [{ '@type': 'Question', name: '', acceptedAnswer: { '@type': 'Answer', text: '' } }] }
    case 'Recipe':
      return { ...base, name: '', image: '', recipeIngredient: [''], recipeInstructions: [{ '@type': 'HowToStep', text: '' }] }
    case 'ImageGallery':
      return { ...base, name: '', image: [{ '@type': 'ImageObject', contentUrl: '', caption: '' }] }
    case 'Product':
      return { ...base, name: '', description: '', offers: { '@type': 'Offer', price: '', priceCurrency: 'USD' } }
    case 'Service':
      return { ...base, name: '', description: '', serviceType: '' }
    case 'Custom':
      return { ...base, name: '' }
  }
}
