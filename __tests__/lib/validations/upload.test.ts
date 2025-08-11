import { describe, it, expect } from 'vitest'
import {
  fileUploadFormSchema,
  chatFileUploadFormSchema,
  allowedFileTypes,
} from '@/lib/validations/upload'

describe('Upload Validation Schemas', () => {
  describe('fileUploadFormSchema', () => {
    it('성공: 커뮤니티 파일 업로드', () => {
      const uploadData = {
        communityId: 'cm123abcd1234567890abcdef',
      }
      expect(() => fileUploadFormSchema.parse(uploadData)).not.toThrow()
    })

    it('성공: 게시글 파일 업로드', () => {
      const uploadData = {
        postId: 'cm123abcd1234567890abcdef',
      }
      expect(() => fileUploadFormSchema.parse(uploadData)).not.toThrow()
    })

    it('성공: 일반 파일 업로드 (ID 없음)', () => {
      const uploadData = {}
      expect(() => fileUploadFormSchema.parse(uploadData)).not.toThrow()
    })

    it('실패: 잘못된 커뮤니티 ID', () => {
      const invalidData = {
        communityId: 'invalid-id',
      }
      expect(() => fileUploadFormSchema.parse(invalidData)).toThrow()
    })

    it('실패: 잘못된 게시글 ID', () => {
      const invalidData = {
        postId: 'invalid-id',
      }
      expect(() => fileUploadFormSchema.parse(invalidData)).toThrow()
    })
  })

  describe('chatFileUploadFormSchema', () => {
    it('성공: 채팅 파일 업로드', () => {
      const chatUploadData = {
        channelId: 'cm123abcd1234567890abcdef',
        messageType: 'FILE' as const,
      }
      expect(() => chatFileUploadFormSchema.parse(chatUploadData)).not.toThrow()
    })

    it('성공: 채팅 이미지 업로드', () => {
      const chatUploadData = {
        channelId: 'cm123abcd1234567890abcdef',
        messageType: 'IMAGE' as const,
      }
      expect(() => chatFileUploadFormSchema.parse(chatUploadData)).not.toThrow()
    })

    it('성공: 기본 메시지 타입은 FILE', () => {
      const chatUploadData = {
        channelId: 'cm123abcd1234567890abcdef',
      }
      const parsed = chatFileUploadFormSchema.parse(chatUploadData)
      expect(parsed.messageType).toBe('FILE')
    })

    it('실패: 잘못된 채널 ID', () => {
      const invalidData = {
        channelId: 'invalid-channel-id',
        messageType: 'FILE',
      }
      expect(() => chatFileUploadFormSchema.parse(invalidData)).toThrow()
    })

    it('실패: 잘못된 메시지 타입', () => {
      const invalidData = {
        channelId: 'cm123abcd1234567890abcdef',
        messageType: 'INVALID_TYPE',
      }
      expect(() => chatFileUploadFormSchema.parse(invalidData)).toThrow()
    })

    it('실패: 빈 채널 ID', () => {
      const invalidData = {
        channelId: '',
        messageType: 'FILE',
      }
      expect(() => chatFileUploadFormSchema.parse(invalidData)).toThrow()
    })
  })

  describe('allowedFileTypes', () => {
    it('이미지 타입들이 올바르게 정의됨', () => {
      expect(allowedFileTypes.image).toContain('image/jpeg')
      expect(allowedFileTypes.image).toContain('image/png')
      expect(allowedFileTypes.image).toContain('image/gif')
      expect(allowedFileTypes.image).toContain('image/webp')
      expect(allowedFileTypes.image).toHaveLength(4)
    })

    it('문서 타입들이 올바르게 정의됨', () => {
      expect(allowedFileTypes.document).toContain('application/pdf')
      expect(allowedFileTypes.document).toContain('text/plain')
      expect(allowedFileTypes.document).toContain('application/msword')
      expect(allowedFileTypes.document).toContain(
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      )
      expect(allowedFileTypes.document).toHaveLength(4)
    })

    it('비디오 타입들이 올바르게 정의됨', () => {
      expect(allowedFileTypes.video).toContain('video/mp4')
      expect(allowedFileTypes.video).toContain('video/webm')
      expect(allowedFileTypes.video).toHaveLength(3) // video/quicktime 포함
    })

    it('오디오 타입들이 올바르게 정의됨', () => {
      expect(allowedFileTypes.audio).toContain('audio/mpeg')
      expect(allowedFileTypes.audio).toContain('audio/wav')
      expect(allowedFileTypes.audio).toHaveLength(4) // 추가 오디오 타입들 포함
    })

    it('아카이브 타입들이 올바르게 정의됨', () => {
      expect(allowedFileTypes.archive).toContain('application/zip')
      expect(allowedFileTypes.archive).toContain('application/x-rar-compressed')
      expect(allowedFileTypes.archive).toHaveLength(3) // tar 포함
    })
  })

  describe('파일 타입 검증 통합 테스트', () => {
    it('모든 허용된 MIME 타입들을 올바르게 합침', () => {
      const allTypes = Object.values(allowedFileTypes).flat()

      // 중복 제거 후 길이 확인
      const uniqueTypes = [...new Set(allTypes)]
      expect(allTypes.length).toBe(uniqueTypes.length) // 중복이 없어야 함

      // 총 18개 타입이 있어야 함 (4+4+3+4+3)
      expect(allTypes.length).toBe(18)
    })

    it('모든 MIME 타입이 문자열이어야 함', () => {
      const allTypes = Object.values(allowedFileTypes).flat()
      allTypes.forEach((type) => {
        expect(typeof type).toBe('string')
        expect(type.includes('/')).toBe(true) // MIME 타입은 반드시 '/'를 포함
      })
    })
  })

  describe('에지 케이스', () => {
    it('undefined 값들 처리', () => {
      const uploadData = {
        communityId: undefined,
        postId: undefined,
      }
      expect(() => fileUploadFormSchema.parse(uploadData)).not.toThrow()
    })

    it('null 값들은 거부되어야 함', () => {
      const invalidData = {
        communityId: null,
      }
      expect(() => fileUploadFormSchema.parse(invalidData)).toThrow()
    })
  })
})
