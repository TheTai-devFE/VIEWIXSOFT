/**
 * SEO and GEO checks for a blog post while it is being written, run live in
 * the admin editor. Each check is a rule from AGENTS.md §8–9 and the SEO/GEO
 * playbooks that can be read from the draft itself. Labels and hints are
 * admin UI copy, so they are in Vietnamese (AGENTS.md §0.6).
 */

export type CheckStatus = 'pass' | 'warn' | 'fail'

export interface PostCheck {
  id: string
  group: 'seo' | 'geo'
  status: CheckStatus
  label: string
  /** What to do about it; empty when the check passes. */
  hint: string
}

export interface PostDraft {
  title: string
  seoTitle: string
  description: string
  slug: string
  content: string
  coverUrl: string
  coverAlt: string
  keyTakeaways: string[]
  faqCount: number
  /** The byline: a profile from /admin/authors, or the plain name and role of an older post. */
  author: { name: string; role: string; kind: 'person' | 'organization'; hasBio: boolean; hasPhoto: boolean }
}

/** " — Viewixsoft" is appended to every search title. */
const TITLE_SUFFIX = 13
const TITLE_MAX = 60
const DESCRIPTION_MIN = 70
const DESCRIPTION_MAX = 155

const words = (text: string) => text.trim().split(/\s+/).filter(Boolean).length

/** Markdown with fenced code removed, so `# comment` lines in code are not read as headings. */
function prose(markdown: string) {
  return markdown.replace(/```[\s\S]*?```/g, '')
}

function headings(markdown: string) {
  return prose(markdown)
    .split('\n')
    .flatMap((line) => {
      const m = /^(#{1,6})\s+(.+?)\s*#*\s*$/.exec(line)
      return m?.[1] && m[2] ? [{ level: m[1].length, text: m[2] }] : []
    })
}

/** The text before the first heading, minus images, quotes-as-callouts and blank lines. */
function intro(markdown: string) {
  const before = prose(markdown).split(/\n#{1,6}\s/)[0] ?? ''
  return before
    .split('\n')
    .filter((l) => l.trim() && !l.trim().startsWith('![') && !l.trim().startsWith('>'))
    .join(' ')
}

function check(id: string, group: PostCheck['group'], ok: boolean | CheckStatus, label: string, hint: string): PostCheck {
  const status: CheckStatus = typeof ok === 'boolean' ? (ok ? 'pass' : 'warn') : ok
  return { id, group, status, label, hint: status === 'pass' ? '' : hint }
}

function authorReady(a: PostDraft['author']) {
  return a.kind === 'person' && !/team$/i.test(a.name.trim()) && a.role.trim() !== '' && a.hasBio && a.hasPhoto
}

function authorHint(a: PostDraft['author']) {
  if (a.kind === 'organization' || /team$/i.test(a.name.trim())) {
    return 'Google và AI tin bài có tác giả cụ thể hơn "Viewixsoft Team". Chọn một người viết ở mục Tác giả.'
  }
  const missing = [!a.role.trim() && 'chức danh', !a.hasBio && 'giới thiệu', !a.hasPhoto && 'ảnh'].filter(Boolean)
  return `Hồ sơ tác giả còn thiếu: ${missing.join(', ')}. Bổ sung ở trang Tác giả (menu Content).`
}

export function checkPost(d: PostDraft): PostCheck[] {
  const body = prose(d.content)
  const hs = headings(d.content)
  const h2s = hs.filter((h) => h.level === 2)
  const searchTitle = (d.seoTitle.trim() || d.title.trim()).length + TITLE_SUFFIX
  const desc = d.description.trim().length
  const count = words(body)
  const images = [...body.matchAll(/!\[([^\]]*)\]\(([^)\s]+)/g)]
  const skipsLevel = hs.some((h, i) => i > 0 && h.level > (hs[i - 1]?.level ?? 1) + 1)
  const firstAnswer = words(intro(d.content))
  const hasNumbers = /\b\d+(?:[.,]\d+)?\s?%|\$\s?\d/.test(body)
  const hasSource = /\b(source|according to|nguồn)\b|\]\(https?:\/\//i.test(body)

  let lengthStatus: CheckStatus = 'pass'
  if (count < 300) lengthStatus = 'fail'
  else if (count < 800) lengthStatus = 'warn'

  let descStatus: CheckStatus = 'pass'
  if (desc === 0) descStatus = 'fail'
  else if (desc < DESCRIPTION_MIN || desc > DESCRIPTION_MAX) descStatus = 'warn'

  return [
    // SEO
    check(
      'title-length',
      'seo',
      searchTitle <= TITLE_MAX,
      `Tiêu đề trên Google: ${searchTitle}/${TITLE_MAX} ký tự`,
      'Quá dài nên Google sẽ cắt bớt. Rút ngắn tiêu đề, hoặc điền "Tiêu đề tìm kiếm" (tối đa 47 ký tự).',
    ),
    check(
      'description-length',
      'seo',
      descStatus,
      `Tóm tắt (meta description): ${desc}/${DESCRIPTION_MAX} ký tự`,
      desc > DESCRIPTION_MAX
        ? 'Google chỉ hiện khoảng 155 ký tự đầu. Đưa ý quan trọng nhất lên đầu, hoặc rút gọn.'
        : 'Nên viết 70–155 ký tự, nói rõ người đọc nhận được gì.',
    ),
    check(
      'slug',
      'seo',
      d.slug.length > 0 && d.slug.length <= 60 && d.slug.split('-').length <= 8,
      'URL slug ngắn, có từ khoá',
      'Rút slug còn 3–6 từ khoá chính, bỏ các từ như "the", "a", "how-to".',
    ),
    check(
      'cover',
      'seo',
      d.coverUrl.trim() && d.coverAlt.trim() ? 'pass' : 'fail',
      'Có ảnh thumbnail và alt text',
      'Ảnh thumbnail được dùng làm ảnh chia sẻ (Facebook, LinkedIn, Zalo) và ảnh trong kết quả tìm kiếm. Chọn ảnh và điền alt text.',
    ),
    check(
      'no-h1',
      'seo',
      hs.some((h) => h.level === 1) ? 'fail' : 'pass',
      'Nội dung không có H1 (# )',
      'Tiêu đề bài đã là H1. Đổi các dòng "# " trong nội dung thành "## ".',
    ),
    check(
      'h2-structure',
      'seo',
      h2s.length >= 2,
      `Có ít nhất 2 tiêu đề H2 (đang có ${h2s.length})`,
      'Chia bài thành các phần bằng "## ". Mục lục và AI đều dựa vào các tiêu đề này.',
    ),
    check(
      'heading-order',
      'seo',
      !skipsLevel,
      'Tiêu đề không nhảy cấp (H2 → H3 → H4)',
      'Có chỗ nhảy cấp, ví dụ từ H2 xuống thẳng H4. Dùng H3 ở giữa.',
    ),
    check(
      'image-alt',
      'seo',
      images.every((m) => (m[1] ?? '').trim().length > 0) ? 'pass' : 'fail',
      `Ảnh trong bài có alt text (${images.length} ảnh)`,
      'Có ảnh dạng ![](...) chưa có alt. Viết mô tả ngắn bằng tiếng Anh vào trong dấu [ ].',
    ),
    check(
      'internal-link',
      'seo',
      /\]\(\/(?!\/)/.test(body),
      'Có link nội bộ (sản phẩm, case study, bài khác)',
      'Thêm ít nhất một link tới trang của Viewixsoft, ví dụ [Viewixsoft CMS](/products/cms).',
    ),
    check(
      'length',
      'seo',
      lengthStatus,
      `Độ dài: ${count} từ`,
      count < 300 ? 'Bài quá ngắn để xếp hạng. Nên viết ít nhất 800 từ.' : 'Bài hướng dẫn B2B nên có 800 từ trở lên.',
    ),
    // GEO
    check(
      'answer-first',
      'geo',
      firstAnswer > 0 && firstAnswer <= 60,
      'Mở bài trả lời thẳng trong 1–2 câu',
      firstAnswer === 0
        ? 'Viết 1–2 câu trả lời thẳng câu hỏi của bài ngay trước tiêu đề H2 đầu tiên. AI thường trích nguyên đoạn này.'
        : `Đoạn mở bài dài ${firstAnswer} từ. Nên gói câu trả lời trong khoảng 40–60 từ đầu tiên.`,
    ),
    check(
      'question-heading',
      'geo',
      h2s.some((h) => h.text.trim().endsWith('?')),
      'Có H2 dạng câu hỏi',
      'Đặt ít nhất một H2 thành câu hỏi người dùng hay tìm, ví dụ "How much does digital signage cost?".',
    ),
    check(
      'takeaways',
      'geo',
      d.keyTakeaways.filter((t) => t.trim()).length >= 3,
      'Có ít nhất 3 ý chính (Key Takeaways)',
      'Điền 3–5 ý chính, mỗi ý một câu đứng riêng được. AI và người đọc lướt đều dựa vào đây.',
    ),
    check(
      'lists',
      'geo',
      /^\s*(?:[-*]|\d+\.)\s+/m.test(body) || /^\|.+\|\s*$/m.test(body),
      'Có danh sách hoặc bảng',
      'Dùng gạch đầu dòng, các bước đánh số hoặc bảng so sánh. Đây là dạng nội dung AI dễ trích dẫn nhất.',
    ),
    check(
      'sourced-numbers',
      'geo',
      !hasNumbers || hasSource,
      'Số liệu có nguồn',
      'Bài có con số (%, $) nhưng chưa thấy nguồn. Ghi "Source: …, năm" hoặc link tới nguồn; không có nguồn thì bỏ số.',
    ),
    check(
      'product-names',
      'geo',
      /\bViewix\s+(?:CMS|POS|Tracking|NFC)\b|\bVX\s?(?:CMS|POS)\b|\bviewixsoft\b/.test(`${d.title}\n${body}`) ? 'fail' : 'pass',
      'Tên sản phẩm viết đúng',
      'Luôn viết "Viewixsoft CMS / POS / Tracking / NFC". Không viết "Viewix CMS", "VX CMS" hay "viewixsoft" thường. "Viewix" đứng riêng là tên hãng phần cứng, dùng được.',
    ),
    check(
      'faq',
      'geo',
      d.faqCount >= 2,
      `Có FAQ (đang có ${d.faqCount} câu)`,
      'Thêm 2–5 câu hỏi thường gặp ở khối FAQ. Chúng được đánh dấu FAQPage cho Google và hay được AI trích dẫn.',
    ),
    check(
      'author',
      'geo',
      authorReady(d.author),
      'Tác giả là người thật, có hồ sơ đầy đủ',
      authorHint(d.author),
    ),
  ]
}

/** Share of checks that pass, for the score in the editor header. */
export function checklistScore(checks: PostCheck[]) {
  const passed = checks.filter((c) => c.status === 'pass').length
  return { passed, total: checks.length, failed: checks.filter((c) => c.status === 'fail').length }
}
