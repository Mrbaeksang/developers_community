import { z } from 'zod'
import { PostStatus } from '@prisma/client'

// 게시글 생성 스키마
export const createPostSchema = z.object({
  title: z
    .string()
    .min(1, '제목은 필수입니다')
    .max(200, '제목은 200자 이내여야 합니다')
    .trim(),
  content: z
    .string()
    .min(10, '내용은 10자 이상이어야 합니다')
    .max(50000, '내용은 50000자 이내여야 합니다'),
  excerpt: z
    .string()
    .max(500, '요약은 500자 이내여야 합니다')
    .trim()
    .optional()
    .nullable(),
  categoryId: z
    .string()
    .regex(/^[a-z0-9]{25}$/, '올바른 카테고리 ID가 아닙니다'),
  status: z.nativeEnum(PostStatus).default(PostStatus.DRAFT),
  tags: z
    .array(z.string().trim())
    .max(10, '태그는 최대 10개까지 가능합니다')
    .optional()
    .default([]),
  // SEO 메타 필드들 (Prisma 모델 기준)
  metaTitle: z
    .string()
    .max(60, 'SEO 제목은 60자 이내여야 합니다')
    .trim()
    .optional()
    .nullable(),
  metaDescription: z
    .string()
    .max(160, 'SEO 설명은 160자 이내여야 합니다')
    .trim()
    .optional()
    .nullable(),
  // Boolean 필드들 (Prisma 모델 기준)
  isPinned: z.boolean().default(false).optional(),
  allowComments: z.boolean().default(true).optional(),
  isArchived: z.boolean().default(false).optional(),
})

// 게시글 수정 스키마 (모든 필드 선택적)
export const updatePostSchema = createPostSchema.partial()

// 게시글 조회 쿼리 파라미터 스키마
export const postQuerySchema = z.object({
  page: z.coerce
    .number()
    .int('페이지는 정수여야 합니다')
    .positive('페이지는 1 이상이어야 합니다')
    .optional()
    .default(1),
  limit: z.coerce
    .number()
    .int('제한 수는 정수여야 합니다')
    .min(1, '최소 1개 이상')
    .max(100, '최대 100개까지')
    .optional()
    .default(10),
  category: z.string().optional(),
  status: z.nativeEnum(PostStatus).optional(),
  search: z.string().trim().optional(),
  orderBy: z
    .enum(['latest', 'oldest', 'popular', 'likes', 'bookmarks', 'commented'])
    .optional()
    .default('latest'),
})

// 타입 내보내기
export type CreatePostInput = z.infer<typeof createPostSchema>
export type UpdatePostInput = z.infer<typeof updatePostSchema>
export type PostQueryParams = z.infer<typeof postQuerySchema>
