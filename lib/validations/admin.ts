import { z } from 'zod'
import { GlobalRole } from '@prisma/client'

// 관리자 태그 수정 스키마 (Prisma MainTag 모델 기준)
export const updateTagSchema = z.object({
  name: z
    .string()
    .min(1, '태그명은 필수입니다')
    .max(50, '태그명은 50자 이내여야 합니다')
    .regex(
      /^[가-힣a-zA-Z0-9\s\-_]+$/,
      '태그명은 한글, 영문, 숫자, 공백, 하이픈, 언더스코어만 사용 가능합니다'
    )
    .trim(),
  slug: z
    .string()
    .min(1, 'URL 슬러그는 필수입니다')
    .max(50, 'URL 슬러그는 50자 이내여야 합니다')
    .regex(/^[a-z0-9\-]+$/, '슬러그는 소문자, 숫자, 하이픈만 사용 가능합니다')
    .toLowerCase(),
  description: z
    .string()
    .max(500, '설명은 500자 이내여야 합니다') // Prisma는 String?이므로 제한 늘림
    .trim()
    .optional()
    .nullable(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, '올바른 색상 코드가 아닙니다 (예: #FF0000)')
    .default('#64748b'), // Prisma 기본값과 동일
})

// 관리자 카테고리 수정 스키마 (Prisma MainCategory 모델 기준)
export const updateCategorySchema = z.object({
  name: z
    .string()
    .min(1, '카테고리명은 필수입니다')
    .max(50, '카테고리명은 50자 이내여야 합니다')
    .trim(),
  slug: z
    .string()
    .min(1, 'URL 슬러그는 필수입니다')
    .max(50, 'URL 슬러그는 50자 이내여야 합니다')
    .regex(/^[a-z0-9\-]+$/, '슬러그는 소문자, 숫자, 하이픈만 사용 가능합니다')
    .toLowerCase(),
  description: z
    .string()
    .max(500, '설명은 500자 이내여야 합니다')
    .trim()
    .optional()
    .nullable(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, '올바른 색상 코드가 아닙니다 (예: #FF0000)')
    .default('#6366f1'), // Prisma 기본값과 동일
  icon: z
    .string()
    .max(50, '아이콘명은 50자 이내여야 합니다')
    .optional()
    .nullable(),
  order: z
    .number()
    .int('순서는 정수여야 합니다')
    .min(0, '순서는 0 이상이어야 합니다')
    .max(9999, '순서는 9999 이하여야 합니다')
    .default(0), // Prisma 기본값과 동일
  isActive: z.boolean().default(true),
  requiresApproval: z.boolean().default(true), // Prisma MainCategory의 requiresApproval 필드 추가
})

// 게시글 승인/거부 스키마
export const approvePostSchema = z
  .object({
    action: z.enum(['approve', 'reject']),
    reason: z
      .string()
      .max(500, '사유는 500자 이내여야 합니다')
      .trim()
      .optional(), // reject시에만 필요하지만 일단 optional로
  })
  .refine(
    (data) => {
      // reject 액션인데 사유가 없으면 에러
      if (data.action === 'reject' && !data.reason) {
        return false
      }
      return true
    },
    {
      message: '게시글 거부 시 사유는 필수입니다',
      path: ['reason'],
    }
  )

// 사용자 역할 변경 스키마
export const changeUserRoleSchema = z.object({
  role: z.nativeEnum(GlobalRole, '올바른 사용자 역할이 아닙니다'),
})

// 사용자 밴 스키마
export const banUserSchema = z.object({
  reason: z
    .string()
    .min(1, '밴 사유는 필수입니다')
    .max(500, '밴 사유는 500자 이내여야 합니다')
    .trim(),
  duration: z
    .number()
    .int('밴 기간은 정수여야 합니다')
    .min(1, '밴 기간은 최소 1일입니다')
    .max(365, '밴 기간은 최대 365일입니다')
    .optional(), // undefined면 영구밴
})

export type UpdateTagInput = z.infer<typeof updateTagSchema>
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>
export type ApprovePostInput = z.infer<typeof approvePostSchema>
export type ChangeUserRoleInput = z.infer<typeof changeUserRoleSchema>
export type BanUserInput = z.infer<typeof banUserSchema>
