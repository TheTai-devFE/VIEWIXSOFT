import type { FaqItem } from '~/components/blocks/FaqAccordion'

/**
 * Home page FAQ, also emitted as FAQPage JSON-LD by the home route.
 * Answers only use facts already stated on the site.
 * TODO(content): confirm the pricing answer once the pricing model is set.
 */
export const HOME_FAQ: FaqItem[] = [
  {
    question: 'What is Viewixsoft?',
    answer:
      'Viewixsoft is the software company behind Viewix screens. It builds digital signage software that lets businesses manage content on advertising screens, kiosks and menu boards from one cloud dashboard.',
  },
  {
    question: 'Which Viewixsoft products can I use today?',
    answer:
      'Viewixsoft CMS is available now. Viewixsoft POS, Viewixsoft Tracking and Viewixsoft NFC are coming soon and will connect to the same CMS, so screens you set up today are ready for them.',
  },
  {
    question: 'Which screens does Viewixsoft CMS run on?',
    answer:
      'Viewixsoft CMS runs on Viewix hardware, including floor-standing displays, touch screen kiosks, LED screens, video walls and tablet stands. The Viewixsoft CMS page lists the supported operating systems.',
  },
  {
    question: 'How much does Viewixsoft cost?',
    answer:
      'Pricing depends on how many screens you run and which products you use. Send a request with your screen count and the Viewixsoft team will reply with a quote for your setup.',
  },
  {
    question: 'How do I request a demo?',
    answer:
      'Fill in the form on this page with your company and screen count. The Viewixsoft team will email you to set up a time and show Viewixsoft CMS on a setup like yours.',
  },
]
