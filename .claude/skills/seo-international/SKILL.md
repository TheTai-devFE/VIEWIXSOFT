---
name: seo-international
description: Senior technical SEO playbook for Viewixsoft (global, English-first, i18n-ready). Use when adding or reviewing routes, meta tags, canonical/hreflang, structured data (JSON-LD), sitemap/robots/RSS, redirects, internal linking, keyword targeting, Core Web Vitals, or running an SEO audit before release.
---

# International SEO — Viewixsoft

You act as a senior technical SEO lead. The goal is to rank globally for digital signage software queries and to feed clean, structured data to both search and AI engines (see the `geo-ai-readiness` skill).

## Keyword and intent map (starting point; validate with real data)
| Page | Primary intent | Example target queries |
|---|---|---|
| Home | Brand + category | digital signage software, digital signage platform |
| /products/cms | Commercial | digital signage CMS, cloud signage content management |
| /products/pos | Commercial | POS with digital menu board, POS digital signage integration |
| /products/tracking | Commercial | proof of play software, digital signage monitoring, screen analytics |
| /products/nfc | Commercial | NFC interactive display, tap to interact signage |
| /use-cases/* | Commercial-investigational | digital signage for retail / restaurants / hotels… |
| /blog/* | Informational | what is DOOH, how to set up digital signage, signage cost |
| /glossary/* | Definitional | proof of play meaning, what is a digital signage player |

- One primary topic per URL, with no two pages targeting the same query (avoid cannibalization).
- Topic clusters: each product is a pillar, and its use cases and blog posts link to it and back.

## Mandatory on-page elements (enforced by `buildHead()`)
- **Title:** ≤ 60 characters, primary keyword near the start, `— Viewixsoft` suffix (Home: `Viewixsoft — Digital Signage Software for …`).
- **Meta description:** 120–155 characters, states the benefit and ends with a call to action. Unique per page.
- **Canonical:** absolute, self-referencing, `https://` + primary host, with no params.
- **`robots`:** `index,follow,max-image-preview:large,max-snippet:-1` on public pages, `noindex,nofollow` on admin and utility pages.
- **Open Graph / Twitter:** `og:title`, `og:description`, `og:image` (1200×630 with alt), `og:type` (`website` or `article`), `og:locale=en_US`, `twitter:card=summary_large_image`.
- **hreflang:** `en` and `x-default`, both pointing at the canonical. When locales are added, every locale page lists all alternates reciprocally.
- **`<html lang="en">`** and `<meta name="viewport">`, plus theme-color for light and dark.

## i18n readiness (not active yet, design for it now)
- **Future URL pattern:** `/` (en default) plus `/{locale}/…` subfolders (e.g. `/de/`, `/ja/`). Don't use ccTLDs or query params for language.
- Never auto-redirect by IP or Accept-Language. Offer a language switcher instead, so crawlers can reach every locale.
- Keep copy out of components (use a message catalog via Paraglide) so translation doesn't need code changes.
- Localize currency, date formats and units on the server, and keep slugs in English unless a localized slug strategy is approved.

## Structured data (JSON-LD via `~/lib/seo/jsonld.ts`)
| Page | Types |
|---|---|
| All pages | `Organization` (@id `https://viewixsoft.com/#org`, name, url, logo, sameAs[], contactPoint) and `WebSite` (@id `#website`, publisher → #org) |
| Inner pages | `BreadcrumbList` |
| Product | `SoftwareApplication` (name "Viewixsoft CMS", applicationCategory `BusinessApplication`, operatingSystem, offers if public pricing, publisher → #org) |
| Use case | `Article` (about → product, mentions industry) |
| Blog post | `BlogPosting` (headline, datePublished, dateModified, author `Person` with url and sameAs, image, publisher → #org) |
| Page with FAQ | `FAQPage` (visible Q&A only; schema must match the on-page text) |
| About / Contact | `AboutPage` / `ContactPage` + `Organization` |

- Use stable `@id`s so entities link across pages. Never mark up content that is not visible on the page. Don't add review or rating markup without real reviews.
- Validate with the Rich Results Test and the Schema.org validator. Add a unit test that snapshots the JSON-LD per page type.

## Crawl and index control
- **`sitemap.xml`:** only canonical, indexable, 200-status URLs, with `lastmod` from content `updatedAt`. Split into a sitemap index when there are more than 5,000 URLs.
- **`robots.txt`:** allow all public paths, disallow `/admin` and `/api`, and reference the sitemap. The AI crawler policy is in the `geo-ai-readiness` skill.
- **Status codes:** real 404 and 410, 301 for moved pages (no redirect chains, no 302 for permanent moves).
- **Trailing slash:** pick no trailing slash and 301 the other form. Host: 301 `www` ↔ apex to one host, HTTPS only.
- **Pagination:** `/blog?page=2` gets a self canonical (not a canonical to page 1) and crawlable `<a href>` links.
- **Faceted filters** (use-case industry): index only curated combinations; other combinations are `noindex,follow`.
- **IndexNow:** ping on publish (Bing, Yandex, and Bing feeds ChatGPT search). Submit the sitemap in Google Search Console and Bing Webmaster Tools.

## Internal linking
- Use descriptive anchors (not "click here" or "read more").
- Every page is reachable within 3 clicks of Home.
- Product pages link to related use cases, guides and glossary terms. Blog posts link to at least one product and one use case.
- Breadcrumbs are on every inner page, and the footer links to all products and key pages.

## Images and media
- Use descriptive file names (`viewixsoft-cms-playlist-scheduler.avif`), `alt` text that describes the image, and `width`/`height`.
- Add an image sitemap entry or OG image for every product. Use `VideoObject` schema for embedded product videos.

## Core Web Vitals (ranking and UX)
LCP < 2.5s, INP < 200ms and CLS < 0.1 at p75 on mobile. Measure with real-user monitoring (the `web-vitals` lib sent to analytics), not only Lighthouse.

## Pre-release SEO audit
- [ ] Every public URL returns 200 with a unique title, description and canonical. No duplicate H1.
- [ ] JSON-LD is valid with no warnings on critical types, and the FAQ schema matches visible text.
- [ ] Sitemap lists only indexable canonicals; robots allows the right paths; hreflang is reciprocal.
- [ ] No broken internal links (run a crawler such as `linkinator` in CI). No redirect chains.
- [ ] The OG image renders for every page type.
- [ ] Core Web Vitals budgets pass; Lighthouse SEO is 100.
- [ ] Search Console and Bing Webmaster are verified and the sitemap is submitted (human task; list it in the summary).
