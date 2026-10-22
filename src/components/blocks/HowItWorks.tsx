import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { Reveal } from '~/components/ui/reveal'

// Steps use only confirmed Viewixsoft CMS facts (player OS, offline cache, remote management).
const STEPS = [
  {
    title: 'Connect your Viewix screens',
    description:
      'Viewixsoft CMS runs on Viewix players with Android 11 or later. Connect each screen over Wi-Fi or Ethernet and it appears in your dashboard.',
  },
  {
    title: 'Upload media and build playlists',
    description:
      'Add videos, images and web pages, arrange them in multi-zone layouts, and schedule them by time of day and by location.',
  },
  {
    title: 'Publish and manage from anywhere',
    description:
      'Send changes to one screen or a whole group from the cloud. Screens cache their content, so playback continues if the internet drops.',
  },
]

export function HowItWorks() {
  return (
    <section aria-labelledby="how-it-works-title" className="border-t border-ink-800 bg-ink-900">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <Reveal className="max-w-3xl">
          <p className="eyebrow">How it works</p>
          <h2
            id="how-it-works-title"
            className="mt-3 font-display text-4xl font-semibold tracking-tight text-balance text-ink-50 sm:text-5xl"
          >
            How do you manage screens with Viewixsoft CMS?
          </h2>
          <p className="mt-5 text-lg text-pretty text-ink-400">
            You connect your screens once, then upload, schedule and publish content to all of them from one cloud
            dashboard. It takes three steps.
          </p>
        </Reveal>

        <ol className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-ink-800 bg-ink-800 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <li key={step.title} className="bg-ink-950 p-8">
              <Reveal delay={i * 100}>
                <span className="font-mono text-sm text-signal-400">0{i + 1}</span>
                <h3 className="mt-4 font-display text-xl font-semibold text-ink-50">{step.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-ink-400">{step.description}</p>
              </Reveal>
            </li>
          ))}
        </ol>

        <Link
          to="/products/$slug"
          params={{ slug: 'cms' }}
          preload="intent"
          className="mt-10 inline-flex items-center gap-2 text-sm font-semibold text-signal-400 hover:text-signal-300"
        >
          See what Viewixsoft CMS supports
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      </div>
    </section>
  )
}
