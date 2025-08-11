import { z } from 'zod'

// 댓글 생성 스키마
export const createCommentSchema = z.object({
  content: z
    .string()
    .min(1, '댓글 내용은 필수입니다')
    .max(1000, '댓글은 1000자 이내여야 합니다')
    .trim(),
  postId: z.string().regex(/^[a-z0-9]{25}$/, '올바른 게시글 ID가 아닙니다'),
  parentId: z
    .string()
    .regex(/^[a-z0-9]{25}$/, '올바른 부모 댓글 ID가 아닙니다')
    .optional()
    .nullable(),
  // Boolean 필드들 (Prisma 모델 기준)
  isDeleted: z.boolean().default(false).optional(),
  isPinned: z.boolean().default(false).optional(),
})

// 댓글 수정 스키마
export const updateCommentSchema = z.object({
  content: z
    .string()
    .min(1, '댓글 내용은 필수입니다')
    .max(1000, '댓글은 1000자 이내여야 합니다')
    .trim(),
})

export type CreateCommentInput = z.infer<typeof createCommentSchema>
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>
