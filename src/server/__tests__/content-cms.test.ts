import { describe, expect, it } from 'vitest'
import { BlogPostFormSchema, UseCaseFormSchema } from '~/lib/admin-schemas'

describe('BlogPostFormSchema validation', () => {
  it('validates a correct blog post input', () => {
    const valid = {
      title: 'Enterprise Digital Signage in 2026',
      slug: 'enterprise-digital-signage-in-2026',
      description: 'A comprehensive guide on running digital signage across retail stores.',
      content: '## Overview\n\nDigital signage is evolving rapidly with edge computing.',
      category: 'Architecture',
      product: 'cms',
      tags: ['DOOH', 'Enterprise'],
      authorName: 'Viewixsoft Team',
      status: 'published',
    }

    const parsed = BlogPostFormSchema.parse(valid)
    expect(parsed.slug).toBe('enterprise-digital-signage-in-2026')
    expect(parsed.status).toBe('published')
  })

  it('rejects an invalid slug with uppercase letters or special characters', () => {
    const invalid = {
      title: 'Invalid Post',
      slug: 'Invalid Slug with Spaces!',
      description: 'Short description here that is long enough.',
      content: 'Content that is long enough.',
      category: 'General',
      product: 'cms',
      tags: [],
      authorName: 'Author',
      status: 'draft',
    }

    expect(() => BlogPostFormSchema.parse(invalid)).toThrow()
  })

  it('rejects too short title or description', () => {
    const invalid = {
      title: 'Hi',
      slug: 'hi',
      description: 'Too short',
      content: 'Content',
      category: 'General',
      product: 'cms',
      tags: [],
      authorName: 'Author',
      status: 'draft',
    }

    expect(() => BlogPostFormSchema.parse(invalid)).toThrow()
  })
})

describe('UseCaseFormSchema validation', () => {
  it('validates a correct use case input', () => {
    const valid = {
      title: 'Smart Retail & Shopping Malls',
      slug: 'smart-retail-shopping-malls',
      industry: 'Retail',
      tagline: 'Driving foot traffic and increasing in-store conversion.',
      challengeHeading: 'What was the core challenge?',
      challenge: 'Static signs were slow and expensive to update weekly.',
      solutionHeading: 'How did Viewixsoft solve it?',
      solution: 'Deployed 500 connected screens with centralized CMS management.',
      results: [{ metric: '+40%', label: 'Sales growth' }],
      featuredProducts: [{ name: 'Viewixsoft CMS', slug: 'cms' }],
      status: 'published',
    }

    const parsed = UseCaseFormSchema.parse(valid)
    expect(parsed.slug).toBe('smart-retail-shopping-malls')
    expect(parsed.results[0]?.metric).toBe('+40%')
  })

  it('rejects missing industry or tagline', () => {
    const invalid = {
      title: 'Incomplete Case Study',
      slug: 'incomplete-case-study',
      industry: '',
      tagline: '',
      challenge: 'Challenge text here',
      solution: 'Solution text here',
      status: 'draft',
    }

    expect(() => UseCaseFormSchema.parse(invalid)).toThrow()
  })
})
