import { z } from 'zod'

// ========== 공통 스키마 ==========

// ID 검증
export const idSchema = z.string().uuid('유효하지 않은 ID 형식입니다')

// 페이지네이션
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
})

// 정렬
export const sortSchema = z.enum(['latest', 'oldest', 'popular'])

// 슬러그
export const slugSchema = z
  .string()
  .min(3, '슬러그는 3자 이상이어야 합니다')
  .max(50, '슬러그는 50자를 초과할 수 없습니다')
  .regex(/^[a-z0-9-]+$/, '슬러그는 소문자, 숫자, 하이픈만 사용할 수 있습니다')

// 색상 코드
export const colorSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, '유효한 색상 코드를 입력해주세요')

// ========== 게시글 관련 스키마 ==========

// 게시글 작성
export const createPostSchema = z.object({
  title: z
    .string()
    .min(1, '제목을 입력해주세요')
    .max(200, '제목은 200자를 초과할 수 없습니다')
    .trim(),
  content: z
    .string()
    .min(1, '내용을 입력해주세요')
    .max(50000, '내용은 50000자를 초과할 수 없습니다'),
  categoryId: idSchema.optional(),
  tags: z
    .array(z.string().min(1).max(20))
    .max(10, '태그는 최대 10개까지 추가할 수 있습니다')
    .optional(),
  status: z.enum(['DRAFT', 'PUBLISHED']).default('PUBLISHED'),
})

// 게시글 수정
export const updatePostSchema = createPostSchema.partial()

// 댓글 작성
export const createCommentSchema = z.object({
  content: z
    .string()
    .min(1, '내용을 입력해주세요')
    .max(500, '댓글은 500자를 초과할 수 없습니다')
    .trim(),
  parentId: idSchema.optional(),
})

// ========== 커뮤니티 관련 스키마 ==========

// 커뮤니티 생성
export const createCommunitySchema = z.object({
  name: z
    .string()
    .min(2, '커뮤니티 이름은 2자 이상이어야 합니다')
    .max(50, '커뮤니티 이름은 50자를 초과할 수 없습니다')
    .trim(),
  slug: slugSchema,
  description: z
    .string()
    .min(1, '설명을 입력해주세요')
    .max(500, '설명은 500자를 초과할 수 없습니다')
    .trim(),
  isPrivate: z.boolean().default(false),
  requireApproval: z.boolean().default(false),
  icon: z.string().optional(),
  bannerImage: z.string().url('유효한 URL을 입력해주세요').optional(),
})

// 커뮤니티 카테고리
export const createCommunityCategorySchema = z.object({
  name: z
    .string()
    .min(1, '카테고리 이름을 입력해주세요')
    .max(30, '카테고리 이름은 30자를 초과할 수 없습니다')
    .trim(),
  slug: slugSchema,
  description: z.string().max(200).optional(),
  color: colorSchema.optional(),
  icon: z.string().optional(),
  order: z.number().int().min(0).optional(),
})

// ========== 사용자 관련 스키마 ==========

// 사용자 프로필 수정
export const updateUserProfileSchema = z.object({
  name: z
    .string()
    .min(2, '이름은 2자 이상이어야 합니다')
    .max(50, '이름은 50자를 초과할 수 없습니다')
    .trim()
    .optional(),
  email: z.string().email('유효한 이메일 주소를 입력해주세요').optional(),
  bio: z.string().max(500, '자기소개는 500자를 초과할 수 없습니다').optional(),
  image: z.string().url('유효한 URL을 입력해주세요').optional(),
})

// ========== 파일 업로드 스키마 ==========

// 이미지 업로드
export const imageUploadSchema = z.object({
  filename: z.string().max(255),
  size: z
    .number()
    .max(5 * 1024 * 1024, '이미지 크기는 5MB를 초과할 수 없습니다'),
  mimetype: z.enum([
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
  ]),
})

// 일반 파일 업로드
export const fileUploadSchema = z.object({
  filename: z.string().max(255),
  size: z
    .number()
    .max(10 * 1024 * 1024, '파일 크기는 10MB를 초과할 수 없습니다'),
  mimetype: z.string(),
})

// ========== 헬퍼 함수 ==========

// Request body 검증
export async function validateRequestBody<T>(
  request: Request,
  schema: z.ZodSchema<T>
): Promise<T> {
  const body = await request.json()
  return schema.parse(body)
}

// Query 파라미터 검증
export function validateSearchParams<T>(
  searchParams: URLSearchParams,
  schema: z.ZodSchema<T>
): T {
  const params = Object.fromEntries(searchParams.entries())
  return schema.parse(params)
}

// SQL Injection 방지를 위한 검증
export function sanitizeSqlInput(value: string): string {
  // 위험한 SQL 패턴 검사
  const dangerousPatterns = [
    /(\b(DROP|DELETE|INSERT|UPDATE|UNION|SELECT|EXEC|EXECUTE)\b.*\b(TABLE|DATABASE|FROM|WHERE)\b)/gi,
    /(-{2}|\/\*|\*\/)/g, // SQL 주석
    /(\bOR\b\s+\d+\s*=\s*\d+)/gi, // OR 1=1 패턴
    /(\bAND\b\s+\d+\s*=\s*\d+)/gi, // AND 1=1 패턴
  ]

  for (const pattern of dangerousPatterns) {
    if (pattern.test(value)) {
      throw new Error('허용되지 않은 문자가 포함되어 있습니다')
    }
  }

  return value
}

// XSS 방지를 위한 HTML 이스케이프
export function escapeHtml(value: string): string {
  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;',
  }

  return value.replace(/[&<>"'/]/g, (match) => htmlEntities[match] || match)
}
