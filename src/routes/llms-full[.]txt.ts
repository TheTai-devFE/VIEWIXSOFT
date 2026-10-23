import { createFileRoute } from '@tanstack/react-router'
import { buildLlmsFullTxt, textResponse } from '~/lib/seo/generators'
import { resolveSectionContent } from '~/lib/section-content'
import { pricingFromConfig } from '~/lib/pricing'
import { visibleProducts } from '~/lib/site-config'
import { postMarkdown } from '~/server/content/blog-raw'
import { loadSiteConfig } from '~/server/site/config'

export const Route = createFileRoute('/llms-full.txt')({
  server: {
    handlers: {
      GET: async () => {
        const config = await loadSiteConfig()
        const faq = resolveSectionContent('home:faq', config.content['home:faq']).items
        return textResponse(
          buildLlmsFullTxt(visibleProducts(config), postMarkdown, faq, pricingFromConfig(config)),
          'text/plain',
        )
      },
    },
  },
})
