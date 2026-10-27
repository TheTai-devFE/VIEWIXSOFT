import { describe, expect, it } from 'vitest'
import { toggleTopic } from '~/lib/newsletter-topics'

describe('toggleTopic', () => {
  it('narrows "All updates" to the first product picked', () => {
    expect(toggleTopic(['newsletter'], 'pos')).toEqual(['pos'])
  })

  it('adds and removes products', () => {
    expect(toggleTopic(['pos'], 'nfc')).toEqual(['pos', 'nfc'])
    expect(toggleTopic(['pos', 'nfc'], 'pos')).toEqual(['nfc'])
  })

  it('falls back to "All updates" when the last product is removed', () => {
    expect(toggleTopic(['pos'], 'pos')).toEqual(['newsletter'])
  })

  it('picking "All updates" clears the products', () => {
    expect(toggleTopic(['pos', 'nfc'], 'newsletter')).toEqual(['newsletter'])
    expect(toggleTopic(['newsletter'], 'newsletter')).toEqual(['newsletter'])
  })
})
