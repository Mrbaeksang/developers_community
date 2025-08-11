import { describe, it, expect } from 'vitest'
import { GlobalRole } from '@prisma/client'
import {
  updateTagSchema,
  updateCategorySchema,
  approvePostSchema,
  changeUserRoleSchema,
  banUserSchema,
} from '@/lib/validations/admin'

describe('Admin Validation Schemas', () => {
  describe('updateTagSchema', () => {
    it('성공: 유효한 태그 데이터', () => {
      const validTag = {
        name: '자바스크립트',
        slug: 'javascript',
        description: 'JavaScript 관련 태그',
        color: '#f7df1e',
      }
      expect(() => updateTagSchema.parse(validTag)).not.toThrow()
    })

    it('실패: 잘못된 색상 코드', () => {
      const invalidTag = {
        name: 'React',
        slug: 'react',
        color: 'invalid-color',
      }
      expect(() => updateTagSchema.parse(invalidTag)).toThrow()
    })

    it('실패: 빈 태그명', () => {
      const invalidTag = {
        name: '',
        slug: 'empty',
        color: '#61dafb',
      }
      expect(() => updateTagSchema.parse(invalidTag)).toThrow()
    })
  })

  describe('updateCategorySchema', () => {
    it('성공: 유효한 카테고리 데이터', () => {
      const validCategory = {
        name: '프론트엔드',
        slug: 'frontend',
        description: '프론트엔드 개발 관련',
        color: '#6366f1',
        icon: 'Code',
        order: 1,
        isActive: true,
        requiresApproval: true,
      }
      expect(() => updateCategorySchema.parse(validCategory)).not.toThrow()
    })

    it('실패: 잘못된 순서값', () => {
      const invalidCategory = {
        name: '백엔드',
        slug: 'backend',
        order: -1,
      }
      expect(() => updateCategorySchema.parse(invalidCategory)).toThrow()
    })
  })

  describe('approvePostSchema', () => {
    it('성공: 승인 액션', () => {
      const approveData = {
        action: 'approve' as const,
      }
      expect(() => approvePostSchema.parse(approveData)).not.toThrow()
    })

    it('성공: 거부 액션 with 사유', () => {
      const rejectData = {
        action: 'reject' as const,
        reason: '부적절한 내용',
      }
      expect(() => approvePostSchema.parse(rejectData)).not.toThrow()
    })

    it('실패: 거부 액션 without 사유', () => {
      const rejectData = {
        action: 'reject' as const,
      }
      expect(() => approvePostSchema.parse(rejectData)).toThrow()
    })
  })

  describe('changeUserRoleSchema', () => {
    it('성공: 유효한 역할 변경', () => {
      const roleData = {
        role: GlobalRole.ADMIN,
      }
      expect(() => changeUserRoleSchema.parse(roleData)).not.toThrow()
    })

    it('실패: 잘못된 역할', () => {
      const invalidRoleData = {
        role: 'INVALID_ROLE',
      }
      expect(() => changeUserRoleSchema.parse(invalidRoleData)).toThrow()
    })
  })

  describe('banUserSchema', () => {
    it('성공: 임시 밴 (기간 설정)', () => {
      const banData = {
        reason: '스팸 행위',
        duration: 7,
      }
      expect(() => banUserSchema.parse(banData)).not.toThrow()
    })

    it('성공: 영구 밴 (기간 없음)', () => {
      const banData = {
        reason: '심각한 규칙 위반',
      }
      expect(() => banUserSchema.parse(banData)).not.toThrow()
    })

    it('실패: 너무 긴 밴 기간', () => {
      const invalidBanData = {
        reason: '테스트',
        duration: 500, // 365일 초과
      }
      expect(() => banUserSchema.parse(invalidBanData)).toThrow()
    })

    it('실패: 빈 사유', () => {
      const invalidBanData = {
        reason: '',
        duration: 7,
      }
      expect(() => banUserSchema.parse(invalidBanData)).toThrow()
    })
  })
})
