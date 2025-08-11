import { z } from 'zod'
import {
  CommunityVisibility,
  CommunityRole,
  MembershipStatus,
} from '@prisma/client'

// 커뮤니티 생성 스키마
export const createCommunitySchema = z.object({
  name: z
    .string()
    .min(2, '커뮤니티 이름은 2자 이상이어야 합니다')
    .max(50, '커뮤니티 이름은 50자 이내여야 합니다')
    .trim(),
  slug: z
    .string()
    .min(2, 'URL 슬러그는 2자 이상이어야 합니다')
    .max(50, 'URL 슬러그는 50자 이내여야 합니다')
    .regex(/^[a-z0-9-]+$/, '소문자, 숫자, 하이픈만 사용 가능합니다')
    .toLowerCase(),
  description: z
    .string()
    .max(500, '설명은 500자 이내여야 합니다')
    .trim()
    .optional(),
  visibility: z
    .nativeEnum(CommunityVisibility)
    .default(CommunityVisibility.PUBLIC),
  rules: z
    .string()
    .max(5000, '규칙은 5000자 이내여야 합니다')
    .optional()
    .nullable(),
  avatar: z.string().optional().nullable().or(z.literal('')),
  banner: z.string().optional().nullable().or(z.literal('')),
  allowFileUpload: z.boolean().default(true),
  allowChat: z.boolean().default(true),
  maxFileSize: z
    .number()
    .min(1048576, '최소 파일 크기는 1MB입니다')
    .max(104857600, '최대 파일 크기는 100MB입니다')
    .default(10485760), // 1MB ~ 100MB, default 10MB
  // 누락된 Boolean 필드들 (Prisma Community 모델 기준)
  isArchived: z.boolean().default(false).optional(),
  requiresApproval: z.boolean().default(false).optional(),
})

// 커뮤니티 수정 스키마
export const updateCommunitySchema = createCommunitySchema
  .partial()
  .omit({ slug: true })

// 커뮤니티 멤버 초대 스키마
export const inviteMemberSchema = z.object({
  email: z.string().email('올바른 이메일 형식이 아닙니다').toLowerCase(),
  role: z
    .nativeEnum(CommunityRole, '올바른 커뮤니티 역할이 아닙니다')
    .default(CommunityRole.MEMBER),
})

// 커뮤니티 멤버 관리 스키마
export const manageCommunityMemberSchema = z.object({
  userId: z.string().cuid('올바른 사용자 ID가 아닙니다'),
  action: z.enum(
    ['approve', 'reject', 'promote', 'demote', 'ban', 'unban', 'remove'],
    '올바른 액션이 아닙니다'
  ),
  role: z
    .nativeEnum(CommunityRole, '올바른 커뮤니티 역할이 아닙니다')
    .optional(), // promote/demote 시에만 사용
  reason: z.string().max(500, '사유는 500자 이내여야 합니다').trim().optional(), // ban/remove 시에만 사용
  duration: z
    .number()
    .int('밴 기간은 정수여야 합니다')
    .min(1, '밴 기간은 최소 1일입니다')
    .max(365, '밴 기간은 최대 365일입니다')
    .optional(), // ban 시에만 사용 (undefined면 영구밴)
})

// 커뮤니티 가입 신청 스키마
export const joinCommunitySchema = z.object({
  message: z
    .string()
    .max(200, '가입 메시지는 200자 이내여야 합니다')
    .trim()
    .optional(), // 비공개 커뮤니티 가입 시 메시지
})

// 커뮤니티 멤버 상태 업데이트 스키마
export const updateMemberStatusSchema = z.object({
  status: z.nativeEnum(MembershipStatus, '올바른 멤버십 상태가 아닙니다'),
  reason: z.string().max(500, '사유는 500자 이내여야 합니다').trim().optional(),
})

export type CreateCommunityInput = z.infer<typeof createCommunitySchema>
export type UpdateCommunityInput = z.infer<typeof updateCommunitySchema>
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>
export type ManageCommunityMemberInput = z.infer<
  typeof manageCommunityMemberSchema
>
export type JoinCommunityInput = z.infer<typeof joinCommunitySchema>
export type UpdateMemberStatusInput = z.infer<typeof updateMemberStatusSchema>
