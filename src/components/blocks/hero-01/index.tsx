import { BrandSlider } from './brand-slider'
import type { BrandList } from './brand-slider'
import { HeroSection } from './hero'
import { ParticlesBackground } from './particles-background'
import type { HomeHeroContent } from '~/lib/section-content'
import { useSectionContent } from '~/lib/use-section-content'
import { usePageContent } from '~/lib/use-page-content'

function partnerLogos(partners: HomeHeroContent['partners']): BrandList[] {
  if (partners.length > 0) {
    return partners.map((p) => ({
      id: p.id,
      name: p.name,
      image: p.logo ? { src: p.logo.url, width: p.logo.width, height: p.logo.height } : undefined,
    }))
  }
  if (!import.meta.env.DEV) return []
  // Dev-only stand-ins so the strip can be reviewed before real logos exist.
  // Inside the DEV branch so production builds drop them entirely.
  return Array.from({ length: 6 }, (_, i) => ({ id: `placeholder-${i}`, name: `Partner logo ${i + 1}`, placeholder: true }))
}

type HeroOneProps = {
  headingLevel?: 'h1' | 'h2'
  // Pulls the hero under the fixed SiteHeader so the background runs to the top.
  underFixedHeader?: boolean
}

export function HeroOne({ headingLevel, underFixedHeader = false }: HeroOneProps) {
  // The logo strip is edited in /admin/pages → Home → Hero.
  const { partnersLabel, partners: saved } = useSectionContent('home:hero')
  const partners = partnerLogos(saved)
  const { hero } = usePageContent('home')
  return (
    <div className="relative">
      <HeroSection
        headingLevel={headingLevel}
        hero={hero}
        background={<ParticlesBackground />}
        className={underFixedHeader ? '-mt-16 pt-16' : undefined}
      />
      {partners.length > 0 && <BrandSlider label={partnersLabel} brandList={partners} />}
    </div>
  )
}
