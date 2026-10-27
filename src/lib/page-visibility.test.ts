import { describe, expect, it } from 'vitest'
import { getPageVisibility, isPageVisible, pathToPageKey } from '~/lib/page-visibility'
import { DEFAULT_SITE_CONFIG } from '~/lib/site-config'
import type { SiteConfig } from '~/lib/site-config'
import { ADMIN_PAGES } from '~/data/admin-pages'

describe('page-visibility', () => {
  it('correctly maps paths to page keys', () => {
    expect(pathToPageKey('/')).toBe('home')
    expect(pathToPageKey('/pricing')).toBe('pricing')
    expect(pathToPageKey('/case-studies')).toBe('use-cases')
    expect(pathToPageKey('/use-cases')).toBe('use-cases')
    expect(pathToPageKey('/products/cms')).toBe('product-cms')
    expect(pathToPageKey('/case-studies/retail')).toBe('use-case-retail')
    expect(pathToPageKey('/about')).toBe('about')
    expect(pathToPageKey('/legal/privacy')).toBe('legal-privacy')
  })

  it('home is always visible', () => {
    const config: SiteConfig = {
      ...DEFAULT_SITE_CONFIG,
      content: {
        'global:page_visibility': { home: false },
      },
    }
    expect(isPageVisible(config, 'home')).toBe(true)
    expect(isPageVisible(config, '/')).toBe(true)
  })

  it('pages default to visible when not set in config', () => {
    expect(isPageVisible(DEFAULT_SITE_CONFIG, 'pricing')).toBe(true)
    expect(isPageVisible(DEFAULT_SITE_CONFIG, '/about')).toBe(true)
  })

  it('respects false visibility setting', () => {
    const config: SiteConfig = {
      ...DEFAULT_SITE_CONFIG,
      content: {
        'global:page_visibility': {
          pricing: false,
          about: false,
        },
      },
    }
    expect(isPageVisible(config, 'pricing')).toBe(false)
    expect(isPageVisible(config, '/pricing')).toBe(false)
    expect(isPageVisible(config, 'about')).toBe(false)
    expect(isPageVisible(config, 'contact')).toBe(true)
  })

  it('uses the same keys as the admin toggle', () => {
    for (const page of ADMIN_PAGES) {
      expect(pathToPageKey(page.path)).toBe(page.key)
    }
  })

  it('hides a case study when the case studies index is hidden', () => {
    const config: SiteConfig = {
      ...DEFAULT_SITE_CONFIG,
      content: { 'global:page_visibility': { 'use-cases': false } },
    }
    expect(isPageVisible(config, '/case-studies')).toBe(false)
    expect(isPageVisible(config, '/case-studies/retail')).toBe(false)
  })
})
