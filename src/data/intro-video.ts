/**
 * Short product tour shown under the home hero.
 *
 * TODO(content): add the video. Put the files in `public/videos/`:
 * - `src`: MP4 (H.264 + AAC), 1920×1080 or 1280×720, ideally under 20 MB.
 *   Larger files belong on a video host (Mux, Cloudflare Stream, YouTube).
 * - `poster`: the frame shown before play, WebP or JPG at the same aspect ratio.
 * - `captions`: WebVTT file. WCAG 2.2 AA requires captions for videos with speech.
 * - `uploadDate` (YYYY-MM-DD) and `duration` (ISO 8601, e.g. PT1M30S) feed the
 *   VideoObject JSON-LD.
 * While `src` is empty the section is hidden in production and shows a
 * labelled placeholder in the dev server.
 */
export const INTRO_VIDEO = {
  title: 'Viewixsoft product tour',
  description:
    'A short tour of Viewixsoft CMS, Viewixsoft POS, Viewixsoft Tracking and Viewixsoft NFC, and how they work together on your screens.',
  src: '',
  poster: '',
  captions: '',
  uploadDate: '',
  duration: '',
}
