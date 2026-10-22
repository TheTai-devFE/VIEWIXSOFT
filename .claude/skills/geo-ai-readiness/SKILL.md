---
name: geo-ai-readiness
description: Generative Engine Optimization (GEO) playbook so AI assistants and answer engines (ChatGPT, Claude, Perplexity, Gemini, Google AI Overviews/AI Mode, Copilot) can crawl, understand, quote and recommend Viewixsoft. Use when writing or reviewing any public content, building llms.txt / markdown variants / robots AI rules, structuring pages, defining the brand entity, or measuring AI referral traffic.
---

# GEO / AI Readiness — Viewixsoft

AI engines pick sources they can **fetch easily, parse cleanly, trust, and quote in small pieces**. Every public page must satisfy all four. GEO builds on technical SEO (`seo-international` skill), so do both.

## 1. Fetchable: let AI crawlers in
- **`robots.txt`** has explicit groups that allow reputable AI and search crawlers on public paths and disallow `/admin` and `/api`:
  `GPTBot`, `OAI-SearchBot`, `ChatGPT-User`, `ClaudeBot`, `Claude-SearchBot`, `Claude-User`, `PerplexityBot`, `Perplexity-User`, `Google-Extended`, `Applebot-Extended`, `Bingbot`, `meta-externalagent`, `CCBot`.
  - Training crawlers (`GPTBot`, `ClaudeBot`, `Google-Extended`, `CCBot`, `Applebot-Extended`) and search or user-fetch agents are controlled separately by flags in `src/data/site-config.ts` (`aiTraining: true`, `aiSearch: true`). Changing a flag requires human approval.
- **No content behind JS.** Most AI fetchers do not execute JavaScript. All text, FAQs, specs, tables and prices must be in the SSR HTML.
- **No bot-blocking** on public pages (Cloudflare "Block AI bots" off, no JS challenge, no login wall). Rate-limit only `/api`.
- **Fast, stable responses:** 200 status and a server response time under 500ms. AI fetchers time out quickly.
- **Bing indexing matters:** ChatGPT and Copilot search lean on Bing, so submit to Bing Webmaster and ping IndexNow on publish.

## 2. Parsable: clean, machine-friendly formats
- **`/llms.txt`** (llms.txt proposal format), generated from the content source:
  ```
  # Viewixsoft
  > Viewixsoft builds digital signage software: Viewixsoft CMS, POS, Tracking and NFC for managing, monetizing and measuring advertising screens.

  ## Products
  - [Viewixsoft CMS](https://viewixsoft.com/products/cms.md): one-line summary
  ...
  ## Use cases
  ## Guides
  ## Company
  - [About](…/about.md), [Contact](…/contact.md), [Pricing](…)
  ```
- **`/llms-full.txt`** is the full Markdown of all products, use cases, the glossary and key guides concatenated (cap about 500 KB).
- **Markdown twins:** every content URL has a `.md` version (`/products/cms.md`) with `Content-Type: text/markdown; charset=utf-8` and `<link rel="alternate" type="text/markdown" href="…md">` in the HTML head. The `.md` versions are excluded from the sitemap and canonicalized to the HTML page with an HTTP `Link: <…>; rel="canonical"` header.
- **Semantic HTML:** `article`, `section`, real heading hierarchy, `<table>` for comparisons and specs (never images of tables), `<ol>` for steps, `<dl>` for spec pairs, `<time datetime>` for dates.
- **JSON-LD with stable `@id`s:** the entity graph Organization → SoftwareApplication → Article → Person. See the SEO skill for the types.

## 3. Trustworthy: entity and E-E-A-T
- **One canonical brand entity:** "Viewixsoft" (exact spelling, one word). The same one-sentence description goes everywhere: site, JSON-LD `description`, LinkedIn, GitHub, Crunchbase, G2/Capterra, Product Hunt, and a Wikidata item when eligible. Keep it in `src/data/site-config.ts` as `brand.oneLiner`.
- **`sameAs`** in Organization JSON-LD lists every official profile, and those profiles link back to the site.
- **Product entities:** each product has a fixed name ("Viewixsoft CMS"), a one-liner, category, platforms and key capabilities, reused verbatim across the product page, llms.txt, JSON-LD and directory listings. Consistency is what lets models connect the facts.
- **Authors:** real people with an `/authors/$slug` page, a bio, role, credentials, photo and links. `BlogPosting.author` points to that `Person` @id.
- **Freshness:** show the visible "Updated <date>" and keep `dateModified` accurate. Review evergreen pages quarterly.
- **Evidence:** case studies with named customers (only with permission), concrete numbers, certifications and integrations. Third-party mentions (reviews, press, Reddit/community answers, partner pages) are a major AI trust signal. Marketing owns the off-site plan (see the `marketing-growth` skill).

## 4. Quotable: write for extraction
Every public page follows this structure:
1. **TL;DR / summary** (2–3 sentences) right under the H1. It must be a complete, self-contained answer: "Viewixsoft Tracking is proof-of-play and screen-monitoring software that …".
2. **Question-style H2s** that mirror real prompts ("How does Viewixsoft CMS schedule content across locations?").
3. **Answer-first paragraphs:** the first sentence under each H2 answers it fully on its own (40–60 words), followed by details.
4. **Chunkable sections:** each H2 section makes sense if lifted alone. Repeat the subject noun ("Viewixsoft NFC…") instead of "it" or "this" at the section start.
5. **Facts in structured form:** spec tables, comparison tables ("Viewixsoft CMS vs. spreadsheets + USB sticks"), numbered steps, definition lists.
6. **Specific numbers with sources:** "supports up to 10,000 screens per workspace (internal benchmark, 2026)". Don't use vague claims.
7. **FAQ block** of 4–8 real customer questions, with visible answers and `FAQPage` schema.
8. **Key takeaways box** on long guides.

### Content types AI engines cite most (prioritize)
- Definitions and glossary pages ("What is proof of play?")
- Comparison and "best X for Y" pages written honestly, including when a competitor fits better
- How-to and setup guides with steps
- Pricing and cost explainers with concrete ranges
- Original data and benchmarks (surveys, anonymized platform stats); highly citable

### Avoid
- Fluff intros, hype adjectives, keyword stuffing, walls of text, content that exists only in images or video without a transcript, gated content that is the only source of a key fact, and contradicting facts across pages.

## 5. Measure
- In analytics, segment AI referrers: `chatgpt.com`, `chat.openai.com`, `perplexity.ai`, `claude.ai`, `gemini.google.com`, `copilot.microsoft.com`, and `utm_source=chatgpt.com`.
- Log AI crawler hits (user agent) in edge or server logs to confirm fetching.
- Run a monthly prompt panel: about 30 target prompts (e.g. "best digital signage software for restaurants") run in ChatGPT, Perplexity, Gemini and Claude. Record whether Viewixsoft is mentioned or cited, and which URL. Track this in `docs/geo-tracking.md`.

## GEO checklist (every public page)
- [ ] All content is in the SSR HTML, the page loads fast, there is no bot challenge, and robots allows AI crawlers.
- [ ] The H1 is followed by a self-contained TL;DR, with question-style H2s and answer-first paragraphs.
- [ ] Facts appear in tables or lists, numbers are sourced and dated, and the "Updated" date is visible.
- [ ] The FAQ block and `FAQPage` schema match the visible text.
- [ ] Product and brand names are exact, and the one-liner is consistent with `site-config.ts`.
- [ ] The `.md` twin is generated and the page is listed in `llms.txt` (if it is a key page).
- [ ] The author has a `Person` page (blog) with links to related products, use cases and the glossary.
