import { z } from 'zod'
import { CUSTOM_SCHEMA_STATUSES, CUSTOM_SCHEMA_TYPES } from '~/lib/enums'
import { assetUrl, SITE_NAME, SITE_URL } from './meta'

export { CUSTOM_SCHEMA_STATUSES, CUSTOM_SCHEMA_TYPES }

/**
 * Schema markup added by hand in /admin/schema or by an outside tool through
 * /api/v1. One Zod shape per type, shared by the admin form, the API and the
 * page head, then turned into JSON-LD by `buildCustomJsonLd`. Labels and
 * messages are admin UI copy, so they are in Vietnamese.
 */

export type CustomSchemaType = (typeof CUSTOM_SCHEMA_TYPES)[number]

export const CUSTOM_SCHEMA_LABELS: Record<CustomSchemaType, { label: string; hint: string }> = {
  HowTo: { label: 'HowTo (hướng dẫn từng bước)', hint: 'Các bước làm một việc. Trang phải hiển thị đúng các bước này.' },
  FAQPage: { label: 'FAQ (hỏi – đáp)', hint: 'Thay thế FAQ tự sinh của trang. Câu hỏi phải hiển thị trên trang.' },
  Recipe: { label: 'Recipe (công thức)', hint: 'Chỉ dùng khi trang thật sự là một công thức.' },
  ImageGallery: { label: 'Photo list (bộ sưu tập ảnh)', hint: 'Danh sách ảnh của trang.' },
  Product: { label: 'Product (sản phẩm)', hint: 'Một sản phẩm cụ thể, có thể kèm giá.' },
  Service: { label: 'Service (dịch vụ)', hint: 'Một dịch vụ Viewixsoft cung cấp.' },
  Custom: { label: 'Mở rộng (label: value hoặc JSON)', hint: 'Mọi loại schema.org khác.' },
}

export type CustomSchemaStatus = (typeof CUSTOM_SCHEMA_STATUSES)[number]

export const CUSTOM_SCHEMA_STATUS_LABELS: Record<CustomSchemaStatus, string> = {
  pending: 'Chờ duyệt',
  published: 'Đang chạy',
  disabled: 'Đã tắt',
}

/** Built-in markup a custom schema of the same type replaces on its page. */
export const REPLACES_BUILT_IN: readonly string[] = ['FAQPage']

/** A site path such as `/`, `/about` or `/blog/my-post`: lowercase, no query, no trailing slash. */
export const SchemaPathSchema = z
  .string()
  .trim()
  .regex(/^\/(?:[a-z0-9-]+(?:\/[a-z0-9-]+)*)?$/, 'Đường dẫn trang không hợp lệ (ví dụ: /about, /blog/my-post).')

const MAX_JSON_CHARS = 20_000

const text = (max = 500) => z.string().trim().max(max, `Tối đa ${max} ký tự.`)
const required = (label: string, max = 500) => text(max).min(1, `Cần nhập ${label}.`)
const optionalText = (max = 500) => text(max).optional().default('')
/** An absolute https URL or a path on this site (e.g. an image from the media library). */
const imageUrl = z
  .string()
  .trim()
  .max(2000)
  .refine((v) => v === '' || /^https:\/\//.test(v) || /^\/[^/]/.test(v), 'Link ảnh phải bắt đầu bằng https:// hoặc /.')
/** ISO 8601 duration, e.g. PT30M or PT1H15M. */
const duration = z
  .string()
  .trim()
  .refine((v) => v === '' || /^P(?:\d+D)?(?:T(?:\d+H)?(?:\d+M)?(?:\d+S)?)?$/.test(v), 'Thời lượng theo dạng ISO 8601, ví dụ PT30M.')
  .optional()
  .default('')
const stringList = (max: number) => z.array(text(300)).max(max).default([])

export const HowToDataSchema = z.object({
  name: required('tên hướng dẫn', 200),
  description: optionalText(1000),
  image: imageUrl.optional().default(''),
  totalTime: duration,
  supply: stringList(30),
  tool: stringList(30),
  steps: z
    .array(z.object({ name: optionalText(200), text: required('nội dung bước', 2000), image: imageUrl.optional().default('') }))
    .min(1, 'Cần ít nhất một bước.')
    .max(30),
})

export const FaqDataSchema = z.object({
  items: z
    .array(z.object({ question: required('câu hỏi', 300), answer: required('câu trả lời', 3000) }))
    .min(1, 'Cần ít nhất một câu hỏi.')
    .max(30),
})

export const RecipeDataSchema = z.object({
  name: required('tên công thức', 200),
  description: optionalText(1000),
  image: imageUrl.refine((v) => v !== '', 'Google cần ảnh cho Recipe.'),
  prepTime: duration,
  cookTime: duration,
  totalTime: duration,
  recipeYield: optionalText(100),
  recipeCategory: optionalText(100),
  recipeCuisine: optionalText(100),
  keywords: optionalText(300),
  calories: optionalText(50),
  ingredients: z.array(required('nguyên liệu', 300)).min(1, 'Cần ít nhất một nguyên liệu.').max(50),
  steps: z.array(z.object({ text: required('nội dung bước', 2000) })).min(1, 'Cần ít nhất một bước.').max(30),
})

export const ImageGalleryDataSchema = z.object({
  name: required('tên bộ ảnh', 200),
  description: optionalText(1000),
  images: z
    .array(
      z.object({
        url: imageUrl.refine((v) => v !== '', 'Cần link ảnh.'),
        caption: optionalText(300),
      }),
    )
    .min(1, 'Cần ít nhất một ảnh.')
    .max(50),
})

export const PRODUCT_AVAILABILITY = ['InStock', 'OutOfStock', 'PreOrder', 'Discontinued'] as const

const OfferSchema = z.object({
  price: z
    .string()
    .trim()
    .refine((v) => v === '' || /^\d+(?:\.\d{1,2})?$/.test(v), 'Giá là số, ví dụ 99 hoặc 99.50.')
    .optional()
    .default(''),
  priceCurrency: z
    .string()
    .trim()
    .refine((v) => v === '' || /^[A-Z]{3}$/.test(v), 'Mã tiền tệ 3 chữ in hoa, ví dụ USD.')
    .optional()
    .default('USD'),
})

export const ProductDataSchema = z.object({
  name: required('tên sản phẩm', 200),
  description: optionalText(2000),
  images: z.array(imageUrl.refine((v) => v !== '', 'Cần link ảnh.')).max(10).default([]),
  brand: optionalText(100),
  sku: optionalText(100),
  gtin: optionalText(20),
  offer: OfferSchema.extend({ availability: z.enum(PRODUCT_AVAILABILITY).optional().default('InStock') }).optional(),
})

export const ServiceDataSchema = z.object({
  name: required('tên dịch vụ', 200),
  description: optionalText(2000),
  serviceType: optionalText(200),
  areaServed: optionalText(200),
  url: z
    .string()
    .trim()
    .refine((v) => v === '' || /^https:\/\//.test(v) || /^\/(?!\/)/.test(v), 'Link phải bắt đầu bằng https:// hoặc /.')
    .optional()
    .default(''),
  offer: OfferSchema.optional(),
})

/** A schema.org type name such as `Event` or `SoftwareSourceCode`. */
const TypeNameSchema = z.string().trim().regex(/^[A-Z][A-Za-z0-9]{1,60}$/, 'Loại schema viết như trên schema.org, ví dụ Event.')
const PropertyNameSchema = z.string().trim().regex(/^[a-zA-Z][a-zA-Z0-9]{0,60}$/, 'Tên thuộc tính chỉ gồm chữ và số, ví dụ startDate.')

const plainObject = z.custom<Record<string, unknown>>(
  (v) => typeof v === 'object' && v !== null && !Array.isArray(v),
  'JSON phải là một object { … }.',
)

export const CustomDataSchema = z.discriminatedUnion('mode', [
  z.object({
    mode: z.literal('fields'),
    schemaType: TypeNameSchema,
    properties: z
      .array(z.object({ label: PropertyNameSchema, value: required('giá trị', 2000) }))
      .min(1, 'Cần ít nhất một dòng label: value.')
      .max(50),
  }),
  z.object({
    mode: z.literal('json'),
    json: plainObject
      .refine((v) => typeof v['@type'] === 'string' && v['@type'] !== '', 'JSON cần có "@type".')
      .refine((v) => JSON.stringify(v).length <= MAX_JSON_CHARS, `JSON tối đa ${MAX_JSON_CHARS.toLocaleString('en-US')} ký tự.`),
  }),
])

/** One custom schema as entered: its type and that type's fields. */
export const CustomSchemaInputSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('HowTo'), data: HowToDataSchema }),
  z.object({ type: z.literal('FAQPage'), data: FaqDataSchema }),
  z.object({ type: z.literal('Recipe'), data: RecipeDataSchema }),
  z.object({ type: z.literal('ImageGallery'), data: ImageGalleryDataSchema }),
  z.object({ type: z.literal('Product'), data: ProductDataSchema }),
  z.object({ type: z.literal('Service'), data: ServiceDataSchema }),
  z.object({ type: z.literal('Custom'), data: CustomDataSchema }),
])
export type CustomSchemaInput = z.output<typeof CustomSchemaInputSchema>

/** What the admin form and the API save: the page, an optional name and the schema itself. */
export const CustomSchemaFormSchema = z.object({
  path: SchemaPathSchema,
  name: optionalText(120),
  schema: CustomSchemaInputSchema,
})
export type CustomSchemaForm = z.output<typeof CustomSchemaFormSchema>

type JsonLd = Record<string, unknown>

/** Leaves out empty strings and empty lists, so the markup only carries what was filled in. */
function compact(obj: JsonLd): JsonLd {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== '' && v !== undefined && !(Array.isArray(v) && v.length === 0)),
  )
}

const image = (url: string) => (url ? assetUrl(url) : '')
const pageUrl = (path: string) => (path === '/' ? `${SITE_URL}/` : `${SITE_URL}${path}`)

function offer(o: z.output<typeof OfferSchema> | undefined, extra: JsonLd = {}) {
  if (!o?.price) return undefined
  return compact({ '@type': 'Offer', price: o.price, priceCurrency: o.priceCurrency || 'USD', ...extra })
}

/** The JSON-LD object for one custom schema on the page at `path`. */
export function buildCustomJsonLd(input: CustomSchemaInput, path: string): JsonLd {
  const base = { '@context': 'https://schema.org' }
  switch (input.type) {
    case 'HowTo': {
      const d = input.data
      return compact({
        ...base,
        '@type': 'HowTo',
        name: d.name,
        description: d.description,
        image: image(d.image),
        totalTime: d.totalTime,
        supply: d.supply.filter(Boolean).map((name) => ({ '@type': 'HowToSupply', name })),
        tool: d.tool.filter(Boolean).map((name) => ({ '@type': 'HowToTool', name })),
        step: d.steps.map((s, i) =>
          compact({ '@type': 'HowToStep', position: i + 1, name: s.name, text: s.text, image: image(s.image) }),
        ),
      })
    }
    case 'FAQPage':
      return {
        ...base,
        '@type': 'FAQPage',
        mainEntity: input.data.items.map((q) => ({
          '@type': 'Question',
          name: q.question,
          acceptedAnswer: { '@type': 'Answer', text: q.answer },
        })),
      }
    case 'Recipe': {
      const d = input.data
      return compact({
        ...base,
        '@type': 'Recipe',
        name: d.name,
        description: d.description,
        image: [image(d.image)],
        author: { '@type': 'Organization', name: SITE_NAME },
        prepTime: d.prepTime,
        cookTime: d.cookTime,
        totalTime: d.totalTime,
        recipeYield: d.recipeYield,
        recipeCategory: d.recipeCategory,
        recipeCuisine: d.recipeCuisine,
        keywords: d.keywords,
        nutrition: d.calories ? { '@type': 'NutritionInformation', calories: d.calories } : undefined,
        recipeIngredient: d.ingredients,
        recipeInstructions: d.steps.map((s) => ({ '@type': 'HowToStep', text: s.text })),
      })
    }
    case 'ImageGallery': {
      const d = input.data
      return compact({
        ...base,
        '@type': 'ImageGallery',
        name: d.name,
        description: d.description,
        url: pageUrl(path),
        image: d.images.map((img) => compact({ '@type': 'ImageObject', contentUrl: image(img.url), caption: img.caption })),
      })
    }
    case 'Product': {
      const d = input.data
      return compact({
        ...base,
        '@type': 'Product',
        name: d.name,
        description: d.description,
        image: d.images.map(image),
        brand: d.brand ? { '@type': 'Brand', name: d.brand } : undefined,
        sku: d.sku,
        gtin: d.gtin,
        offers: offer(d.offer, { availability: d.offer ? `https://schema.org/${d.offer.availability}` : '', url: pageUrl(path) }),
      })
    }
    case 'Service': {
      const d = input.data
      return compact({
        ...base,
        '@type': 'Service',
        name: d.name,
        description: d.description,
        serviceType: d.serviceType,
        areaServed: d.areaServed,
        url: d.url ? assetUrl(d.url) : pageUrl(path),
        provider: { '@type': 'Organization', name: SITE_NAME, url: `${SITE_URL}/` },
        offers: offer(d.offer),
      })
    }
    case 'Custom': {
      const d = input.data
      if (d.mode === 'json') {
        // Every other key is kept as entered; the context is always schema.org.
        const { '@context': _ignored, ...rest } = d.json
        return { ...base, ...rest }
      }
      const props = Object.fromEntries(d.properties.map((p) => [p.label, p.value]))
      return { ...base, '@type': d.schemaType, ...props }
    }
  }
}

/**
 * The page's JSON-LD: built-in markup plus the published custom schemas. A
 * custom schema replaces built-in markup of the same type where listed in
 * REPLACES_BUILT_IN (a page should carry one FAQPage, not two).
 */
export function mergeJsonLd(builtIn: object[], custom: object[] = []): object[] {
  const customTypes = new Set(custom.map((c) => (c as JsonLd)['@type']))
  const kept = builtIn.filter((b) => {
    const type = (b as JsonLd)['@type']
    return !(typeof type === 'string' && REPLACES_BUILT_IN.includes(type) && customTypes.has(type))
  })
  return [...kept, ...custom]
}

/**
 * JSON for a `<script type="application/ld+json">`. `<` is escaped so text
 * such as `</script>` in a schema (which outside tools can send) cannot end
 * the script tag early.
 */
export function serializeJsonLd(value: object) {
  return JSON.stringify(value).replace(/</g, '\\u003c')
}

/** Head `scripts` entries for a page's JSON-LD. */
export function ldScripts(builtIn: object[], custom?: object[]) {
  return mergeJsonLd(builtIn, custom).map((schema) => ({ type: 'application/ld+json', children: serializeJsonLd(schema) }))
}

/** An empty schema of each type, as the admin form starts it. */
export function blankSchema(type: CustomSchemaType): z.input<typeof CustomSchemaInputSchema> {
  switch (type) {
    case 'HowTo':
      return { type, data: { name: '', description: '', image: '', totalTime: '', supply: [], tool: [], steps: [{ name: '', text: '', image: '' }] } }
    case 'FAQPage':
      return { type, data: { items: [{ question: '', answer: '' }] } }
    case 'Recipe':
      return {
        type,
        data: {
          name: '',
          description: '',
          image: '',
          prepTime: '',
          cookTime: '',
          totalTime: '',
          recipeYield: '',
          recipeCategory: '',
          recipeCuisine: '',
          keywords: '',
          calories: '',
          ingredients: [''],
          steps: [{ text: '' }],
        },
      }
    case 'ImageGallery':
      return { type, data: { name: '', description: '', images: [{ url: '', caption: '' }] } }
    case 'Product':
      return { type, data: { name: '', description: '', images: [], brand: '', sku: '', gtin: '' } }
    case 'Service':
      return { type, data: { name: '', description: '', serviceType: '', areaServed: '', url: '' } }
    case 'Custom':
      return { type, data: { mode: 'fields', schemaType: '', properties: [{ label: '', value: '' }] } }
  }
}
