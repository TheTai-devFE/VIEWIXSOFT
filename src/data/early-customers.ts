/**
 * First customers running Viewix hardware with Viewixsoft software, shown on
 * the About page.
 *
 * Add a customer only with their written approval of the quote, name, company
 * and photo. Put photos in `public/customers/` (square WebP, ~160×160).
 * `rating` is optional; set it only when the customer gave one.
 *
 * TODO(content): add real customers. While the list is empty the section is
 * hidden in production and shows lorem ipsum placeholders in the dev server,
 * or on a deploy built with VITE_PUBLIC_SHOW_PLACEHOLDER_QUOTES=true.
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

// Lorem ipsum on purpose: nobody can mistake these for real customers.
const LOREM_QUOTES = [
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
  'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
  'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
  'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
]

export const EARLY_CUSTOMER_PLACEHOLDERS: EarlyCustomer[] = LOREM_QUOTES.map((quote, i) => ({
  name: `Lorem Ipsum ${i + 1}`,
  role: 'Dolor sit amet',
  company: 'Consectetur Co.',
  quote,
  uses: ['Viewix display', 'Viewixsoft CMS'],
}))
