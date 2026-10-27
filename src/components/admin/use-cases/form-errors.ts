import type { z } from 'zod'

// Names as the editor shows them, so an error points at a field marketing can find.
const FIELDS: Record<string, string> = {
  title: 'Tiêu đề',
  slug: 'URL slug',
  tagline: 'Tóm tắt',
  industry: 'Ngành',
  seoTitle: 'Tiêu đề tìm kiếm',
  coverUrl: 'Thumbnail',
  coverAlt: 'Alt text của thumbnail',
}

const LISTS: Record<string, string> = {
  sections: 'Mục nội dung',
  highlights: 'Điểm nổi bật',
  setup: 'Sản phẩm',
  stories: 'Câu chuyện',
  results: 'Kết quả',
  faq: 'Câu hỏi FAQ',
}

const ITEM_FIELDS: Record<string, string> = {
  heading: 'tiêu đề',
  body: 'nội dung',
  image: 'ảnh',
  url: 'ảnh',
  alt: 'alt text',
  title: 'tiêu đề',
  description: 'câu mô tả',
  name: 'tên',
  role: 'chức danh',
  topic: 'chủ đề',
  quote: 'trích dẫn',
  team: 'nhóm / loại công ty',
  metric: 'con số',
  label: '"đo cái gì"',
  question: 'câu hỏi',
  answer: 'câu trả lời',
}

function where(path: PropertyKey[]): string {
  const [first, index, field, sub] = path
  if (typeof first !== 'string') return 'Form'
  const list = LISTS[first]
  if (list && typeof index === 'number') {
    const item = `${list} ${index + 1}`
    const key = typeof sub === 'string' ? sub : field
    return typeof key === 'string' ? `${item}: ${ITEM_FIELDS[key] ?? key}` : item
  }
  return list ?? FIELDS[first] ?? first
}

/**
 * Turns a validation issue into a sentence in the admin's language (Vietnamese),
 * such as "Mục nội dung 2: tiêu đề đang trống."
 */
export function describeIssue(issue: z.core.$ZodIssue): string {
  const field = where(issue.path)
  if (issue.code === 'too_small' && issue.origin === 'string' && Number(issue.minimum) <= 1) return `${field} đang trống.`
  if (issue.code === 'too_small' && issue.origin === 'string') return `${field} quá ngắn (tối thiểu ${issue.minimum} ký tự).`
  if (issue.code === 'too_big' && issue.origin === 'string') return `${field} quá dài (tối đa ${issue.maximum} ký tự).`
  if (issue.code === 'too_big' && issue.origin === 'array') return `${field}: quá nhiều (tối đa ${issue.maximum}).`
  if (issue.code === 'invalid_format' && issue.path[0] === 'slug') return 'URL slug chỉ gồm chữ thường, số và dấu gạch ngang (ví dụ: qsr-menu-boards).'
  // Customer story rules come from storyProblems, already written for the admin.
  if (issue.code === 'custom') return issue.message
  return `${field}: dữ liệu không hợp lệ.`
}
