import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { expect, it } from 'vitest'
import { MarkdownRenderer } from './MarkdownRenderer'

it('renders the supplied alt and a distinct caption in the correct section', () => {
  const image = { url: '/image.webp', title: 'Screen setup', alt: 'A screen [online]', caption: 'Setup complete', description: 'The lobby screen is online.', width: 800, height: 450 }
  const html = renderToStaticMarkup(createElement(MarkdownRenderer, {
    content: 'Before the image\n\n![A screen online](/image.webp)\n\nAfter the image',
    images: [image],
  }))
  expect(html).toContain('alt="A screen [online]"')
  expect(html).toContain('title="Screen setup"')
  expect(html).toContain('aria-description="The lobby screen is online."')
  expect(html).toMatch(/Before the image[\s\S]*<figure[\s\S]*Setup complete<\/figcaption>[\s\S]*After the image/)
})
