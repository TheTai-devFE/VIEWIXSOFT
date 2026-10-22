import { Link } from '@tanstack/react-router'
import type { LinkProps } from '@tanstack/react-router'
import { Menu } from 'lucide-react'
import { ViewixLogo } from '~/components/blocks/ViewixLogo'
import { Button } from '~/components/ui/button'
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from '~/components/ui/navigation-menu'
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from '~/components/ui/sheet'

export type NavigationSection = {
  title: string
  to: LinkProps['to']
}

type HeroHeaderProps = {
  navigationData: NavigationSection[]
}

export function HeroHeader({ navigationData }: HeroHeaderProps) {
  return (
    <header className="border-b border-border bg-background">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
        <Link to="/" aria-label="Viewixsoft home" className="shrink-0 text-foreground">
          <ViewixLogo className="h-6 w-auto" />
        </Link>

        <NavigationMenu className="hidden lg:flex" aria-label="Main">
          <NavigationMenuList>
            {navigationData.map((item) => (
              <NavigationMenuItem key={item.title}>
                <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                  <Link to={item.to} preload="intent" activeProps={{ 'aria-current': 'page' }}>
                    {item.title}
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>

        <div className="flex items-center gap-2">
          <Button asChild className="hidden sm:inline-flex">
            <Link to="/contact" preload="intent">
              Contact sales
            </Link>
          </Button>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="p-6">
              <SheetTitle>Menu</SheetTitle>
              <nav aria-label="Mobile" className="flex flex-col gap-1">
                {navigationData.map((item) => (
                  <SheetClose asChild key={item.title}>
                    <Link
                      to={item.to}
                      preload="intent"
                      className="rounded-md px-3 py-2 text-base font-medium text-foreground hover:bg-accent"
                    >
                      {item.title}
                    </Link>
                  </SheetClose>
                ))}
              </nav>
              <SheetClose asChild>
                <Button asChild className="mt-4">
                  <Link to="/contact">Contact sales</Link>
                </Button>
              </SheetClose>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
