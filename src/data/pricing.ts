/**
 * Viewixsoft CMS pricing. Prices in USD, supplied by the product owner on
 * 2026-10-16. Change prices here only; the pricing section and JSON-LD read
 * from this file.
 */

export type TermPlan = {
  years: 1 | 2 | 3 | 5
  /** Price per licence for the whole term. */
  price: number
  /** Percent saved against paying the 1-year price every year. */
  save?: number
  bestValue?: boolean
}

export const TERM_PLANS: TermPlan[] = [
  { years: 1, price: 48 },
  { years: 2, price: 76.8, save: 20 },
  { years: 3, price: 100.8, save: 30 },
  { years: 5, price: 144, save: 40, bestValue: true },
]

export const TERM_FEATURES = [
  'Real-time cloud sync 24/7',
  'High-speed CDN storage',
  'SSL-encrypted security',
  'Flexible playback scheduling',
]

/** Online (cloud) plans stop at this many licences; above it, Customer Server applies. */
export const MAX_ONLINE_LICENCES = 19

export const CUSTOMER_SERVER = {
  minLicences: 20,
  endUser: { price: 120 },
  reseller: { priceFrom: 78, priceTo: 72, discount: '35%–40% off list' },
  volumeDiscounts: [
    { licences: 40, percentOff: 15, endUserPrice: 102 },
    { licences: 50, percentOff: 20, endUserPrice: 96 },
  ],
}

/**
 * Sales contact for the Enterprise plan.
 * TODO(content): confirm the sales email and add a phone number; empty fields
 * are hidden.
 */
export const SALES_CONTACT = {
  email: 'sales@viewixsoft.com',
  phone: '',
  hours: '',
}

export function formatUsd(amount: number) {
  return amount.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  })
}
