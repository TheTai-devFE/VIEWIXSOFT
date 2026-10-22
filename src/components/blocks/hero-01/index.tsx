import { BrandSlider } from './brand-slider'
import type { BrandList } from './brand-slider'
import { HeroHeader } from './header'
import type { NavigationSection } from './header'
import { HeroSection } from './hero'
import { ParticlesBackground } from './particles-background'
import { PARTNERS } from '~/data/partners'

const NAVIGATION: NavigationSection[] = [
  { title: 'Products', to: '/products' },
  { title: 'Use cases', to: '/use-cases' },
  { title: 'Pricing', to: '/pricing' },
  { title: 'Blog', to: '/blog' },
  { title: 'About', to: '/about' },
  { title: 'Contact', to: '/contact' },
]

function partnerLogos(): BrandList[] {
  if (PARTNERS.length > 0) return PARTNERS.map((p) => ({ name: p.name, image: p.logo }))
  if (!import.meta.env.DEV) return []
  // Dev-only stand-ins so the strip can be reviewed before real logos exist.
  // Inside the DEV branch so production builds drop them entirely.
  return Array.from({ length: 6 }, (_, i) => ({ name: `Partner logo ${i + 1}`, placeholder: true }))
}

type HeroOneProps = {
  headingLevel?: 'h1' | 'h2'
  // Off on real pages, where the root layout already renders SiteHeader.
  showHeader?: boolean
  // Pulls the hero under the fixed SiteHeader so the background runs to the top.
  underFixedHeader?: boolean
}

export function HeroOne({ headingLevel, showHeader = true, underFixedHeader = false }: HeroOneProps) {
  const partners = partnerLogos()
  return (
    <div className="relative">
      {showHeader && <HeroHeader navigationData={NAVIGATION} />}
      <HeroSection
        headingLevel={headingLevel}
        background={<ParticlesBackground />}
        className={underFixedHeader ? '-mt-16 pt-16' : undefined}
      />
      {partners.length > 0 && <BrandSlider label="Trusted by our partners" brandList={partners} />}
    </div>
  )
}
