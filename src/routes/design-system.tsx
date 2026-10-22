import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { generateMetaTags } from '~/lib/seo/meta'
import { Screen, TestBars } from '~/components/story/primitives/Screen'
import { BootStandby } from '~/components/story/primitives/BootStandby'
import { HeroOne } from '~/components/blocks/hero-01'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'

const SWATCHES = [
  { name: 'Ink 950 · room', token: '--color-ink-950', className: 'bg-ink-950' },
  { name: 'Ink 850 · bezel', token: '--color-ink-850', className: 'bg-ink-850' },
  { name: 'Ink 50 · paper', token: '--color-ink-50', className: 'bg-ink-50' },
  { name: 'Signal 400', token: '--color-signal-400', className: 'bg-signal-400' },
  { name: 'Signal 700 · light mode', token: '--color-signal-700', className: 'bg-signal-700' },
  { name: 'Alert', token: '--color-alert', className: 'bg-alert' },
  { name: 'CMS light', token: '--color-light-cms', className: 'bg-light-cms' },
  { name: 'POS light', token: '--color-light-pos', className: 'bg-light-pos' },
  { name: 'NFC light', token: '--color-light-nfc', className: 'bg-light-nfc' },
  { name: 'Tracking light', token: '--color-light-tracking', className: 'bg-light-tracking' },
]
import { 
  Sparkles, CheckCircle2, AlertTriangle, Info, XCircle, 
  ArrowRight, Layers, Monitor, Sliders, ChevronRight 
} from 'lucide-react'

export const Route = createFileRoute('/design-system')({
  head: () => {
    const seo = generateMetaTags({
      title: 'Design System & Component Tokens',
      description: 'Living design system and token showcase for Viewixsoft.',
      noindex: true,
      canonicalUrl: '/design-system',
    })
    return {
      meta: seo.meta,
      links: seo.links,
    }
  },
  component: DesignSystemPage,
})

function DesignSystemPage() {
  const [activeTab, setActiveTab] = useState<'tokens' | 'primitives' | 'form'>('tokens')
  const [checkboxChecked, setCheckboxChecked] = useState(true)

  return (
    <div className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
      {/* Header */}
      <div className="space-y-4 border-b border-ink-800 pb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-signal-500/10 border border-signal-500/20 text-xs font-mono text-signal-400">
          <span>Design Tokens & UI Kit</span>
          <span>•</span>
          <span>WCAG 2.2 AA Compliant</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-black text-ink-50 tracking-tight">
          Viewixsoft Design System
        </h1>
        <p className="text-ink-400 max-w-2xl text-base">
          Modular design tokens, accessible primitives, and specialized signage UI components. Built with CSS variables, Tailwind CSS v4, and dark-first aesthetics.
        </p>

        {/* Tab switcher */}
        <div className="flex gap-2 pt-4">
          <button
            onClick={() => setActiveTab('tokens')}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'tokens' ? 'bg-signal-500 text-ink-950' : 'bg-ink-900 text-ink-400 hover:text-ink-50'
            }`}
          >
            Design Tokens
          </button>
          <button
            onClick={() => setActiveTab('primitives')}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'primitives' ? 'bg-signal-500 text-ink-950' : 'bg-ink-900 text-ink-400 hover:text-ink-50'
            }`}
          >
            Buttons & Primitives
          </button>
          <button
            onClick={() => setActiveTab('form')}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'form' ? 'bg-signal-500 text-ink-950' : 'bg-ink-900 text-ink-400 hover:text-ink-50'
            }`}
          >
            Form Fields & States
          </button>
        </div>
      </div>

      {/* SECTION 1: TOKENS */}
      {activeTab === 'tokens' && (
        <div className="space-y-12">
          {/* Colors */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-ink-50 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-signal-400"></span>
              Color Palette & Roles
            </h2>
            <p className="max-w-2xl text-sm text-ink-400">
              Phosphor Terminal: the room is carbon ink, the only chrome hue is phosphor signal green, and each product
              has its own screen light that appears only inside a screen.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
              {SWATCHES.map((sw) => (
                <div key={sw.token} className="p-3 rounded-lg bg-ink-900 border border-ink-800 space-y-2">
                  <div className={`h-12 rounded-md border border-ink-700 ${sw.className}`}></div>
                  <div className="text-xs font-semibold text-ink-50">{sw.name}</div>
                  <div className="text-[10px] text-ink-500 font-mono">{sw.token}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Story primitives */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-ink-50 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-signal-400"></span>
              Story Primitives
            </h2>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Screen className="aspect-video">
                  <BootStandby />
                </Screen>
                <p className="eyebrow text-ink-400">Screen · standby</p>
              </div>
              <div className="space-y-2">
                <Screen className="aspect-video">
                  <TestBars />
                </Screen>
                <p className="eyebrow text-ink-400">Screen · test bars</p>
              </div>
            </div>
          </div>

          {/* Typography Scale */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-ink-50 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-signal-400"></span>
              Fluid Typography Scale
            </h2>
            <div className="space-y-4 p-6 rounded-2xl panel border border-ink-800">
              <div className="border-b border-ink-800/80 pb-3">
                <div className="text-xs text-ink-500 font-mono mb-1">Hero — --text-hero (Space Grotesk)</div>
                <div className="text-3xl sm:text-5xl font-black text-ink-50">The Power of Connected Screens</div>
              </div>
              <div className="border-b border-ink-800/80 pb-3">
                <div className="text-xs text-ink-500 font-mono mb-1">Scene heading — --text-scene</div>
                <div className="text-2xl sm:text-3xl font-extrabold text-ink-50">Mission-Critical Signage Architecture</div>
              </div>
              <div className="border-b border-ink-800/80 pb-3">
                <div className="text-xs text-ink-500 font-mono mb-1">Heading 3</div>
                <div className="text-xl sm:text-2xl font-bold text-ink-50">Hardware Agnostic Media Players</div>
              </div>
              <div>
                <div className="text-xs text-ink-500 font-mono mb-1">Body Text — 16px / line-height: 1.6</div>
                <p className="text-ink-300 text-sm max-w-2xl leading-relaxed">
                  Viewixsoft delivers continuous edge rendering with automatic asset synchronization, local SQLite failover, and hardware CEC power control.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: BUTTONS & PRIMITIVES */}
      {activeTab === 'primitives' && (
        <div className="space-y-12">
          {/* Button Variants */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-ink-50">Button Variants & Sizes</h2>
            <div className="flex flex-wrap gap-4 items-center p-6 rounded-2xl panel border border-ink-800">
              <button className="px-6 py-3 rounded-xl bg-brand-gradient shine text-on-gradient font-bold text-xs uppercase tracking-wider hover:opacity-95 shadow-lg cursor-pointer">
                Primary Gradient
              </button>
              <button className="px-6 py-3 rounded-xl bg-signal-500 hover:bg-brand-gradient shine text-on-gradient font-bold text-xs uppercase tracking-wider cursor-pointer">
                Solid Cyan
              </button>
              <button className="px-6 py-3 rounded-xl bg-ink-900 hover:bg-ink-800 border border-ink-700 text-ink-50 font-semibold text-xs tracking-wider cursor-pointer">
                Secondary Slate
              </button>
              <button className="px-6 py-3 rounded-xl bg-transparent hover:bg-ink-900 text-ink-300 hover:text-ink-50 font-semibold text-xs tracking-wider cursor-pointer">
                Ghost / Subtle
              </button>
              <button className="px-6 py-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-400 font-bold text-xs uppercase tracking-wider cursor-pointer">
                Destructive
              </button>
            </div>
          </div>

          {/* shadcn/ui primitives (components/ui) */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-ink-50">shadcn/ui Primitives</h2>
            <div className="space-y-6 p-6 rounded-2xl panel border border-ink-800">
              <div className="flex flex-wrap gap-3 items-center">
                <Button>Default</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="link">Link</Button>
                <Button variant="destructive">Destructive</Button>
                <Button size="sm">Small</Button>
                <Button size="lg">Large</Button>
              </div>
              <div className="grid max-w-sm gap-2">
                <Label htmlFor="ds-shadcn-email">Work email</Label>
                <Input id="ds-shadcn-email" type="email" placeholder="you@company.com" />
              </div>
            </div>
          </div>

          {/* Hero 01 block */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-ink-50">Hero 01 (Header, Hero, Platform Slider)</h2>
            <div className="overflow-hidden rounded-2xl border border-ink-800">
              <HeroOne headingLevel="h2" />
            </div>
          </div>

          {/* Badges & Pills */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-ink-50">Status Badges & Pills</h2>
            <div className="flex flex-wrap gap-3 p-6 rounded-2xl panel border border-ink-800">
              <span className="px-3 py-1 rounded-full text-xs font-mono font-semibold bg-signal-950/60 text-signal-400 border border-signal-800/40">
                Core Engine
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-mono font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                99.99% Live
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-mono font-semibold bg-amber-950/60 text-amber-400 border border-amber-800/40">
                Sync Delayed
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-mono font-semibold bg-rose-950/60 text-rose-400 border border-rose-800/40">
                Signal Alert
              </span>
            </div>
          </div>

          {/* Skeleton Loaders */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-ink-50">Skeleton Loading States</h2>
            <div className="p-6 rounded-2xl panel border border-ink-800 space-y-4 max-w-md">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-ink-800 animate-pulse"></div>
                <div className="space-y-2 flex-1">
                  <div className="h-3 bg-ink-800 rounded w-3/4 animate-pulse"></div>
                  <div className="h-2.5 bg-ink-900 rounded w-1/2 animate-pulse"></div>
                </div>
              </div>
              <div className="h-24 bg-ink-900 rounded-xl animate-pulse"></div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: FORM FIELDS */}
      {activeTab === 'form' && (
        <div className="space-y-8 max-w-2xl">
          <h2 className="text-2xl font-bold text-ink-50">Form Inputs & Validation States</h2>
          <div className="p-8 rounded-2xl panel border border-ink-800 space-y-6">
            {/* Standard Text Input */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink-300">
                Work Email <span className="text-signal-400">*</span>
              </label>
              <input
                type="email"
                placeholder="name@enterprise.com"
                defaultValue="director@retailbrand.com"
                className="w-full px-4 py-3 rounded-xl bg-ink-900/90 border border-ink-700 text-ink-50 placeholder-ink-500 focus:outline-none focus:border-signal-400 focus:ring-1 focus:ring-signal-400 text-sm"
              />
              <span className="text-[11px] text-ink-500">Corporate domains preferred for priority demo routing.</span>
            </div>

            {/* Error State */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink-300">
                Phone Number (E.164 format)
              </label>
              <input
                type="tel"
                placeholder="+1 555 019 2831"
                defaultValue="invalid-phone"
                className="w-full px-4 py-3 rounded-xl bg-ink-900/90 border border-red-500 text-ink-50 text-sm focus:outline-none focus:ring-1 focus:ring-red-500"
              />
              <div className="flex items-center gap-1.5 text-xs text-red-400">
                <XCircle className="w-4 h-4 shrink-0" />
                <span>Please enter a valid international phone number including country code.</span>
              </div>
            </div>

            {/* Select Dropdown */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink-300">
                Screen Fleet Size
              </label>
              <select className="w-full px-4 py-3 rounded-xl bg-ink-900/90 border border-ink-700 text-ink-50 text-sm focus:outline-none focus:border-signal-400">
                <option>10 – 50 Screens</option>
                <option>51 – 200 Screens</option>
                <option>201 – 1,000 Screens</option>
                <option>1,000+ Enterprise Fleet</option>
              </select>
            </div>

            {/* Checkbox */}
            <div className="flex items-start gap-3 pt-2">
              <input
                type="checkbox"
                id="consent-demo"
                checked={checkboxChecked}
                onChange={(e) => setCheckboxChecked(e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-ink-700 bg-ink-900 text-signal-500 focus:ring-signal-400 cursor-pointer"
              />
              <label htmlFor="consent-demo" className="text-xs text-ink-400 leading-relaxed cursor-pointer">
                I agree to the Viewixsoft Privacy Policy and consent to receiving communication regarding software architecture and pilot demonstrations.
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
