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

| Layer | Choice | Rationale |
|---|---|---|
| **Framework** | TanStack Start (React 19, Vite 8, Nitro) | Full-document SSR and static asset generation for international search engines |
| **Routing** | TanStack Router (File-based) | Type-safe loaders, per-route `head()` meta tags, preloading |
| **Styling** | Tailwind CSS v4 + Design Tokens | Dark-first aesthetic, CSS variable tokens, WCAG 2.2 AA contrast |
| **State & Forms** | TanStack Form + Zod | Shared validation schemas between client and server functions |
| **Database** | Drizzle ORM (PostgreSQL) | Type-safe schema for leads and newsletter subscribers |
| **Admin Table** | TanStack Table | Full-featured lead dashboard with search, filters, and CSV export |
| **Security** | Turnstile + Honeypot + IP Hash | Protection against bots, privacy-compliant IP hashing (no raw IPs stored) |
| **Testing** | Vitest | Schema and repository unit tests |

---

## 3. Getting Started

### Prerequisites
- **Node.js**: v20+ (v24 recommended)
- **Package Manager**: `pnpm` (v11+)

### Installation
```bash
# Clone and enter directory
git clone https://github.com/TheTai-devFE/VIEWIXSOFT.git
cd VIEWIXSOFT

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env
```

### Local Development Server
```bash
pnpm dev
```
The application will launch at `http://localhost:3000`.

### Type Checking & Testing
```bash
# Run strict TypeScript validation
pnpm typecheck

# Run unit tests
pnpm test
```

### Production Build
```bash
# Generate production SSR bundle and static public assets
pnpm build

# Preview build locally
pnpm preview
```

---

## 4. Content Authoring Guide

All marketing and technical content is centralized in typed, Git-versioned data models in `src/content/`.

### Adding or Editing Products
Edit [src/content/products.ts](file:///Users/tailuong/Documents/gitclone/VIEWIXSOFT/src/content/products.ts):
```ts
export const PRODUCTS: Product[] = [
  {
    id: 'cms',
    name: 'Viewixsoft CMS',
    slug: 'cms',
    tagline: 'Enterprise Cloud Content Management...',
    shortDescription: '...',
    heroBadge: 'Core Network Engine',
    features: [...],
    supportedOS: ['Android 9+', 'Windows 10/11', 'Linux', ...],
    specs: [...],
    faq: [...]
  }
]
```
The Navbar mega-menu, Footer, Product detail routes (`/products/$slug`), and JSON-LD structured schemas update automatically.

### Adding Use Cases
Add entries to [src/content/useCases.ts](file:///Users/tailuong/Documents/gitclone/VIEWIXSOFT/src/content/useCases.ts) with `slug`, `title`, `industry`, `challenge`, `solution`, `results`, and `quote`.

### Adding Engineering Blog Posts
Add entries to [src/content/blog-posts.ts](src/content/blog-posts.ts) with `slug`, `title`, `seoTitle`, `category`, `author`, `keyTakeaways`, and `content`.

Every product, use case and post needs a `seoTitle` (at most 47 characters, so "Title — Viewixsoft" fits in 60) and an `updatedAt` date. `pnpm test` fails if a title or description is too long or duplicated.

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
