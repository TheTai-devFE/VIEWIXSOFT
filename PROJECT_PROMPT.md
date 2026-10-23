# Viewixsoft — Project Build Prompt

You are a senior full-stack engineer and product designer. Build **Viewixsoft**, a production-ready marketing website for a software company that makes **digital signage software** — products that run content on advertising screens (indoor/outdoor billboards, retail displays, menu boards, lobby screens, kiosks, video walls).

The site must be **English-only, aimed at a global B2B audience**. It must meet international SEO standards and be optimized for **GEO (Generative Engine Optimization)**, so that AI assistants (ChatGPT, Claude, Perplexity, Gemini, Google AI Overviews) can understand, cite and recommend Viewixsoft. It has a frontend and a backend that capture and store leads from users.

---

## 1. Goals

1. Explain clearly what each Viewixsoft product does, who it is for and why it beats the alternatives.
2. Turn visitors into qualified leads: demo requests, contact/sales enquiries and newsletter sign-ups.
3. Rank in international search and get cited by AI answer engines for queries like "digital signage software", "cloud CMS for advertising screens" and "how to manage content on multiple screens".
4. Look premium and trustworthy, on par with top-tier SaaS sites. Load fast on all devices.

---

## 2. Tech stack (TanStack ecosystem)

| Layer | Choice | Why |
|---|---|---|
| Framework | **TanStack Start** (React 19, Vite, full-document SSR + streaming, static prerender for marketing pages) | SSR/SSG is required for SEO; server functions remove the need for a separate API service |
| Routing | **TanStack Router** (file-based, type-safe, `head()` per route, `loader` for data) | Per-route meta tags, typed search params, preloading |
| Server state | **TanStack Query** (integrated with Router loaders via SSR dehydration) | Caching, prefetch on hover |
| Forms | **TanStack Form** + **Zod** schemas shared between client and server | One validation source of truth |
| Tables (admin) | **TanStack Table** | Lead list with sort, filter and pagination |
| Language | **TypeScript** (strict) | |
| Styling | **Tailwind CSS v4** + **shadcn/ui** (Radix primitives) + CSS-variable design tokens | Accessible primitives, themeable |
| Motion | **Motion** (formerly Framer Motion), respecting `prefers-reduced-motion` | |
| Content (blog, use cases) | **MDX** via **Content Collections** (typed frontmatter validated with Zod) | Git-based, fast, no CMS cost; can switch to a headless CMS (Sanity/Payload) later |
| Backend | TanStack Start **server functions** (`createServerFn`) + **server routes** (for `sitemap.xml`, `robots.txt`, `rss.xml`, `llms.txt`, webhooks) | |
| Database | **PostgreSQL** (Neon or Supabase) + **Drizzle ORM** + drizzle-kit migrations | Type-safe and lightweight |
| Email | **Resend** + **React Email** templates (notify sales and auto-reply to the user) | |
| Anti-spam | **Cloudflare Turnstile** + honeypot field + IP rate limiting (Upstash Redis) | |
| Admin auth | **Better Auth** (email/password or Google) protecting `/admin` | |
| Analytics | Plausible or PostHog (cookieless by default; GDPR/CCPA-friendly consent banner if cookies are used) | |
| Images | `@unpic/react` + AVIF/WebP, explicit width/height, lazy below the fold | |
| Quality | ESLint, Prettier, Vitest, Playwright e2e, Lighthouse CI | |
| Deploy | Vercel, Netlify or Cloudflare (Nitro preset), with preview deploys per PR | |
| Package manager | pnpm | |

---

## 3. Design system

### Template source (MotionSites MCP)
Use the **`motionsites` MCP server** to browse the available templates. Pick the one that best fits a **modern, dark-first, tech/B2B SaaS** look: a bold hero, product showcase sections, a bento-style feature grid and smooth scroll animation. Use it as the visual base. Before writing code, report which template you chose and why. Then **extract its design into tokens**; do not copy its markup unchanged.

### Tokens (CSS variables, light + dark themes)
- **Color:** neutral scale (50–950), one brand primary (an electric blue/cyan fits "screens and light"), one accent, semantic success/warning/danger/info. All text pairs must meet WCAG AA contrast.
- **Typography:** a display font for headings (e.g. Geist, Inter Display or Satoshi) and a readable sans for body text, using a fluid type scale with `clamp()`. Self-host the fonts and set `font-display: swap`.
- **Spacing:** 4px base scale. **Radius:** sm/md/lg/xl/full. **Shadow/elevation:** 4 levels. **Motion:** duration and easing tokens.
- **Layout:** 12-column grid, full-width content with a fluid side gutter (`page-x`, `--spacing-page-gutter`: 16px on phones up to 96px on wide screens), breakpoints sm/md/lg/xl/2xl, mobile-first. Running text keeps its own max width (about 65–75 characters per line).

### Components (build these as documented, reusable components)
Button (variants and sizes), Link, Badge, Card, ProductCard, UseCaseCard, BlogCard, Navbar with mega-menu for Products, mobile drawer, Footer, Section header, Hero, Feature grid/bento, Logo cloud, Stats strip, Testimonial, Pricing teaser, FAQ accordion, CTA band, Breadcrumbs, Tabs, Form fields (Input, Textarea, Select, Checkbox) with error states, Toast, Table of contents, Author box, Pagination, Skeletons and an Empty state.

Add a `/design-system` route (not indexed: `noindex`) that shows all tokens and components.

### Accessibility
WCAG 2.2 AA: semantic landmarks, keyboard navigation, visible focus rings, skip link, alt text on images, labelled form controls, ARIA only where needed, and reduced-motion support.

---

## 4. Information architecture and pages

```
/                         Home
/products                 All products
/products/$slug           Product detail: /products/cms, /products/pos, /products/tracking, /products/nfc
/use-cases                Use cases index (filter by industry)
/use-cases/$slug          Use case detail (Retail, QSR menu boards, Corporate comms, Transportation, Hospitality, Healthcare, DOOH advertising)
/blog                     Blog index (categories, tags, pagination, search)
/blog/$slug               Blog post
/blog/category/$slug      Category archive
/about                    Company, mission, team, offices
/contact                  Contact / request a demo form
/pricing                  (optional) Pricing teaser → contact sales
/legal/privacy, /legal/terms, /legal/cookies
/admin, /admin/leads      Protected lead dashboard
404 and 500 pages         Branded, with links back to key pages
```

### Product line
Every product name follows the brand logo: **Viewixsoft** + the product name. Always write the full name in titles, headings, meta tags and JSON-LD (`SoftwareApplication.name`). Never shorten it to "Viewix".

| Product | Slug | Working positioning (confirm details with me) |
|---|---|---|
| **Viewixsoft CMS** | `cms` | Cloud content management for advertising screens: upload media, build playlists and layouts, schedule by time and location, and manage screens remotely. |
| **Viewixsoft POS** | `pos` | Point-of-sale software linked to in-store screens: sales, orders, and dynamic menu boards and promotions that stay in sync with the catalog and prices. |
| **Viewixsoft Tracking** | `tracking` | Screen monitoring and analytics: device uptime and health, proof-of-play reports, and audience and campaign performance dashboards. |
| **Viewixsoft NFC** | `nfc` | NFC tap-to-interact for screens and kiosks: customers tap a phone to open offers or product pages, check in or collect loyalty points, and every tap is measured. |

Keep the product catalog in one typed data file (or MDX collection) so products can be added or edited without code changes. Cross-link products that work together, such as CMS + Tracking and POS + NFC, and show these bundles on the home page and in use cases.

### Page content guidelines
- **Home:** hero with a clear value proposition, a sentence of 25 words or fewer saying what Viewixsoft is, primary CTA "Book a demo" and secondary CTA "Explore products". Then: logo cloud, product overview, how it works (3 steps), use cases by industry, key stats, testimonials, FAQ and a final CTA.
- **Product detail:** a summary of what the product is (2–3 sentences), key features, supported hardware/OS (Android, Windows, Linux, Tizen, webOS, BrightSign…), integrations, a specs table, screenshots/video, FAQ, related use cases and a CTA.
- **Use case detail:** challenge, solution, results (with numbers), the products used, a quote and a CTA.
- **Blog post:** title, description, author with bio, published and updated dates, reading time, table of contents, key takeaways box at the top, body, FAQ (optional), related posts and a newsletter CTA.
- **Contact:** the form, sales email, office addresses, response-time promise and a short FAQ.

---

## 5. Backend: lead capture

### Forms
1. **Contact / Demo request:** full name*, work email*, company*, job title, country* (ISO list), phone (E.164), company size, number of screens (range), products of interest (multi-select), message*, consent checkbox* (privacy policy), Turnstile token, hidden honeypot field, plus UTM params and the referrer captured automatically.
2. **Newsletter:** email* and consent*.

### Flow
`TanStack Form` (client validation with Zod) → `createServerFn` (re-validate with the same Zod schema, verify Turnstile, check the honeypot, rate-limit by IP and email) → insert into Postgres via Drizzle → send a Resend email to the sales inbox and a confirmation email to the user → return a typed result → show a success state. Optionally fire a webhook to a CRM (HubSpot, Pipedrive or Slack).

### Data model (Drizzle)
- `leads`: id (uuid), type (`contact` | `demo` | `newsletter`), name, email, company, job_title, country, phone, company_size, screen_count, products (text[]), message, consent (bool), consent_at, utm_source/medium/campaign/term/content, referrer, landing_page, ip_hash, user_agent, status (`new` | `contacted` | `qualified` | `won` | `lost` | `spam`), notes, created_at, updated_at.
- `newsletter_subscribers`: id, email (unique), status, confirmed_at (double opt-in), created_at.
- Auth tables from Better Auth.

### Admin
`/admin/leads` is protected by auth. It uses a TanStack Table with search, filter by status, type, country and date, sorting, pagination and CSV export. It also has a detail drawer where an admin can update the status and add notes.

### Security and compliance
Server-side validation on every input, a hashed IP (no raw IP stored), CSRF protection on server functions, strict security headers (CSP, HSTS, X-Content-Type-Options, Referrer-Policy, Permissions-Policy), and secrets kept only in environment variables with an `.env.example` file. Follow GDPR/CCPA: record explicit consent, link to the privacy policy, and support a data deletion request flow.

---

## 6. International SEO requirements

- **Rendering:** SSR or prerender every public page. Content must exist in the initial HTML; no content that appears only after client-side rendering.
- **Per-route `head()`:** unique `<title>` (≤ 60 characters), meta description (≤ 155 characters), canonical URL, `robots`, Open Graph (title, description, image 1200×630, type, url, site_name, locale `en_US`) and Twitter card `summary_large_image`.
- **International:** `<html lang="en">`, `hreflang="en"` plus `hreflang="x-default"` from the start. Keep the URL and route structure i18n-ready (e.g. Paraglide JS) so `/de`, `/ja` and others can be added later without breaking URLs.
- **Structured data (JSON-LD):** `Organization` (logo, sameAs, contactPoint), `WebSite` (with SearchAction), `SoftwareApplication` / `Product` on product pages, `Article`/`BlogPosting` with `author` (`Person`) on posts, `BreadcrumbList` on every inner page, `FAQPage` where there is an FAQ, and `CaseStudy`-style `Article` on use cases. Validate with the Rich Results Test.
- **Server routes:** `sitemap.xml` (generated from routes and content, with `lastmod`), `robots.txt`, `rss.xml` for the blog.
- **URLs:** lowercase, hyphenated, no trailing-slash inconsistency, and 301 redirects for changed slugs.
- **Content:** one H1 per page, logical H2/H3 hierarchy, descriptive internal links, breadcrumbs and image alt text.
- **Performance (Core Web Vitals, measured at p75 on mobile):** LCP < 2.5s, INP < 200ms, CLS < 0.1. Preload the hero image and fonts, split code per route, keep JS for marketing pages small and serve via CDN cache headers. Target Lighthouse ≥ 95 on Performance, Accessibility, Best Practices and SEO.
- Auto-generate OG images per page (e.g. `@vercel/og` / Satori server route).

---

## 7. GEO (Generative Engine Optimization) requirements

- **`/llms.txt`** and **`/llms-full.txt`**: a concise Markdown summary of the company, its products, use cases and key pages (following the llms.txt proposal), generated from the same content source.
- **A Markdown version of every content page** (e.g. `/blog/$slug.md`, `/products/$slug.md`) so LLMs can read clean text.
- **`robots.txt`** explicitly allows reputable AI crawlers (GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, Claude-User, PerplexityBot, Google-Extended, Applebot-Extended), with a config flag to change this policy.
- **Answer-first writing:** each page and section starts with a direct, quotable 1–2 sentence answer, followed by details. Use question-style H2s that match real queries ("What is digital signage software?", "How much does it cost to run 100 screens?").
- **Quotable facts:** concrete numbers, definitions, comparison tables, step-by-step lists and dated statistics with cited sources.
- **E-E-A-T and entity clarity:** consistent company name, description and `sameAs` links (LinkedIn, GitHub, Crunchbase, G2/Capterra) everywhere. Show real author bios with credentials, "last updated" dates on content and a clear About page with company facts (founded, HQ, team size, customers).
- **FAQ blocks** with `FAQPage` schema on product, use-case and key blog pages.
- **Glossary** (optional `/glossary`): define terms such as DOOH, CMS, POS, NFC, SoC, playlist scheduling and proof-of-play. These pages are frequently cited by AI.

---

## 8. Project structure (suggested)

```
src/
  routes/            # TanStack Router file routes (+ api/server routes)
  components/ui/     # design system primitives (shadcn-based)
  components/blocks/ # page sections (Hero, FeatureGrid, CTA, FAQ…)
  content/           # MDX: blog/, use-cases/, products/
  server/            # server functions, db (drizzle schema, client), email, rate-limit
  lib/seo/           # head builders, JSON-LD helpers, sitemap/llms generators
  styles/            # tokens.css, globals.css
```

---

## 9. Deliverables and definition of done

1. A running TanStack Start app with all routes above, seeded with realistic English sample content: the 4 products (Viewixsoft CMS, POS, Tracking, NFC), 6 use cases and 6 blog posts.
2. A working contact/demo form and newsletter form that save to Postgres, send both emails and appear in `/admin/leads`.
3. The design-system page, light and dark themes, and a responsive layout from 360px to 1920px.
4. SEO and GEO checks pass: valid JSON-LD, sitemap, robots, llms.txt, canonical tags, OG images and Lighthouse ≥ 95.
5. Tests: unit tests for schemas and server functions, and Playwright e2e tests for form submission and key page rendering.
6. A `README.md` covering setup, environment variables, DB migrations, content authoring (how to add a product, use case or post) and deployment.

### Working method
Work in phases and confirm each one before moving on: **(1)** choose the template via MotionSites MCP and define the tokens → **(2)** scaffold, layout and design system → **(3)** pages and content → **(4)** backend and forms → **(5)** SEO/GEO → **(6)** tests, performance and deploy. Ask me before making assumptions about real product names, pricing, company facts or brand colors.
