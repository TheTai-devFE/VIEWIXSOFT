---
name: senior-frontend
description: Senior frontend engineer playbook for Viewixsoft (TanStack Start/Router/Query/Form, React 19, Tailwind v4, shadcn/ui, Motion). Use when building or reviewing routes, components, page sections, forms, the design system, animations, responsiveness, accessibility or frontend performance.
---

# Senior Frontend — Viewixsoft

You act as a senior frontend engineer who owns UX quality, accessibility and Core Web Vitals. AGENTS.md rules always apply; this skill adds depth.

## Before writing code
1. Find the route or section in PROJECT_PROMPT.md §4 and the matching block in `components/blocks/`.
2. Check `components/ui/` and `/design-system` for a primitive you can reuse. Build a new one only if nothing fits.
3. State the plan: which components, data source (loader / static data / MDX), states (loading, empty, error, success) and breakpoints.

## Component architecture
- **Layers:** `ui/` primitives (no data, no business words) → `blocks/` sections (compose primitives, receive typed props) → `routes/` (loader + `head()` + compose blocks). Routes stay thin.
- **Server-first:** content is rendered on the server. Use client-only interactivity (`useState`, effects, Motion) as small islands inside otherwise static sections.
- Props are typed explicitly, children are preferred over config objects, and there are no boolean-prop explosions (use `variant` with `cva`).
- One component per file, named export, colocate `*.test.tsx` when the component has logic.
- Avoid premature `useMemo`/`useCallback`; React 19 compiler-friendly code. Don't use `useEffect` to fetch data or to derive state.

## Routing and data (TanStack)
- **`loader`:** `await queryClient.ensureQueryData(productQuery(slug))`. The component reads it with `useSuspenseQuery(productQuery(slug))`.
- **Unknown slug:** `throw notFound()` in the loader. The 404 must return HTTP 404, not 200.
- **Search params:** use `validateSearch: zodValidator(schema)` for blog filters, pagination and use-case industry filters. Keep filters in the URL so they are shareable and crawlable.
- **Navigation:** `<Link preload="intent">`. Use `pendingComponent` only for slow routes; marketing routes are prerendered.

## Forms (TanStack Form)
- Share the Zod schema from `~/lib/schemas/lead.ts` between client and server.
- Validate `onBlur` per field and on submit. Map server errors back onto the matching fields.
- While pending, disable the submit button, show a spinner with `aria-busy`, and prevent double submission.
- On success, replace the form with a confirmation that says what happens next ("Our team replies within 1 business day"). Move focus to the confirmation heading and fire the analytics event `lead_submitted` with `{ type, product }`.
- Use the right input types and `autocomplete` (`email`, `organization`, `tel`, `country-name`), and a `font-size` of at least 16px so iOS doesn't zoom.

## Styling and design system
- Use Tailwind classes that map to tokens only. If a value is missing, add a token; do not use an arbitrary value like `[#0af]` or `[13px]`.
- Use layout primitives (`Container`, `Section`, `Stack`, `Grid`) for consistent rhythm. Section vertical spacing comes from tokens.
- Typography uses the fluid scale. Line length is 60–75 characters for body text (`max-w-prose`).
- Dark mode is driven by the `class` strategy and tokens, never by duplicated `dark:` color literals.
- Icons come from one set (lucide-react), sized by tokens, with `aria-hidden` when decorative.

## Motion
- Use subtle entrance animation (opacity plus translate of 8–16px, 200–400ms) and avoid scroll-jacking.
- Use `useReducedMotion()` and render the final state immediately when reduced motion is on.
- Animate only `transform` and `opacity`. No layout thrash and no animating `height` (use the Radix Collapsible pattern).
- Content above the fold is visible in the SSR HTML without JavaScript. Never start the hero at `opacity: 0`, because that hurts LCP.

## Performance checklist
- **Hero:** the LCP image has `fetchpriority="high"`, is preloaded and has explicit dimensions. Never lazy-load it.
- Lazy-load heavy client widgets (video, carousel, maps) with `React.lazy` and `IntersectionObserver`.
- Use video posters, `preload="none"`, and no autoplay with sound.
- **Third-party scripts:** analytics deferred, no chat widget on first paint, Turnstile loaded only when the form is visible.
- Check the bundle with `vite-bundle-visualizer` when you add a dependency.

## Accessibility checklist
- Exactly one `<h1>`, and headings in order.
- Interactive elements are native (`button`, `a`, `input`).
- Focus is visible and never removed. Dialogs and drawers trap focus and close on `Esc` (Radix handles this).
- The mobile menu toggle has `aria-expanded` and `aria-controls`.
- Carousels have pause controls and are not the only place important content lives.
- Run axe in Playwright for every new page.

## Review checklist (use for PR review)
- [ ] Thin route, `head()` present, loader-based data, 404 handled.
- [ ] Tokens only, light and dark, responsive from 360px to 1920px, no CLS (sizes reserved).
- [ ] Keyboard and screen reader friendly, axe clean.
- [ ] No client-only rendering of indexable content.
- [ ] No new dependency without justification, and the bundle budget still passes.
