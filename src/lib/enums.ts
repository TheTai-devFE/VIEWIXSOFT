/** Enumerations shared by the database schema, server functions and admin UI. */
export const LEAD_TYPES = ['contact', 'demo', 'newsletter'] as const
export const LEAD_STATUSES = ['new', 'contacted', 'qualified', 'won', 'lost', 'spam'] as const
export const PRODUCT_STATUSES = ['available', 'coming-soon', 'hidden'] as const
/** Hand-made schema markup (src/lib/seo/custom-schema.ts). `pending` waits for an admin; only `published` reaches the page. */
export const CUSTOM_SCHEMA_TYPES = ['HowTo', 'FAQPage', 'Recipe', 'ImageGallery', 'Product', 'Service', 'Custom'] as const
export const CUSTOM_SCHEMA_STATUSES = ['pending', 'published', 'disabled'] as const

export type LeadStatus = (typeof LEAD_STATUSES)[number]
export type ProductStatus = (typeof PRODUCT_STATUSES)[number]
