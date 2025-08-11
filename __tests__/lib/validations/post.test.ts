import { describe, it, expect } from 'vitest'
import { createPostSchema, postQuerySchema } from '@/lib/validations/post'
import { PostStatus } from '@prisma/client'

describe('Post Validation', () => {
  describe('createPostSchema', () => {
    it('should accept valid post data', () => {
      const validData = {
        title: '유효한 제목',
        content: '이것은 10자 이상의 유효한 내용입니다.',
        categoryId: 'clz8x9y0z0000vw8kgc4m5n9p',
        status: PostStatus.DRAFT,
        tags: ['javascript', 'nextjs'],
      }

      const result = createPostSchema.safeParse(validData)
      expect(result.success).toBe(true)

      if (result.success) {
        expect(result.data.title).toBe('유효한 제목')
        expect(result.data.status).toBe(PostStatus.DRAFT)
        expect(result.data.tags).toEqual(['javascript', 'nextjs'])
      }
    })

    it('should reject empty title', () => {
      const invalidData = {
        title: '',
        content: '유효한 내용입니다.',
        categoryId: 'clz8x9y0z0000vw8kgc4m5n9p',
      }

      const result = createPostSchema.safeParse(invalidData)
      expect(result.success).toBe(false)

      if (!result.success) {
        const titleError = result.error.issues.find(
          (issue) => issue.path[0] === 'title'
        )
        expect(titleError?.message).toBe('제목은 필수입니다')
      }
    })

    it('should reject short content', () => {
      const invalidData = {
        title: '유효한 제목',
        content: '짧음',
        categoryId: 'clz8x9y0z0000vw8kgc4m5n9p',
      }

      const result = createPostSchema.safeParse(invalidData)
      expect(result.success).toBe(false)

      if (!result.success) {
        const contentError = result.error.issues.find(
          (issue) => issue.path[0] === 'content'
        )
        expect(contentError?.message).toBe('내용은 10자 이상이어야 합니다')
      }
    })

    it('should reject invalid categoryId format', () => {
      const invalidData = {
        title: '유효한 제목',
        content: '유효한 내용입니다.',
        categoryId: '잘못된형식',
      }

      const result = createPostSchema.safeParse(invalidData)
      expect(result.success).toBe(false)

      if (!result.success) {
        const categoryError = result.error.issues.find(
          (issue) => issue.path[0] === 'categoryId'
        )
        expect(categoryError?.message).toBe('올바른 카테고리 ID가 아닙니다')
      }
    })

    it('should accept optional fields', () => {
      const minimalData = {
        title: '최소 데이터',
        content: '최소한의 유효한 내용입니다.',
        categoryId: 'clz8x9y0z0000vw8kgc4m5n9p',
      }

      const result = createPostSchema.safeParse(minimalData)
      expect(result.success).toBe(true)

      if (result.success) {
        expect(result.data.status).toBe(PostStatus.DRAFT) // default value
        expect(result.data.tags).toEqual([]) // default empty array
      }
    })

    it('should limit tags to maximum 10', () => {
      const tooManyTags = Array.from({ length: 11 }, (_, i) => `tag${i}`)

      const invalidData = {
        title: '유효한 제목',
        content: '유효한 내용입니다.',
        categoryId: 'clz8x9y0z0000vw8kgc4m5n9p',
        tags: tooManyTags,
      }

      const result = createPostSchema.safeParse(invalidData)
      expect(result.success).toBe(false)

      if (!result.success) {
        const tagsError = result.error.issues.find(
          (issue) => issue.path[0] === 'tags'
        )
        expect(tagsError?.message).toBe('태그는 최대 10개까지 가능합니다')
      }
    })
  })

  describe('postQuerySchema', () => {
    it('should accept valid query parameters', () => {
      const validQuery = {
        page: '1',
        limit: '20',
        categoryId: 'clz8x9y0z0000vw8kgc4m5n9p',
        status: 'PUBLISHED',
        orderBy: 'latest',
      }

      const result = postQuerySchema.safeParse(validQuery)
      expect(result.success).toBe(true)

      if (result.success) {
        expect(result.data.page).toBe(1) // converted to number
        expect(result.data.limit).toBe(20)
        expect(result.data.orderBy).toBe('latest')
      }
    })

    it('should use default values', () => {
      const result = postQuerySchema.safeParse({})
      expect(result.success).toBe(true)

      if (result.success) {
        expect(result.data.page).toBe(1)
        expect(result.data.limit).toBe(10)
        expect(result.data.orderBy).toBe('latest')
      }
    })

    it('should reject invalid page numbers', () => {
      const invalidQuery = {
        page: '0', // minimum is 1
        limit: '10',
      }

      const result = postQuerySchema.safeParse(invalidQuery)
      expect(result.success).toBe(false)
    })
  })
})
