import { useMemo } from 'react'
import { pricingFromConfig } from '~/lib/pricing'
import type { PricingPlans } from '~/lib/pricing'
import { useSiteConfig } from '~/lib/use-site-config'

/** Viewixsoft CMS prices as published; see ~/lib/pricing. */
export function usePricing(): PricingPlans {
  const config = useSiteConfig()
  return useMemo(() => pricingFromConfig(config), [config])
}
