/**
 * =====================================================================
 * CẤU HÌNH THÔNG TIN CHÂN TRANG (FOOTER CONFIGURATION)
 * =====================================================================
 * Bạn có thể tự do chỉnh sửa toàn bộ các thông tin hiển thị tại chân trang:
 * - Thông tin pháp nhân / Công ty (Tên, Mã số thuế / ĐKKD, Địa chỉ, Hotline)
 * - Email liên hệ của từng bộ phận (Kinh doanh, Kỹ thuật, CSKH...)
 * - Mạng xã hội (Facebook, TikTok, LinkedIn, YouTube, X...)
 * - Bản quyền & Ghi chú chân trang
 * - Các liên kết cột (Company, Legal...)
 */

export interface FooterLegalEntity {
  /** Tên pháp nhân / Công ty hiển thị */
  name: string
  /** Mã số doanh nghiệp / Mã số thuế / Giấy phép kinh doanh */
  businessRegistrationNo: string
  /** Các dòng địa chỉ văn phòng / trụ sở */
  addressLines: string[]
  /** Số điện thoại hotline (tuỳ chọn) */
  hotline?: string
}

export interface FooterContactItem {
  department: string
  email: string
  phone?: string
}

import type { SocialNetwork } from '~/data/social'

export type FooterSocialNetwork = SocialNetwork

export interface FooterSocialLink {
  network: FooterSocialNetwork
  label: string
  url: string
}

export interface FooterNavLink {
  label: string
  to: string
  isExternal?: boolean
}

export const FOOTER_CONFIG = {
  // 1. THÔNG TIN PHÁP NHÂN & CÔNG TY
  legalEntity: {
    name: 'Shenzhen Viewix Electronic Technology Co., Limited',
    businessRegistrationNo: '80978409-000-08-26-2',
    addressLines: [
      'Room 1508, 15/F, Office Tower Two, Grand Plaza',
      '625 Nathan Road, Mong Kok, Hong Kong',
    ],
    hotline: '', // Ví dụ: '+84 (0) 28 1234 5678'
  },

  // 2. EMAIL VÀ SỐ ĐIỆN THOẠI LIÊN HỆ
  contacts: [
    { department: 'Sales', email: 'sales@viewix.hk', phone: '' },
    { department: 'Technical support', email: 'support@viewix.hk', phone: '' },
  ],

  // 3. MẠNG XÃ HỘI (Điền URL nếu có, để trống thì icon sẽ ẩn trên bản production)
  socials: [
    { network: 'facebook' as const, label: 'Facebook', url: '' },
    { network: 'tiktok' as const, label: 'TikTok', url: '' },
    { network: 'linkedin' as const, label: 'LinkedIn', url: '' },
    { network: 'x' as const, label: 'X', url: '' },
    { network: 'youtube' as const, label: 'YouTube', url: '' },
  ],

  // 4. BẢN QUYỀN VÀ THƯƠNG HIỆU
  copyright: `© ${new Date().getFullYear()} Viewixsoft. All rights reserved. Viewixsoft is part of Viewix.`,

  // 5. CÁC LIÊN KẾT CỘT (TỰ DO THÊM/BỚT LIÊN KẾT)
  companyLinks: [
    { label: 'About', to: '/about' },
    { label: 'Blog', to: '/blog' },
    { label: 'Pricing', to: '/pricing' },
    { label: 'Contact', to: '/contact' },
  ],

  legalLinks: [
    { label: 'Privacy Policy', to: '/legal/privacy' },
    { label: 'Terms of Service', to: '/legal/terms' },
    { label: 'Cookie Policy', to: '/legal/cookies' },
  ],
}

export type FooterConfig = typeof FOOTER_CONFIG

export function resolveFooterConfig(override?: unknown): FooterConfig {
  if (!override || typeof override !== 'object') return FOOTER_CONFIG
  const raw = override as Partial<FooterConfig>
  return {
    ...FOOTER_CONFIG,
    legalEntity: {
      ...FOOTER_CONFIG.legalEntity,
      ...(raw.legalEntity ?? {}),
      addressLines:
        Array.isArray(raw.legalEntity?.addressLines) && raw.legalEntity.addressLines.length > 0
          ? raw.legalEntity.addressLines
          : FOOTER_CONFIG.legalEntity.addressLines,
    },
    contacts: Array.isArray(raw.contacts) && raw.contacts.length > 0 ? raw.contacts : FOOTER_CONFIG.contacts,
    socials: Array.isArray(raw.socials) && raw.socials.length > 0 ? (raw.socials as FooterConfig['socials']) : FOOTER_CONFIG.socials,
    copyright: raw.copyright?.trim() ? raw.copyright : FOOTER_CONFIG.copyright,
    companyLinks: Array.isArray(raw.companyLinks) && raw.companyLinks.length > 0 ? raw.companyLinks : FOOTER_CONFIG.companyLinks,
    legalLinks: Array.isArray(raw.legalLinks) && raw.legalLinks.length > 0 ? raw.legalLinks : FOOTER_CONFIG.legalLinks,
  }
}
