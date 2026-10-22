import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '~/components/ui/button'
import { cn } from '~/lib/cn'

export type AvatarList = {
  image: string
  name: string
}

type HeroSectionProps = {
  // Real customer photos only; the stack is hidden until there is content.
  avatarList?: AvatarList[]
  socialProof?: string
  // Lets the block be previewed under a page that already owns the <h1>.
  headingLevel?: 'h1' | 'h2'
  // Decorative layer painted behind the content (e.g. a particle canvas).
  background?: ReactNode
  className?: string
}

export function HeroSection({ avatarList = [], socialProof, headingLevel = 'h1', background, className }: HeroSectionProps) {
  const Heading = headingLevel

  return (
    <section aria-labelledby="hero-01-title" className={cn('relative isolate overflow-hidden bg-background', className)}>
      {background}
      <div className="relative z-10 mx-auto flex max-w-5xl flex-col items-center gap-8 px-4 py-20 text-center sm:px-6 md:py-28 lg:px-8">
        <p className="eyebrow">Digital signage software</p>

        <Heading
          id="hero-01-title"
          className="text-hero font-display font-bold tracking-tight text-balance text-foreground"
        >
          Run every advertising screen <span className="text-brand-gradient">from one cloud platform</span>
        </Heading>

        <p className="max-w-2xl text-lg text-pretty text-muted-foreground">
          Viewixsoft is digital signage software that schedules content, syncs POS menus, tracks proof-of-play and adds
          NFC tap-to-interact on any screen.
        </p>

        <div className="flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row">
          <Button asChild size="lg" className="w-full sm:w-auto">
            <Link to="/contact" preload="intent">
              Book a demo
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
            <Link to="/products" preload="intent">
              Explore products
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </div>

        {avatarList.length > 0 && (
          <div className="flex items-center gap-3">
            <ul className="flex -space-x-3">
              {avatarList.map((avatar) => (
                <li key={avatar.image}>
                  <img
                    src={avatar.image}
                    alt={avatar.name}
                    width={40}
                    height={40}
                    loading="lazy"
                    className="size-10 rounded-full border-2 border-background object-cover"
                  />
                </li>
              ))}
            </ul>
            {socialProof && <p className="text-sm text-muted-foreground">{socialProof}</p>}
          </div>
        )}
      </div>
    </section>
  )
}
