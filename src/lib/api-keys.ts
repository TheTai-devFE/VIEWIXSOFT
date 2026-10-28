import { z } from 'zod'

/**
 * Access an API key can be given, for outside tools calling /api/v1. Labels
 * are admin UI copy, so they are in Vietnamese.
 */
export const API_SCOPES = ['schema:read', 'schema:write', 'blog:write'] as const
export type ApiScope = (typeof API_SCOPES)[number]

export const API_SCOPE_LABELS: Record<ApiScope, { label: string; hint: string }> = {
  'schema:read': { label: 'Đọc schema', hint: 'Xem danh sách trang và schema đã có' },
  'schema:write': { label: 'Ghi schema', hint: 'Thêm, sửa, xoá schema. Schema mới luôn chờ admin duyệt.' },
  'blog:write': { label: 'Gửi bài blog', hint: 'Tạo và sửa bài nháp. Bài thuộc về người tạo khóa; chỉ người trong admin bấm Đăng được.' },
}

/** Requests per key per minute. */
export const API_RATE_LIMIT_PER_MINUTE = 60

/** Every key starts with this, so a leaked key is easy to spot in logs or code. */
export const API_KEY_PREFIX = 'vxs_'

export const CreateApiKeySchema = z.object({
  name: z.string().trim().min(1, 'Cần đặt tên cho khóa.').max(80, 'Tối đa 80 ký tự.'),
  scopes: z.array(z.enum(API_SCOPES)).min(1, 'Chọn ít nhất một quyền.'),
})
export type CreateApiKeyInput = z.output<typeof CreateApiKeySchema>

/** The key from an `Authorization: Bearer …` header, or null. */
export function bearerToken(header: string | null) {
  const match = header?.match(/^Bearer\s+(\S+)$/i)
  return match?.[1] ?? null
}
