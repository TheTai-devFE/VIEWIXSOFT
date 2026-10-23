import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Reveal } from "~/components/ui/reveal";
import { cn } from "~/lib/cn";
import { useSectionContent } from "~/lib/use-section-content";

// 2 steps sit side by side, 4 go 2 × 2 on tablets then one row.
const COLUMNS: Record<number, string> = {
  2: "md:grid-cols-2",
  3: "md:grid-cols-3",
  4: "md:grid-cols-2 lg:grid-cols-4",
};

export function HowItWorks() {
  const { eyebrow, title, description, steps } = useSectionContent("home:how-it-works");
  return (
    <section
      aria-labelledby="how-it-works-title"
      className="border-t border-ink-800 bg-ink-900">
      <div className="page-x section-y">
        <Reveal className="max-w-3xl">
          {eyebrow && <p className="eyebrow">{eyebrow}</p>}
          <h2
            id="how-it-works-title"
            className="mt-3 font-display text-4xl font-semibold tracking-tight text-balance text-ink-50 sm:text-5xl">
            {title}
          </h2>
          {description && (
            <p className="mt-5 text-lg text-pretty text-ink-400">
              {description}
            </p>
          )}
        </Reveal>

        <ol
          className={cn(
            "mt-14 grid gap-px overflow-hidden rounded-2xl border border-ink-800 bg-ink-800",
            COLUMNS[steps.length] ?? "md:grid-cols-3",
          )}>
          {steps.map((step, i) => (
            <li key={step.id} className="bg-ink-950 p-8">
              <Reveal delay={i * 100}>
                <span className="font-mono text-sm text-signal-400">
                  0{i + 1}
                </span>
                <h3 className="mt-4 font-display text-xl font-semibold text-ink-50">
                  {step.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-ink-400">
                  {step.description}
                </p>
              </Reveal>
            </li>
          ))}
        </ol>

        <Link
          to="/products/$slug"
          params={{ slug: "cms" }}
          preload="intent"
          className="mt-10 inline-flex items-center gap-2 text-sm font-semibold text-signal-400 hover:text-signal-300">
          See what Viewixsoft CMS supports
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      </div>
    </section>
  );
}
