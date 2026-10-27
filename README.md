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
| **Auth** | Better Auth (email + password, admin plugin for roles) | Protects `/admin/**` and every admin server function, per module |
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
| Build (Cloudflare Workers; Vercel when `VERCEL=1`) | `pnpm build` |
| Preview the Worker locally | `pnpm cf:preview` (reads `.dev.vars`) |
| Deploy to Cloudflare | `pnpm cf:deploy` |
| Deploy to Vercel | push to GitHub (see below) |
| DB: new migration after editing the schema | `pnpm db:generate` |
| DB: apply migrations | `pnpm db:migrate` |
| DB: browse data | `pnpm db:studio` |
| Create or reset an admin (other accounts: `/admin/users`) | `pnpm admin:create <email>` |

Deployment steps: [docs/deploy-vercel.md](docs/deploy-vercel.md) (current) or [docs/deploy-cloudflare.md](docs/deploy-cloudflare.md).

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
- **Users & access** (`/admin/users`, admins only): create accounts with a temporary password, lock, unlock, reset passwords, sign out everywhere, delete. Each account is an **admin** (everything, including accounts) or a **member** who can open only the modules ticked for them; the "Marketing" preset ticks Blog posts, Case studies, Authors and Images & videos. The list of modules lives in [src/lib/permissions.ts](src/lib/permissions.ts) and drives the sidebar, the route guard and every admin server function. Members who edit blog posts, case studies, authors or pages can pick and upload images in their editor without the Images & videos module.
- **My account** (`/admin/account`): every account can change its own password.
- **Ownership**: every blog post and case study records who created it and who saved it last. Members change, publish and delete only what they created; the **Sửa bài của người khác** (`edit-others`) permission or the admin role lifts that. The lists filter by "Bài của tôi", and someone else's post opens read-only. The server functions enforce this, not just the UI.
- **Authors ↔ accounts**: in `/admin/authors` an author profile can be linked to one admin account; that account's new blog posts start with that byline.
- **Activity log** (`/admin/activity`, `activity` permission): who created, edited, published, deleted, changed access or signed in, with filters by person, module, date and text. Entries are kept 90 days (cleared when the page is opened). No passwords, and only ids for leads and subscribers, never their contact details.

`pnpm admin:create <email>` always makes the account an unlocked admin, so it also gets you back in if every admin is locked out. The app never lets anyone demote, lock or delete their own account or the last working admin.

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

Blog posts are written in `/admin/blog`, with a live SEO & GEO checklist in the editor. Bylines come from `/admin/authors`: a real person with a role, a short bio, a photo and a LinkedIn link is published as a `Person` in JSON-LD (E-E-A-T). Posts and case studies from the admin are included in `sitemap.xml`, `rss.xml`, `llms.txt`, `llms-full.txt` and the `.md` twins alongside the bundled files (see `src/server/content/published.ts`).

Case studies are edited in `/admin/use-cases`, laid out like a blog post: title, slug, summary and thumbnail, then the content as blocks (a heading, Markdown text and an optional image). A new page starts with two blocks; add more for longer stories. Blocks with an image alternate sides on the page. Highlights, products and FAQ are optional. Each page is either an **Industry guide** (no customer quotes or figures are ever shown, not even in the page source) or a **Customer story** (only with written customer approval; every result needs a period and a source, or saving fails). Block shapes live in [src/lib/case-study.ts](src/lib/case-study.ts).

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
