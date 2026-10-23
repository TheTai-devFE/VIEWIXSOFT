# AGENTS.md — Rules for AI coding agents

These rules apply to every AI agent working in this repo (Claude Code, Cursor, Codex, Copilot…). They are **mandatory**. If a rule blocks you, stop and ask the human; do not work around it.

- **What to build:** [PROJECT_PROMPT.md](PROJECT_PROMPT.md) is the product brief and the source of truth.
- **How to build it:** this file.
- If the two conflict, ask.

## Role playbooks (read the matching one before starting a task)

Each role has a detailed playbook in `.claude/skills/`. Claude Code loads these automatically as skills. **Other agents (Cursor, Codex, Copilot…) must open and read the matching file** before working in that area. A task can touch several roles, for example a product page uses frontend + SEO + GEO + marketing.

| Role | File | Use for |
|---|---|---|
| Senior Frontend | [.claude/skills/senior-frontend/SKILL.md](.claude/skills/senior-frontend/SKILL.md) | routes, components, design system, forms UI, motion, a11y, performance |
| Senior Backend | [.claude/skills/senior-backend/SKILL.md](.claude/skills/senior-backend/SKILL.md) | server functions, DB/migrations, lead capture, email, auth, security |
| International SEO | [.claude/skills/seo-international/SKILL.md](.claude/skills/seo-international/SKILL.md) | meta, canonical/hreflang, JSON-LD, sitemap/robots, redirects, audits |
| GEO / AI readiness | [.claude/skills/geo-ai-readiness/SKILL.md](.claude/skills/geo-ai-readiness/SKILL.md) | llms.txt, Markdown twins, AI crawlers, answer-first structure, entity consistency |
| Marketing and Growth | [.claude/skills/marketing-growth/SKILL.md](.claude/skills/marketing-growth/SKILL.md) | positioning, copy, CTAs, CRO, content plan, analytics events |

**Any public page = SEO + GEO + Marketing checklists must all pass**, in addition to the FE/BE ones.

---

## 0. Golden rules

1. **Plan, then code.** Before any non-trivial change, write a short plan: the files to add or change, the approach and the risks. Then wait for approval.
2. **Work phase by phase.** Follow the phase order in PROJECT_PROMPT.md §9. Do not start the next phase until the current one meets the Definition of Done (§13).
3. **Never invent business facts.** Do not make up real product specs, prices, customer names, statistics, testimonials, company facts, addresses or legal text. Use clearly marked placeholders (`TODO(content): …`) and list them in your summary.
4. **Keep changes small and focused.** One concern per change. No drive-by refactors. No new dependency without stating why (see §11).
5. **Verify before you claim it's done.** Run `typecheck`, `lint`, `test` and `build`. Report real results, including any failures.
6. **Use English everywhere in the codebase:** UI copy, code, comments, commit messages, content.

---

## 1. Commands

Keep this table up to date once the project is scaffolded.

| Task | Command |
|---|---|
| Install | `pnpm install` |
| Dev server | `pnpm dev` |
| Type check | `pnpm typecheck` |
| Unit tests | `pnpm test` |
| Blog content check | `pnpm content:check` |
| Build (Cloudflare Workers; Vercel when `VERCEL=1`) | `pnpm build` |
| Preview / deploy Worker | `pnpm cf:preview` / `pnpm cf:deploy` |
| DB: generate migration | `pnpm db:generate` |
| DB: apply migrations | `pnpm db:migrate` |
| DB: studio | `pnpm db:studio` |
| Create admin | `pnpm admin:create <email>` |

Not set up yet: `pnpm lint` / `pnpm format` (ESLint, Prettier) and `pnpm test:e2e` (Playwright).

Use **pnpm only**. Never commit `package-lock.json` or `yarn.lock`.

---

## 2. Stack (do not substitute)

TanStack Start · TanStack Router · TanStack Query · TanStack Form · TanStack Table · React 19 · TypeScript strict · Tailwind CSS v4 · shadcn/ui (Radix) · Motion · Content Collections + MDX · Drizzle ORM + PostgreSQL · Zod · Resend + React Email · Cloudflare Turnstile · Upstash rate limit · Better Auth · Vitest · Playwright.

Do **not** add Next.js, Remix, React Router, Redux, Zustand (unless approved), Axios, Moment.js, Lodash (whole package), styled-components, CSS-in-JS runtimes or a second UI kit.

---

## 3. Project structure

```
src/
  routes/              # TanStack Router file routes only (thin: loader + head + compose blocks)
  components/ui/       # design-system primitives (shadcn-based); no business logic
  components/blocks/   # page sections (Hero, FeatureGrid, FAQ, CTA…)
  components/layout/   # Navbar, Footer, Breadcrumbs, Shell
  content/             # MDX: blog/, use-cases/, products/
  data/                # typed static data (products catalog, nav, site config)
  server/              # server-only: functions/, db/ (schema, client), email/, security/
  lib/                 # shared pure utils (cn, format, seo/ helpers)
  lib/seo/             # buildHead(), jsonLd builders, sitemap & llms generators
  styles/              # tokens.css, globals.css
tests/                 # e2e (Playwright)
```

- Files: `kebab-case.ts(x)`. Components: `PascalCase` named exports. Hooks: `use-*.ts` exporting `useX`.
- Import with the `~/` alias. No deep relative paths (`../../../`).
- **Never import `src/server/**` from client code.** Server-only modules must import `"server-only"` or use the framework's server-only boundary.

---

## 4. TypeScript and code style

- `strict: true`, `noUncheckedIndexedAccess: true`. Do not use `any`, `@ts-ignore` or non-null `!`. If one is truly unavoidable, use `@ts-expect-error` with a reason.
- Define each data shape **once** as a Zod schema and infer types from it (`z.infer`). Share schemas between client and server.
- Use pure functions where possible, return early, and avoid nested ternaries in JSX.
- Comments explain *why*, not *what*. Don't leave commented-out code.
- Do not use `console.log` in committed code. Use the logger in `src/server/logger.ts`.

---

## 5. TanStack rules

**Router**
- Every public route **must** define `head()` built with `buildHead()` from `~/lib/seo` (see §8). A route without `head()` is a bug.
- Load data in the route `loader` with `queryClient.ensureQueryData(...)`. Do not fetch inside `useEffect`.
- Validate search params with `validateSearch` and a Zod schema.
- Use `<Link>` from TanStack Router for internal navigation (`preload="intent"`). Use a plain `<a>` only for external links, with `rel="noopener noreferrer"` when `target="_blank"`.
- Every route that can fail has an `errorComponent` and `notFoundComponent`. Use the branded 404 and 500 pages.

**Query**
- Define query keys in a factory (`~/lib/query-keys.ts`). Do not inline arrays.
- Set `staleTime` deliberately. Marketing content is effectively static.

**Server functions**
- Use `createServerFn` with `.validator(zodSchema)` on **every** server function. Do not trust client input.
- Return typed result objects (`{ ok: true, data } | { ok: false, error }`). Do not throw raw errors to the client, and never leak stack traces or DB errors.

**Form**
- Every form uses TanStack Form with a Zod validator, an accessible label on each field, inline errors linked by `aria-describedby`, a disabled pending state and a success state.

---

## 6. Design system rules

- **Use tokens only.** Colors, spacing, radius, shadows, font sizes and motion come from `styles/tokens.css` and Tailwind theme variables. **No hard-coded hex, rgb or px values** in components (except 1px borders).
- Use existing `components/ui` primitives before building new ones. When you add a primitive, also add it to the `/design-system` page.
- Use `cn()` for class merging, and `cva` for variants.
- Build mobile-first. Test at 360, 768, 1280 and 1920px. Avoid horizontal scroll.
- Support light and dark themes on every component.
- Animation: use Motion and honor `prefers-reduced-motion`. Animate only `transform` and `opacity`. Never block content behind an animation.
- Adapt the MotionSites template (chosen in phase 1) into tokens and components. Do not paste the template's markup wholesale.

---

## 7. Accessibility (WCAG 2.2 AA — non-negotiable)

- Use semantic HTML (`header`, `nav`, `main`, `footer`, `article`, `section` with headings) and exactly one `<h1>` per page, with no skipped heading levels.
- Everything must work by keyboard, with a visible focus ring. Include a skip link to `#main`.
- Use buttons for actions and links for navigation. Do not add click handlers to a `div`.
- Every image has a meaningful `alt` (or `alt=""` when it is decorative). Icon-only buttons have an `aria-label`.
- Text contrast is at least 4.5:1, or 3:1 for large text and UI elements.
- Playwright e2e runs `@axe-core/playwright` on key pages, and **zero serious or critical violations** are allowed.

---

## 8. SEO rules (every public page)

- `head()` includes:
  - a unique `title` of 60 characters or fewer, in the pattern `Page — Viewixsoft`;
  - a `description` of 155 characters or fewer;
  - `canonical` (absolute URL from `SITE_URL`, no query string);
  - Open Graph tags and a Twitter card, with an auto-generated OG image;
  - `hreflang` `en` plus `x-default`.
- JSON-LD comes from the builders in `~/lib/seo/jsonld.ts`. Never hand-write JSON-LD in a route.
  - Every page: `Organization`, `WebSite`, `BreadcrumbList` (inner pages).
  - Products: `SoftwareApplication`. Blog: `BlogPosting` with `Person` author. Pages with FAQs: `FAQPage`.
- All indexable content must be in the SSR HTML. No content that only appears after client-side rendering.
- URLs are lowercase and hyphenated with no trailing slash. When you rename a slug, add a 301 redirect in `src/data/redirects.ts`.
- Pages marked `noindex` (`/admin/**`, `/design-system`, form thank-you states) are excluded from the sitemap.
- After adding a route or content type, update the `sitemap.xml` generator.

---

## 9. GEO and content rules

- **Product naming:** always use **Viewixsoft CMS**, **Viewixsoft POS**, **Viewixsoft Tracking** or **Viewixsoft NFC**. Never "Viewix", "VX CMS" or lowercase variants. The brand is written **Viewixsoft** (one word, capital V).
- **Answer-first:** every page and every H2 section opens with a direct 1–2 sentence answer that can be quoted on its own, then gives the details.
- Prefer question-style H2s that match real search queries, concrete numbers, comparison tables and numbered steps.
- Every statistic has a source and a date. If there is no source, don't include the statistic.
- MDX frontmatter is validated by Zod. Required fields: `title`, `description`, `slug`, `publishedAt`, `updatedAt`, `author`, `tags`, `ogImage?`, `faq?`. A build must fail on invalid frontmatter.
- `llms.txt`, `llms-full.txt` and the `.md` page variants are **generated** from the content source. Never edit them by hand.
- Use US English, plain language, active voice and short sentences. Avoid hype words ("revolutionary", "best-in-class") unless a fact backs them up.

---

## 10. Backend, data and security

- **Database:** Drizzle schema in `src/server/db/schema.ts`. Create migrations with `pnpm db:generate`. **Never edit a migration that has already been applied**; create a new one. Don't use raw SQL string interpolation.
- **Lead capture:** every lead submission must:
  1. validate the Zod schema on the server;
  2. verify Turnstile;
  3. reject requests where the honeypot field is filled;
  4. apply the rate limit (by IP hash and by email);
  5. insert the lead;
  6. send emails.

  If email sending fails, the lead is still saved and the error is logged.
- **PII:** store a hashed IP only, never raw. Never log emails, phone numbers or message bodies. Consent is a required, timestamped field.
- **Secrets:** read only from env through a Zod-validated `src/server/env.ts`. Keep `.env.example` up to date. **Never commit `.env*`** (except `.env.example`) and never expose server secrets to the client. Only `VITE_PUBLIC_*` variables may reach the browser.
- **Security headers:** CSP, HSTS, X-Content-Type-Options, Referrer-Policy and Permissions-Policy are set centrally. Don't loosen the CSP without approval.
- **Admin:** every `/admin/**` route and every admin server function checks the Better Auth session on the server.

---

## 11. Performance and dependencies

- **Budgets:**
  - LCP < 2.5s, INP < 200ms, CLS < 0.1 (mobile, p75).
  - Lighthouse ≥ 95 in every category on Home, Product, Use case, Blog post and Contact.
  - Initial JS for marketing pages ≤ 150 KB gzipped.
- **Images:** AVIF/WebP with explicit `width` and `height`. Preload the hero image, lazy-load everything below the fold. No unoptimized images over 200 KB.
- **Fonts:** self-hosted and subset, `font-display: swap`, with at most 2 families.
- **Dependencies:** before you add one, state its purpose, bundle size and an alternative you considered. Prefer platform APIs.

---

## 12. Testing and git

- **Unit tests (Vitest):** Zod schemas, server functions (happy path and each rejection path), SEO builders, sitemap and llms generators.
- **E2E tests (Playwright):**
  - contact form success and validation errors;
  - newsletter;
  - key pages render with the correct `<title>`, canonical and JSON-LD;
  - the axe check;
  - the admin route redirects when logged out.
- **Bug fixes:** write the failing test first.
- **Commits:** Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`). Use feature branches and don't commit directly to `main`.
- Never commit generated build output, `.env` files or secrets.

---

## 13. Definition of Done (every task)

- [ ] `pnpm typecheck`, `pnpm lint`, `pnpm test` and `pnpm build` all pass.
- [ ] New or changed routes have `head()`, the correct JSON-LD, and are in the sitemap (or marked noindex).
- [ ] The UI uses tokens only, works in light and dark themes, is responsive from 360px to 1920px, works by keyboard and passes axe.
- [ ] No hard-coded secrets, no PII in logs, and server input is validated.
- [ ] Content follows §9: product naming, answer-first, sourced stats.
- [ ] Docs are updated: README, `.env.example` and the §1 commands table if anything changed.
- [ ] The summary to the human lists what changed, how it was verified, any `TODO(content)` placeholders and any open questions.

---

## 14. Always ask the human before

- choosing or changing the MotionSites template, brand colors or fonts;
- adding a dependency, service or paid API;
- changing the DB schema of an existing table, or deleting data;
- changing URL structure, redirects or the robots/AI-crawler policy;
- publishing real business facts, prices, legal text or customer names;
- deploying or touching production env variables.
