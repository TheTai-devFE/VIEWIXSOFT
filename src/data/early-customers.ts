/**
 * First customers running Viewix hardware with Viewixsoft software, shown on
 * the About page.
 *
 * Add a customer only with their written approval of the quote, name, company
 * and photo. Put photos in `public/customers/` (square WebP, ~160×160).
 * `rating` is optional; set it only when the customer gave one.
 *
 * TODO(content): add real customers. While the list is empty the section is
 * hidden in production and shows labelled placeholders in the dev server.
 */
export interface EarlyCustomer {
  name: string
  role: string
  company: string
  quote: string
  /** What they run, e.g. "Viewix display", "Viewixsoft CMS". */
  uses: string[]
  avatar?: string
  rating?: 1 | 2 | 3 | 4 | 5
}

export const EARLY_CUSTOMERS: EarlyCustomer[] = []

export const EARLY_CUSTOMER_PLACEHOLDERS: EarlyCustomer[] = Array.from({ length: 4 }, (_, i) => ({
  name: `Customer ${i + 1}`,
  role: 'TODO(content): role',
  company: 'TODO(content): company',
  quote: 'TODO(content): approved quote about using Viewix screens with Viewixsoft software.',
  uses: ['Viewix display', 'Viewixsoft CMS'],
}))
