import { describe, it, expect } from 'vitest'
import {
  createChatMessageSchema,
  updateChatMessageSchema,
  createChatChannelSchema,
} from '@/lib/validations/chat'

describe('Chat Validation Schemas', () => {
  describe('createChatMessageSchema', () => {
    it('성공: 기본 텍스트 메시지', () => {
      const messageData = {
        content: '안녕하세요!',
        type: 'TEXT' as const,
      }
      expect(() => createChatMessageSchema.parse(messageData)).not.toThrow()
    })

    it('성공: 파일 첨부 메시지', () => {
      const messageData = {
        content: '파일을 공유합니다',
        fileId: 'cm123abcd1234567890abcdef',
        type: 'FILE' as const,
      }
      expect(() => createChatMessageSchema.parse(messageData)).not.toThrow()
    })

    it('성공: 이미지 메시지', () => {
      const messageData = {
        content: '이미지 공유',
        fileId: 'cm123abcd1234567890abcdef',
        type: 'IMAGE' as const,
      }
      expect(() => createChatMessageSchema.parse(messageData)).not.toThrow()
    })

    it('성공: 답글 메시지', () => {
      const messageData = {
        content: '좋은 의견이네요!',
        replyToId: 'cm123abcd1234567890abcdef',
        type: 'TEXT' as const,
      }
      expect(() => createChatMessageSchema.parse(messageData)).not.toThrow()
    })

    it('실패: 빈 메시지 내용', () => {
      const invalidMessage = {
        content: '',
        type: 'TEXT',
      }
      expect(() => createChatMessageSchema.parse(invalidMessage)).toThrow()
    })

    it('실패: 너무 긴 메시지', () => {
      const invalidMessage = {
        content: 'a'.repeat(1001), // 1000자 초과
        type: 'TEXT',
      }
      expect(() => createChatMessageSchema.parse(invalidMessage)).toThrow()
    })

    it('실패: 잘못된 파일 ID', () => {
      const invalidMessage = {
        content: '파일 공유',
        fileId: 'invalid-id',
        type: 'FILE',
      }
      expect(() => createChatMessageSchema.parse(invalidMessage)).toThrow()
    })

    it('실패: 잘못된 메시지 타입', () => {
      const invalidMessage = {
        content: '테스트',
        type: 'INVALID_TYPE',
      }
      expect(() => createChatMessageSchema.parse(invalidMessage)).toThrow()
    })
  })

  describe('updateChatMessageSchema', () => {
    it('성공: 메시지 수정', () => {
      const updateData = {
        content: '수정된 메시지 내용',
      }
      expect(() => updateChatMessageSchema.parse(updateData)).not.toThrow()
    })

    it('실패: 빈 수정 내용', () => {
      const invalidUpdate = {
        content: '',
      }
      expect(() => updateChatMessageSchema.parse(invalidUpdate)).toThrow()
    })

    it('실패: 너무 긴 수정 내용', () => {
      const invalidUpdate = {
        content: 'a'.repeat(1001), // 1000자 초과
      }
      expect(() => updateChatMessageSchema.parse(invalidUpdate)).toThrow()
    })
  })

  describe('createChatChannelSchema', () => {
    it('성공: 기본 채널 생성', () => {
      const channelData = {
        name: '일반 채팅',
        description: '자유로운 대화를 나누는 채널',
      }
      expect(() => createChatChannelSchema.parse(channelData)).not.toThrow()
    })

    it('성공: 설명 없는 채널', () => {
      const channelData = {
        name: '공지사항',
      }
      expect(() => createChatChannelSchema.parse(channelData)).not.toThrow()
    })

    it('실패: 빈 채널명', () => {
      const invalidChannel = {
        name: '',
        description: '테스트 채널',
      }
      expect(() => createChatChannelSchema.parse(invalidChannel)).toThrow()
    })

    it('실패: 너무 긴 채널명', () => {
      const invalidChannel = {
        name: 'a'.repeat(101), // 100자 초과
        description: '테스트',
      }
      expect(() => createChatChannelSchema.parse(invalidChannel)).toThrow()
    })

    it('실패: 너무 긴 설명', () => {
      const invalidChannel = {
        name: '테스트 채널',
        description: 'a'.repeat(501), // 500자 초과
      }
      expect(() => createChatChannelSchema.parse(invalidChannel)).toThrow()
    })
  })

  describe('기본값 테스트', () => {
    it('createChatMessageSchema 기본 타입은 TEXT', () => {
      const messageData = {
        content: '기본 메시지',
      }
      const parsed = createChatMessageSchema.parse(messageData)
      expect(parsed.type).toBe('TEXT')
    })
  })
})
