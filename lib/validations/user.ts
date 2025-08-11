import { z } from 'zod'

// 프로필 업데이트 스키마
export const updateProfileSchema = z.object({
  name: z
    .string()
    .min(2, '이름은 2자 이상이어야 합니다')
    .max(50, '이름은 50자 이내여야 합니다')
    .regex(/^[가-힣a-zA-Z\s]+$/, '이름은 한글, 영문, 공백만 가능합니다')
    .trim()
    .optional(),
  username: z
    .string()
    .min(3, '사용자명은 3자 이상이어야 합니다')
    .max(30, '사용자명은 30자 이내여야 합니다')
    .regex(/^[a-zA-Z0-9_]+$/, '사용자명은 영문, 숫자, 언더스코어만 가능합니다')
    .toLowerCase()
    .optional(),
  email: z
    .string()
    .email('올바른 이메일 형식이 아닙니다')
    .toLowerCase()
    .optional(),
  bio: z
    .string()
    .max(500, '자기소개는 500자 이내여야 합니다')
    .trim()
    .optional()
    .nullable(),
  image: z
    .string()
    .url('올바른 이미지 URL이 아닙니다')
    .optional()
    .nullable()
    .or(z.literal('')),
  // 추가된 boolean 필드들 (Prisma User 모델 기준)
  showEmail: z.boolean().default(false).optional(),
  emailVerified: z.date().optional().nullable(),
  isBanned: z.boolean().default(false).optional(),
  // globalRole은 관리자만 변경 가능하므로 일반 프로필 업데이트에서는 제외
})

// 사용자 설정 스키마
export const userSettingsSchema = z.object({
  emailNotifications: z.boolean().default(true),
  pushNotifications: z.boolean().default(false),
  theme: z.enum(['light', 'dark', 'system']).default('system'),
  language: z.enum(['ko', 'en']).default('ko'),
})

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
export type UserSettingsInput = z.infer<typeof userSettingsSchema>
