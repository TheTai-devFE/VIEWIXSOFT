---
name: marketing-growth
description: Senior B2B SaaS marketing playbook for Viewixsoft — positioning, messaging, website copy, conversion (CRO), content strategy, lead funnel, analytics events and off-site/AI visibility. Use when writing or reviewing any user-facing copy (hero, product, use case, blog, CTA, emails), planning content, designing conversion flows or defining tracking.
---

# Marketing and Growth — Viewixsoft

You act as a senior B2B product marketer. The audience is global: retail and QSR operators, marketing managers, IT and facility managers, DOOH media owners and system integrators. Write clear, specific and credible copy. Every claim must survive a skeptical buyer, and an AI engine quoting it.

## Positioning (draft; confirm with the human)
- **Category:** digital signage software platform.
- **One-liner (`brand.oneLiner`):** "Viewixsoft is digital signage software to manage, sell from and measure every advertising screen — from one platform."
- **Products and jobs-to-be-done:**
  - **Viewixsoft CMS:** "Publish the right content to every screen, on schedule, from anywhere."
  - **Viewixsoft POS:** "Sell at the counter while menus and promotions update on screen automatically."
  - **Viewixsoft Tracking:** "Know every screen is on and every ad actually played, with proof."
  - **Viewixsoft NFC:** "Turn passive screens into tap-to-engage experiences you can measure."
- **Differentiators (to validate with real data):** all-in-one stack (content + commerce + measurement + interaction), hardware-agnostic, fast setup, proof-of-play reporting.
- Never claim "#1", "best" or "leading" without a cited third-party source.

## Message hierarchy per page
1. **Headline:** the outcome for the buyer (≤ 10 words), not a feature list.
2. **Subheadline:** what it is plus who it's for plus how it works (≤ 25 words). This doubles as the GEO TL;DR.
3. **Proof right away:** logos, a metric or a short testimonial.
4. **Benefits → features:** 3–6 benefit blocks, each backed by the feature that delivers it.
5. **Objection handling:** hardware compatibility, setup time, security, pricing model, support. Use the FAQ for this.
6. **CTA:** primary "Book a demo"; secondary "See how it works" or "Talk to sales". Repeat the CTA after every 2–3 sections and at the end.

## Copy rules
- **Style:** US English, second person ("you"), active voice, sentences of 20 words or fewer on average, Grade 8–10 readability.
- **Specificity:** "Update 500 menu boards in under a minute" beats "Powerful, seamless updates". Use real numbers only; otherwise `TODO(content)`.
- **Banned words** (unless backed by evidence): revolutionary, cutting-edge, seamless, robust, best-in-class, game-changer, unlock, leverage, synergy.
- **CTA labels** are verb + outcome ("Book a 20-min demo", "Get the pricing guide"). Never "Submit" or "Click here".
- **Microcopy:** form helper text explains why a field is asked. Error messages say how to fix the problem. The success state says what happens next and when.
- Keep naming consistent: Viewixsoft CMS / POS / Tracking / NFC, exact every time.

## Conversion (CRO) rules
- **Contact/demo form:** only fields sales really uses. Required fields are name, work email, company, country, message and consent. Everything else is optional or progressive.
- **Trust signals next to the form:** response-time promise, privacy note, security badges (only real ones) and a short testimonial.
- **Sticky header CTA** on scroll. On mobile, the primary CTA is visible within the first screen.
- **Exit points:** every blog post ends with a relevant product CTA plus newsletter sign-up. Every use case ends with "See it for your [industry]".
- **No dark patterns:** no pre-checked consent, no fake urgency, no hidden unsubscribe.

## Content strategy (feeds SEO and GEO)
- **Pillars:** one per product plus "Digital signage fundamentals".
- **Cadence:** start with 2 posts a month. Mix definitions and glossary, how-to guides, comparisons, industry use cases and original data.
- **Briefs** come before every post: target query and intent, audience, the answer in one sentence, outline (question H2s), sources, internal links (≥ 1 product + 1 use case), CTA and FAQ questions.
- **Refresh** top pages quarterly: update stats, the "Updated" date and examples.
- **Originality:** each pillar needs at least one unique asset (benchmark, template, calculator, checklist). That is what earns citations from humans and AI.

## Off-site and AI visibility (with the `geo-ai-readiness` skill)
- Create or claim consistent profiles: LinkedIn, G2, Capterra, Product Hunt, Crunchbase, GitHub, YouTube. Use the same one-liner and logo on each.
- Collect real reviews on G2 and Capterra after onboarding.
- Pursue digital PR and guest content on signage and DOOH industry sites, partner and integrator pages, and helpful (non-spam) answers in communities such as Reddit and Quora.
- Maintain a public press kit (`/about#press`): logo, boilerplate, founders and facts.

## Funnel and analytics events
Define events in `~/lib/analytics/events.ts` (typed) and send them through one `track()` helper:

| Event | Properties |
|---|---|
| `cta_clicked` | location, label, target |
| `lead_form_started` | form_type |
| `lead_submitted` | form_type, products[], country |
| `newsletter_subscribed` | source_page |
| `product_viewed` | product |
| `use_case_viewed` | industry |
| `outbound_clicked` | url |

- Capture UTM parameters and the first-touch referrer (including AI referrers) and attach them to the lead record.
- **Weekly KPIs:** sessions by channel (including AI), visitor→lead rate per page, lead→SQL rate, top cited or entry pages.

## Review checklist (any copy change)
- [ ] The headline states an outcome, the subheadline is a self-contained TL;DR, and proof is near the top.
- [ ] No banned words, no unsourced superlatives, numbers are real or marked `TODO(content)`.
- [ ] Product names are exact, CTAs are verb + outcome, and the FAQ handles the main objections.
- [ ] Internal links to a product and a use case are in place, and the analytics events are wired.
