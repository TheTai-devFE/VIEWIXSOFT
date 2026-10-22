/**
 * Copy and channel data for the home page story ("The Life of a Screen").
 * Kept in one place so headings, the chapter rail and Markdown twins stay in sync.
 *
 * TODO(content): on-screen readouts inside the illustrations (prices, counters,
 * fleet health, log lines) are illustrative UI, not customer data. Confirm with
 * the product team before reusing any of them as a claim in copy.
 */

export interface Chapter {
  id: string
  code: string
  label: string
}

export const CHAPTERS: Chapter[] = [
  { id: 'ch-solutions', code: '00', label: 'Solutions' },
  { id: 'ch-drift', code: '01', label: 'Drift' },
  { id: 'ch-cms', code: '02', label: 'CMS' },
  { id: 'ch-pos', code: '03', label: 'POS' },
  { id: 'ch-nfc', code: '04', label: 'NFC' },
  { id: 'ch-tracking', code: '05', label: 'Tracking' },
  { id: 'ch-your-network', code: '06', label: 'Your network' },
]

export interface Channel {
  id: string
  label: string
  useCaseSlug: string
}

export interface CmsChannel extends Channel {
  headline: string
  sub: string
}

export const CMS_CHANNELS: CmsChannel[] = [
  { id: 'retail', label: 'Retail', useCaseSlug: 'retail', headline: 'Summer edit', sub: 'New season · in store now' },
  { id: 'qsr', label: 'QSR', useCaseSlug: 'qsr-menu-boards', headline: 'Lunch combo', sub: 'Served 11:00 – 15:00' },
  { id: 'transit', label: 'Transit', useCaseSlug: 'transportation', headline: 'Platform 4', sub: 'Next train · 3 min' },
  { id: 'dooh', label: 'DOOH', useCaseSlug: 'dooh-advertising', headline: 'Summer promo', sub: 'Campaign #4092 · live' },
]

export interface PosChannel extends Channel {
  item: string
  oldPrice: string
  newPrice: string
  others: { name: string; price: string }[]
}

export const POS_CHANNELS: PosChannel[] = [
  {
    id: 'drive-thru',
    label: 'Drive-thru',
    useCaseSlug: 'qsr-menu-boards',
    item: 'Double beef burger',
    oldPrice: '$8.50',
    newPrice: '$9.20',
    others: [
      { name: 'Crispy chicken wrap', price: '$7.40' },
      { name: 'Large fries', price: '$3.10' },
      { name: 'Iced lemon tea', price: '$2.60' },
    ],
  },
  {
    id: 'retail-shelf',
    label: 'Retail shelf',
    useCaseSlug: 'retail',
    item: 'Cold brew, 1 L',
    oldPrice: '$6.40',
    newPrice: '$5.90',
    others: [
      { name: 'Oat milk, 1 L', price: '$3.20' },
      { name: 'Granola, 500 g', price: '$4.80' },
      { name: 'Sparkling water', price: '$1.10' },
    ],
  },
  {
    id: 'bar',
    label: 'Bar & lounge',
    useCaseSlug: 'hospitality',
    item: 'House spritz',
    oldPrice: '$12.00',
    newPrice: '$9.00',
    others: [
      { name: 'Draft lager', price: '$7.00' },
      { name: 'Negroni', price: '$13.00' },
      { name: 'Truffle fries', price: '$8.50' },
    ],
  },
]

export interface NfcChannel extends Channel {
  screenTitle: string
  passTitle: string
  passDetail: string
}

export const NFC_CHANNELS: NfcChannel[] = [
  {
    id: 'fashion',
    label: 'Fashion retail',
    useCaseSlug: 'retail',
    screenTitle: 'New season drop',
    passTitle: '15% off today',
    passDetail: 'Show at checkout · valid 24 h',
  },
  {
    id: 'events',
    label: 'Event tickets',
    useCaseSlug: 'hospitality',
    screenTitle: 'Live tonight',
    passTitle: 'Row F · Seat 12',
    passDetail: 'Doors 19:30 · Gate B',
  },
  {
    id: 'transit',
    label: 'Transit pass',
    useCaseSlug: 'transportation',
    screenTitle: 'Tap for a day pass',
    passTitle: 'Day pass · Zones 1–2',
    passDetail: 'Valid until 04:00',
  },
]

export const SUPPORTED_HARDWARE = ['Android 11+', 'Rockchip RK3566', 'RK3576', 'RK3588']

/** Shared with /contact so the quick form's values always prefill correctly. */
export const SCREEN_RANGES = ['10 – 50 Screens', '51 – 200 Screens', '201 – 1,000 Screens', '1,000+ Enterprise Fleet'] as const
