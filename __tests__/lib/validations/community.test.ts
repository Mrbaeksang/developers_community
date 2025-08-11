import { describe, it, expect } from 'vitest'
import {
  CommunityVisibility,
  CommunityRole,
  MembershipStatus,
} from '@prisma/client'
import {
  createCommunitySchema,
  updateCommunitySchema,
  inviteMemberSchema,
  manageCommunityMemberSchema,
  joinCommunitySchema,
  updateMemberStatusSchema,
} from '@/lib/validations/community'

describe('Community Validation Schemas', () => {
  describe('createCommunitySchema', () => {
    it('성공: 유효한 커뮤니티 생성 데이터', () => {
      const validCommunity = {
        name: '개발자 커뮤니티',
        slug: 'dev-community',
        description: '개발자들을 위한 커뮤니티',
        visibility: CommunityVisibility.PUBLIC,
        rules: '서로 존중하며 좋은 정보를 공유해주세요',
        allowFileUpload: true,
        allowChat: true,
        maxFileSize: 10485760, // 10MB
      }
      expect(() => createCommunitySchema.parse(validCommunity)).not.toThrow()
    })

    it('실패: 잘못된 슬러그 형식', () => {
      const invalidCommunity = {
        name: '테스트 커뮤니티',
        slug: 'Invalid_Slug!', // 대문자와 특수문자 포함
        description: '테스트',
      }
      expect(() => createCommunitySchema.parse(invalidCommunity)).toThrow()
    })

    it('실패: 너무 작은 파일 크기', () => {
      const invalidCommunity = {
        name: '테스트',
        slug: 'test',
        maxFileSize: 500000, // 1MB 미만
      }
      expect(() => createCommunitySchema.parse(invalidCommunity)).toThrow()
    })
  })

  describe('inviteMemberSchema', () => {
    it('성공: 유효한 멤버 초대', () => {
      const inviteData = {
        email: 'user@example.com',
        role: CommunityRole.MEMBER,
      }
      expect(() => inviteMemberSchema.parse(inviteData)).not.toThrow()
    })

    it('실패: 잘못된 이메일 형식', () => {
      const invalidInvite = {
        email: 'invalid-email',
        role: CommunityRole.MEMBER,
      }
      expect(() => inviteMemberSchema.parse(invalidInvite)).toThrow()
    })
  })

  describe('manageCommunityMemberSchema', () => {
    it('성공: 멤버 승인', () => {
      const manageData = {
        userId: 'cm123abcd1234567890abcdef',
        action: 'approve' as const,
      }
      expect(() => manageCommunityMemberSchema.parse(manageData)).not.toThrow()
    })

    it('성공: 멤버 승진 (역할 포함)', () => {
      const promoteData = {
        userId: 'cm123abcd1234567890abcdef',
        action: 'promote' as const,
        role: CommunityRole.MODERATOR,
      }
      expect(() => manageCommunityMemberSchema.parse(promoteData)).not.toThrow()
    })

    it('성공: 멤버 밴 (사유와 기간 포함)', () => {
      const banData = {
        userId: 'cm123abcd1234567890abcdef',
        action: 'ban' as const,
        reason: '규칙 위반',
        duration: 30,
      }
      expect(() => manageCommunityMemberSchema.parse(banData)).not.toThrow()
    })

    it('실패: 잘못된 사용자 ID', () => {
      const invalidData = {
        userId: 'invalid-id',
        action: 'approve',
      }
      expect(() => manageCommunityMemberSchema.parse(invalidData)).toThrow()
    })

    it('실패: 너무 긴 밴 기간', () => {
      const invalidBanData = {
        userId: 'cm123abcd1234567890abcdef',
        action: 'ban' as const,
        reason: '테스트',
        duration: 400, // 365일 초과
      }
      expect(() => manageCommunityMemberSchema.parse(invalidBanData)).toThrow()
    })
  })

  describe('joinCommunitySchema', () => {
    it('성공: 가입 메시지 포함', () => {
      const joinData = {
        message: '커뮤니티에 참여하고 싶습니다',
      }
      expect(() => joinCommunitySchema.parse(joinData)).not.toThrow()
    })

    it('성공: 가입 메시지 없음', () => {
      const joinData = {}
      expect(() => joinCommunitySchema.parse(joinData)).not.toThrow()
    })

    it('실패: 너무 긴 가입 메시지', () => {
      const invalidJoinData = {
        message: 'a'.repeat(201), // 200자 초과
      }
      expect(() => joinCommunitySchema.parse(invalidJoinData)).toThrow()
    })
  })

  describe('updateMemberStatusSchema', () => {
    it('성공: 멤버 상태 업데이트', () => {
      const statusData = {
        status: MembershipStatus.ACTIVE,
        reason: '승인 완료',
      }
      expect(() => updateMemberStatusSchema.parse(statusData)).not.toThrow()
    })

    it('실패: 잘못된 멤버십 상태', () => {
      const invalidStatusData = {
        status: 'INVALID_STATUS',
      }
      expect(() => updateMemberStatusSchema.parse(invalidStatusData)).toThrow()
    })
  })

  describe('updateCommunitySchema', () => {
    it('성공: 부분 업데이트', () => {
      const updateData = {
        name: '새로운 커뮤니티 이름',
        description: '업데이트된 설명',
        allowFileUpload: false,
      }
      expect(() => updateCommunitySchema.parse(updateData)).not.toThrow()
    })

    it('성공: 빈 업데이트', () => {
      const updateData = {}
      expect(() => updateCommunitySchema.parse(updateData)).not.toThrow()
    })

    // slug는 수정 불가능하므로 omit되어야 함
    it('slug 필드는 업데이트 스키마에서 제외됨', () => {
      const updateData = {
        name: '테스트',
        slug: 'new-slug', // 이 필드는 무시되어야 함
      }
      const parsed = updateCommunitySchema.parse(updateData)
      expect(parsed).not.toHaveProperty('slug')
    })
  })
})
