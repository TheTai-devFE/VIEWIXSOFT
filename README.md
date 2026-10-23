# Viewixsoft — Enterprise Digital Signage Platform

> Production-ready, international B2B marketing website and lead capture engine for digital signage software, retail displays, and DOOH advertising networks.

[![Framework](https://img.shields.io/badge/TanStack-Start-blue.svg)](https://tanstack.com/start)
[![React](https://img.shields.io/badge/React-19-cyan.svg)](https://react.dev)
[![Tailwind](https://img.shields.io/badge/Tailwind_CSS-v4-teal.svg)](https://tailwindcss.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue.svg)](https://www.typescriptlang.org)
[![SEO & GEO](https://img.shields.io/badge/GEO-Optimized-emerald.svg)](#generative-engine-optimization-geo)

---

## 1. Product Suite

Every product name strictly follows the full brand standard: **Viewixsoft** + product name.

1. **Viewixsoft CMS** (`/products/cms`): Enterprise cloud content management for advertising screens. Multi-zone layouts, dayparting, zero-downtime offline caching, and global mass deployment in < 3 seconds.
2. **Viewixsoft POS** (`/products/pos`): Real-time synchronization between in-store/drive-thru digital menu boards and POS terminals (sub-250ms latency, automatic item 86-ing).
3. **Viewixsoft Tracking** (`/products/tracking`): Cryptographic SHA-256 proof-of-play audit logs, screen temperature/power telemetry, and GDPR-compliant edge AI computer vision.
4. **Viewixsoft NFC** (`/products/nfc`): Smartphone tap-to-engage touchpoints for billboards, transit stops, and kiosks without requiring mobile app downloads.

---

## 2. Technology Architecture

| Layer | Choice | Notes |
|---|---|---|
| **Framework** | TanStack Start (React 19, Vite 8, Nitro) | Full SSR; production builds target Cloudflare Workers (`cloudflare_module`) |
| **Routing** | TanStack Router (file-based) | Per-route `head()`, typed loaders and search params |
| **Styling** | Tailwind CSS v4 + design tokens | Light and dark themes, WCAG 2.2 AA |
| **Forms** | TanStack Form + Zod 4 | One schema shared by the form and the server function |
| **Database** | Neon Postgres + Drizzle ORM (HTTP driver) | Leads, newsletter, admin auth, site settings |
| **Auth** | Better Auth (email + password) | Protects `/admin/**` and every admin server function |
| **Email** | Resend HTTP API | Sales notification, visitor confirmation, newsletter double opt-in |
| **Images & videos** | Cloudflare R2 (S3 API) | Admin-uploaded media library; videos upload straight from the browser |
| **Anti-spam** | Turnstile + honeypot + rate limit | Rate limit counted in Postgres; only hashed IPs are stored |
| **Blog** | MDX compiled at build time | `src/content/blog/*.mdx`, frontmatter validated by Zod |
| **Testing** | Vitest | Schemas, lead pipeline, SEO builders, content |

---

## 3. Getting Started

### Prerequisites
- **Node.js** 22+ (24 recommended) and **pnpm** 11+
- A **Neon** project (use a separate branch for development)

### Install and run
```bash
pnpm install
cp .env.example .env      # fill DATABASE_URL at least; everything else is optional in dev
pnpm db:migrate           # create the tables in Neon
pnpm admin:create you@company.com   # create your admin login (prompts for a password)
pnpm dev                  # http://localhost:3000, admin at /admin
```
Without `DATABASE_URL` the marketing site still runs with default settings; forms and admin need the database.

### Commands

| Task | Command |
|---|---|
| Dev server | `pnpm dev` |
| Type check | `pnpm typecheck` |
| Unit tests | `pnpm test` |
| Check blog content | `pnpm content:check` |
| Build (Cloudflare Workers) | `pnpm build` |
| Preview the Worker locally | `pnpm cf:preview` (reads `.dev.vars`) |
| Deploy | `pnpm cf:deploy` |
| DB: new migration after editing the schema | `pnpm db:generate` |
| DB: apply migrations | `pnpm db:migrate` |
| DB: browse data | `pnpm db:studio` |
| Create or reset an admin | `pnpm admin:create <email>` |

Deployment steps: [docs/deploy-cloudflare.md](docs/deploy-cloudflare.md).

---

## 4. Admin and content

### Admin (`/admin`)
A sidebar app with a light/dark theme (stored per browser; the public site stays light).
- **Dashboard**: new leads, leads in the last 30 days, subscriber counts, leads by status, latest leads, and which services are configured.
- **Leads**: search, filter, update status and notes, export CSV.
- **Subscribers**: newsletter and launch sign-ups; filter by status and topic, export CSV, unsubscribe, delete on request.
- **Pages & sections**: show, hide and reorder sections on Home, About, use case pages and the Viewixsoft CMS page.
- **Products**: set each product to available, coming soon or hidden.
- **Home stats**: real figures, each with a source and a date.
- **Customer quotes**: shown only when approved with a written-consent date.
- **Images & videos**: upload to the media library, then pick them per page (hardware photos, use case covers, screen photos, the Viewixsoft CMS product tour video).

Videos (MP4 or WebM, up to 200 MB) go from the browser straight to the R2 bucket on a signed URL, so the bucket needs a CORS rule. In Cloudflare: **R2 → your bucket → Settings → CORS policy**, add:

```json
[
  {
    "AllowedOrigins": ["http://localhost:3000", "https://viewixsoft.com"],
    "AllowedMethods": ["PUT"],
    "AllowedHeaders": ["content-type", "cache-control"],
    "MaxAgeSeconds": 3600
  }
]
```

Add each preview or staging domain you upload from to `AllowedOrigins`.

Sections that depend on real data (stats, quotes, use case results) stay hidden on the live site until that data exists. Sample content renders only in the dev server.

### Products and use cases
Edit [src/content/products.ts](src/content/products.ts) and [src/content/useCases.ts](src/content/useCases.ts). Every product and use case needs a `seoTitle` (at most 47 characters, so "Title — Viewixsoft" fits in 60) and an `updatedAt` date; `pnpm test` fails on long or duplicate titles. Use case `evidence: 'sample'` keeps results and quotes out of production until you set `'verified'`.

### Blog posts
One MDX file per post in `src/content/blog/`. Follow [docs/blog-writing-guide.md](docs/blog-writing-guide.md) and start from [docs/blog-template.mdx](docs/blog-template.mdx).

---

## 5. Generative Engine Optimization (GEO) & SEO Standards

These files are **generated** at request time from `src/content/*` and [src/lib/seo/site-pages.ts](src/lib/seo/site-pages.ts) by the builders in [src/lib/seo/generators.ts](src/lib/seo/generators.ts). Never add them to `public/`, which would shadow the routes.

- **`/sitemap.xml`**: Every indexable page with `<lastmod>`. Add new static pages to `STATIC_PAGES`.
- **`/robots.txt`**: Allows the AI crawlers in `AI_CRAWLERS` (switch with `AI_CRAWLER_POLICY`) and keeps `/admin` blocked for every agent.
- **`/rss.xml`**: All blog posts, newest first.
- **`/llms.txt`** and **`/llms-full.txt`**: Summary and full text for LLMs, following the llms.txt proposal.
- **Markdown twins**: `/products/$slug.md`, `/use-cases/$slug.md` and `/blog/$slug.md`, advertised on each page with `<link rel="alternate" type="text/markdown">`.
- **JSON-LD**: Dynamic schemas for `Organization`, `WebSite`, `SoftwareApplication`, `Article`, `BreadcrumbList`, and `FAQPage`.
- **Design System Showcase**: Inspect design tokens and primitives at `/design-system` (`noindex`).
- **Admin Lead Portal**: Manage qualified leads and export CSVs at `/admin/leads`.

---

## 6. License & Compliance
Built by Viewixsoft Inc. All rights reserved. Complies with GDPR, CCPA, and WCAG 2.2 AA accessibility standards.
