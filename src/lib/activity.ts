import { z } from 'zod'

/**
 * What /admin/activity records. Keys are `<entity>.<verb>`; the labels are
 * admin UI copy, so they are in Vietnamese.
 */
export const ACTIVITY_ENTITIES = {
  blog: 'Bài blog',
  'use-case': 'Case study',
  author: 'Tác giả',
  media: 'Ảnh & video',
  page: 'Trang',
  seo: 'SEO',
  schema: 'Schema markup',
  'api-key': 'Khóa API',
  footer: 'Footer',
  product: 'Sản phẩm',
  stat: 'Số liệu',
  testimonial: 'Trích dẫn',
  subscriber: 'Subscriber',
  lead: 'Lead',
  user: 'Tài khoản',
  auth: 'Đăng nhập',
} as const

export type ActivityEntity = keyof typeof ACTIVITY_ENTITIES
export const ACTIVITY_ENTITY_KEYS = Object.keys(ACTIVITY_ENTITIES) as [ActivityEntity, ...ActivityEntity[]]

export const ACTIVITY_VERBS = {
  create: 'Tạo',
  update: 'Sửa',
  delete: 'Xoá',
  publish: 'Đăng',
  unpublish: 'Gỡ xuống',
  upload: 'Tải lên',
  reset: 'Khôi phục mặc định',
  status: 'Đổi trạng thái',
  revoke: 'Thu hồi',
  ban: 'Khoá',
  unban: 'Mở khoá',
  password: 'Đặt lại mật khẩu',
  sessions: 'Đăng xuất mọi thiết bị',
  sign_in: 'Đăng nhập',
  sign_out: 'Đăng xuất',
} as const

export type ActivityVerb = keyof typeof ACTIVITY_VERBS
export type ActivityAction = `${ActivityEntity}.${ActivityVerb}`

export function describeAction(action: string) {
  const [entity = '', verb = ''] = action.split('.')
  const v = ACTIVITY_VERBS[verb as ActivityVerb] ?? verb
  const e = ACTIVITY_ENTITIES[entity as ActivityEntity] ?? entity
  return entity === 'auth' ? v : `${v} ${e.toLowerCase()}`
}

export const ACTIVITY_RETENTION_DAYS = 90
export const ACTIVITY_PAGE_SIZE = 50

/** /admin/activity search params: every filter optional, dates as YYYY-MM-DD. */
export const ActivitySearchSchema = z.object({
  actor: z.string().min(1).optional().catch(undefined),
  entity: z.enum(ACTIVITY_ENTITY_KEYS).optional().catch(undefined),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().catch(undefined),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().catch(undefined),
  q: z.string().trim().max(100).optional().catch(undefined),
  page: z.number().int().min(1).max(1000).optional().catch(undefined),
})
export type ActivitySearch = z.infer<typeof ActivitySearchSchema>
