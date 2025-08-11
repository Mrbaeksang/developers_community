import { describe, it, expect } from 'vitest'
import {
  createCommentSchema,
  updateCommentSchema,
} from '@/lib/validations/comment'

describe('Comment Validation Schemas', () => {
  describe('createCommentSchema', () => {
    it('성공: 기본 댓글 생성', () => {
      const commentData = {
        content: '좋은 게시글이네요!',
        postId: 'cm123abcd1234567890abcdef',
      }
      expect(() => createCommentSchema.parse(commentData)).not.toThrow()
    })

    it('성공: 대댓글 생성', () => {
      const replyData = {
        content: '동감합니다.',
        postId: 'cm123abcd1234567890abcdef',
        parentId: 'cm456efgh4567890123456789',
      }
      expect(() => createCommentSchema.parse(replyData)).not.toThrow()
    })

    it('성공: boolean 필드 포함', () => {
      const commentData = {
        content: '중요한 댓글입니다',
        postId: 'cm123abcd1234567890abcdef',
        isPinned: true,
        isDeleted: false,
      }
      expect(() => createCommentSchema.parse(commentData)).not.toThrow()
    })

    it('실패: 빈 댓글 내용', () => {
      const invalidComment = {
        content: '',
        postId: 'cm123abcd1234567890abcdef',
      }
      expect(() => createCommentSchema.parse(invalidComment)).toThrow()
    })

    it('실패: 너무 긴 댓글', () => {
      const invalidComment = {
        content: 'a'.repeat(1001), // 1000자 초과
        postId: 'cm123abcd1234567890abcdef',
      }
      expect(() => createCommentSchema.parse(invalidComment)).toThrow()
    })

    it('실패: 잘못된 게시글 ID', () => {
      const invalidComment = {
        content: '테스트 댓글',
        postId: 'invalid-post-id',
      }
      expect(() => createCommentSchema.parse(invalidComment)).toThrow()
    })

    it('실패: 잘못된 부모 댓글 ID', () => {
      const invalidComment = {
        content: '대댓글',
        postId: 'cm123abcd1234567890abcdef',
        parentId: 'invalid-parent-id',
      }
      expect(() => createCommentSchema.parse(invalidComment)).toThrow()
    })

    it('성공: parentId null 허용', () => {
      const commentData = {
        content: '일반 댓글',
        postId: 'cm123abcd1234567890abcdef',
        parentId: null,
      }
      expect(() => createCommentSchema.parse(commentData)).not.toThrow()
    })
  })

  describe('updateCommentSchema', () => {
    it('성공: 댓글 수정', () => {
      const updateData = {
        content: '수정된 댓글 내용',
      }
      expect(() => updateCommentSchema.parse(updateData)).not.toThrow()
    })

    it('실패: 빈 수정 내용', () => {
      const invalidUpdate = {
        content: '',
      }
      expect(() => updateCommentSchema.parse(invalidUpdate)).toThrow()
    })

    it('실패: 너무 긴 수정 내용', () => {
      const invalidUpdate = {
        content: 'a'.repeat(1001), // 1000자 초과
      }
      expect(() => updateCommentSchema.parse(invalidUpdate)).toThrow()
    })

    it('공백만 있는 내용도 trim 후 길이 검사', () => {
      const updateData = {
        content: '   수정된 내용   ',
      }
      const parsed = updateCommentSchema.parse(updateData)
      expect(parsed.content).toBe('수정된 내용')
    })
  })

  describe('기본값 테스트', () => {
    it('boolean 필드 기본값 확인', () => {
      const commentData = {
        content: '테스트 댓글',
        postId: 'cm123abcd1234567890abcdef',
      }
      const parsed = createCommentSchema.parse(commentData)
      expect(parsed.isDeleted).toBe(false)
      expect(parsed.isPinned).toBe(false)
    })
  })

  describe('trim 기능 테스트', () => {
    it('댓글 내용 앞뒤 공백 제거', () => {
      const commentData = {
        content: '   좋은 게시글입니다   ',
        postId: 'cm123abcd1234567890abcdef',
      }
      const parsed = createCommentSchema.parse(commentData)
      expect(parsed.content).toBe('좋은 게시글입니다')
    })
  })
})
