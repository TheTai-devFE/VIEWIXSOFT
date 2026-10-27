import type { NewsletterTopic } from '~/server/schema/validation'

/** Chip labels for the sign-up form; product names are always written in full. */
export const TOPIC_CHIPS: { topic: NewsletterTopic; label: string }[] = [
  { topic: 'newsletter', label: 'All updates' },
  { topic: 'cms', label: 'Viewixsoft CMS' },
  { topic: 'pos', label: 'Viewixsoft POS' },
  { topic: 'tracking', label: 'Viewixsoft Tracking' },
  { topic: 'nfc', label: 'Viewixsoft NFC' },
]

/**
 * "All updates" covers every product, so it and the product chips exclude each
 * other: picking a product narrows the list, and removing the last product
 * goes back to "All updates". At least one topic is always picked.
 */
export function toggleTopic(current: NewsletterTopic[], topic: NewsletterTopic): NewsletterTopic[] {
  if (topic === 'newsletter') return ['newsletter']
  const products = current.filter((t) => t !== 'newsletter')
  const next = products.includes(topic) ? products.filter((t) => t !== topic) : [...products, topic]
  return next.length > 0 ? next : ['newsletter']
}
