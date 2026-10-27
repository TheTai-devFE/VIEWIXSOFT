import type { EditorSpec } from '~/components/admin/content/SectionTextEditor'

/**
 * The text a page editor can change in each section of the Viewixsoft CMS and
 * About pages. Illustrations and company figures stay in the code; prices and
 * the specification table have their own editors under Pricing and
 * Specifications.
 */

const eyebrow = { kind: 'text', name: 'eyebrow', label: 'Label', hint: 'Small text above the heading. Leave empty to hide it.' } as const
const description = { kind: 'text', name: 'description', label: 'Intro', hint: 'Leave empty to hide it.', rows: 3 } as const

export const PAGE_TEXT_EDITORS = {
  'product-cms:why': {
    name: 'Hero',
    spec: {
      intro:
        'The opening of the page. Its heading is the page title (H1). The video below the buttons is picked under Product tour.',
      fields: [
        { kind: 'text', name: 'eyebrow', label: 'Tagline', hint: 'One short line above the heading. Leave empty to hide it.' },
        [
          { kind: 'text', name: 'title', label: 'Heading' },
          { kind: 'text', name: 'highlight', label: 'Heading end (glowing)', hint: 'Shown after the heading in the brand gradient, with a soft glow.' },
        ],
        { ...description, hint: 'Start with a direct answer to the heading. Leave empty to hide it.' },
        {
          kind: 'tags',
          name: 'tags',
          label: 'Selling points',
          hint: 'Shown in one small line under the buttons, separated by dots.',
          max: 6,
          itemLabel: 'Point',
        },
      ],
    },
  },
  'product-cms:capabilities': {
    name: 'Capabilities',
    spec: {
      intro: 'Five capabilities, each beside its own illustration, so their number and order are fixed.',
      fields: [
        eyebrow,
        [
          { kind: 'text', name: 'title', label: 'Heading' },
          { kind: 'text', name: 'highlight', label: 'Heading end (muted)', hint: 'Shown after the heading in grey.' },
        ],
        { kind: 'text', name: 'description', label: 'Intro', hint: 'Leave empty to hide it.', rows: 3 },
        {
          kind: 'fixedItems',
          name: 'items',
          label: 'Capabilities',
          itemLabel: 'Capability',
          fields: [
            { name: 'title', label: 'Name' },
            { name: 'body', label: 'Description', rows: 3 },
          ],
        },
      ],
    },
  },
  'product-cms:screens': {
    name: 'Screen band',
    spec: {
      fields: [
        eyebrow,
        { kind: 'text', name: 'title', label: 'Heading' },
        description,
        {
          kind: 'images',
          name: 'images',
          label: 'Screen photos',
          hint: 'Photos for the curved band, in order. With none, the built-in screen photos show. Upload photos in Media first.',
          max: 24,
          pickerDescription: 'A screen in a real place, 16:9 WebP, 1600 × 900. Avoid third-party logos.',
        },
      ],
    },
  },
  'product-cms:specs': {
    name: 'Specifications',
    spec: {
      intro: 'The heading above the specification table. Edit the table below it.',
      fields: [eyebrow, { kind: 'text', name: 'title', label: 'Heading' }, description],
    },
  },
  'product-cms:pricing': {
    name: 'Pricing',
    spec: {
      intro:
        'The heading above the plans on this page. Edit the prices below it. If you quote a price in this intro, update it here too when prices change.',
      fields: [eyebrow, { kind: 'text', name: 'title', label: 'Heading' }, description],
    },
  },
  'product-cms:use-cases': {
    name: 'Related use cases',
    spec: {
      intro: 'The heading above the use case links. Which use cases show comes from the product data.',
      fields: [{ kind: 'text', name: 'title', label: 'Heading' }],
    },
  },
  'about:hero': {
    name: 'Hero',
    spec: {
      intro: 'The opening of the About page. Its heading is the page title (H1). The screen photos behind it are picked below.',
      fields: [
        { kind: 'text', name: 'eyebrow', label: 'Tagline', hint: 'One short line above the heading. Leave empty to hide it.' },
        [
          { kind: 'text', name: 'title', label: 'Heading, first line' },
          { kind: 'text', name: 'highlight', label: 'Heading, second line (muted)' },
        ],
        description,
      ],
    },
  },
  'about:story': {
    name: 'Our story',
    spec: {
      intro:
        'Only publish facts the Viewix team has confirmed. The first paragraph sits between the two photos with the button; the rest follow below. Pick the photos further down.',
      fields: [
        eyebrow,
        { kind: 'text', name: 'title', label: 'Heading' },
        { kind: 'tags', name: 'paragraphs', label: 'Paragraphs', max: 5, itemLabel: 'Paragraph', rows: 3 },
        { kind: 'text', name: 'cta', label: 'Button text', hint: 'The button opens the Contact page.', narrow: true },
      ],
    },
  },
  'about:vision': {
    name: 'Vision',
    spec: {
      intro:
        'A dark band with three cards. Each card keeps its own illustration (signals, insights, reports), so their number and order are fixed. Viewixsoft Tracking and NFC are not released yet: describe the vision, not features that ship today.',
      fields: [
        { kind: 'text', name: 'eyebrow', label: 'Label', hint: 'The small mono line above the heading, after “//”. Leave empty to hide it.', narrow: true },
        [
          { kind: 'text', name: 'title', label: 'Heading' },
          { kind: 'text', name: 'highlight', label: 'Heading end (glowing)' },
        ],
        { ...description, rows: 4 },
        {
          kind: 'fixedItems',
          name: 'cards',
          label: 'Cards',
          itemLabel: 'Card',
          fields: [
            { name: 'title', label: 'Title' },
            { name: 'body', label: 'Text', rows: 2 },
          ],
        },
      ],
    },
  },
  'about:results': {
    name: 'Customer results',
    spec: {
      intro:
        'The cards show up to three use cases with verified results, with their figures and cover photos. Edit those on the use cases themselves.',
      fields: [
        eyebrow,
        { kind: 'text', name: 'title', label: 'Heading' },
        description,
        { kind: 'text', name: 'cta', label: 'Button text', hint: 'The button opens the Use cases page.', narrow: true },
      ],
    },
  },
  'about:facts': {
    name: 'At a glance',
    spec: {
      intro:
        'Four figures in a row under the hero. Only publish figures with a source: the defaults come from the Viewixsoft team and viewixfactory.com.',
      fields: [
        eyebrow,
        { kind: 'text', name: 'title', label: 'Heading' },
        description,
        {
          kind: 'fixedItems',
          name: 'items',
          label: 'Figures',
          itemLabel: 'Figure',
          fields: [
            { name: 'value', label: 'Figure (a year, number or name)' },
            { name: 'label', label: 'What it means', rows: 2 },
          ],
        },
      ],
    },
  },
  'about:customers': {
    name: 'First customers',
    spec: {
      intro: 'The quotes come from Customer quotes, once approved with a consent date.',
      fields: [eyebrow, { kind: 'text', name: 'title', label: 'Heading' }, description],
    },
  },
} satisfies Record<string, { name: string; spec: EditorSpec }>

export type PageTextEditorKey = keyof typeof PAGE_TEXT_EDITORS
export const isPageTextEditorKey = (key: string): key is PageTextEditorKey => key in PAGE_TEXT_EDITORS
