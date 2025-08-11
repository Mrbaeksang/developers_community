import { describe, it, expect } from 'vitest'
import {
  moderateMessage,
  moderateWithUserContext,
  moderateByChannelType,
  quickModerateTyping,
  detectSpamByHistory,
} from '@/lib/chat/moderation'

describe('Chat Moderation System', () => {
  describe('moderateMessage', () => {
    it('정상 메시지는 통과해야 함', () => {
      const result = moderateMessage('안녕하세요! 반갑습니다.')
      expect(result.isClean).toBe(true)
      expect(result.shouldBlock).toBe(false)
      expect(result.issues).toHaveLength(0)
      expect(result.severity).toBe('low')
    })

    it('금지어가 포함된 메시지를 감지해야 함', () => {
      const result = moderateMessage('이런 씨발 놈아')
      expect(result.isClean).toBe(false)
      expect(result.shouldBlock).toBe(false)
      expect(result.issues).toContain('금지어 감지: 씨발')
      expect(result.severity).toBe('medium')
    })

    it('금지어를 * 로 필터링해야 함', () => {
      const result = moderateMessage('이런 씨발 놈아')
      expect(result.filteredContent).toBe('이런 ** *아')
    })

    it('스팸 패턴을 감지해야 함', () => {
      const result = moderateMessage('ㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋ')
      expect(result.isClean).toBe(false)
      expect(result.issues).toContain('스팸 패턴 감지')
    })

    it('URL 스팸을 감지해야 함', () => {
      const result = moderateMessage('클릭하세요 bit.ly/spam123')
      expect(result.isClean).toBe(false)
      expect(result.issues).toContain('스팸 패턴 감지')
    })

    it('전화번호 패턴을 감지해야 함', () => {
      const result = moderateMessage('연락주세요 010-1234-5678')
      expect(result.isClean).toBe(false)
      expect(result.issues).toContain('스팸 패턴 감지')
    })

    it('과도한 대문자 사용을 감지해야 함', () => {
      const result = moderateMessage('STOP SHOUTING AT ME!!!')
      expect(result.isClean).toBe(false)
      expect(result.issues).toContain('과도한 대문자 사용')
    })

    it('과도한 특수문자 사용을 감지해야 함', () => {
      const result = moderateMessage('!@#$%^&*()!@#$%^&*()')
      expect(result.isClean).toBe(false)
      expect(result.issues).toContain('과도한 특수문자 사용')
    })

    it('여러 문제가 있는 메시지는 차단해야 함', () => {
      const result = moderateMessage('씨발 카지노 가입하세요 bit.ly/casino')
      expect(result.isClean).toBe(false)
      expect(result.shouldBlock).toBe(true)
      expect(result.severity).toBe('high')
      expect(result.issues.length).toBeGreaterThanOrEqual(3)
    })

    it('빈 메시지는 깨끗한 것으로 처리해야 함', () => {
      const result = moderateMessage('')
      expect(result.isClean).toBe(true)
      expect(result.shouldBlock).toBe(false)
    })

    it('변형된 욕설을 감지해야 함', () => {
      const result = moderateMessage('ㅅㅂ ㅂㅅ')
      expect(result.isClean).toBe(false)
      expect(result.issues.length).toBeGreaterThan(0)
    })
  })

  describe('moderateWithUserContext', () => {
    it('평판이 높은 사용자는 검열이 완화되어야 함', () => {
      const result = moderateWithUserContext('씨발', 85)
      expect(result.severity).toBe('low')
      expect(result.shouldBlock).toBe(false)
    })

    it('평판이 낮은 사용자는 검열이 강화되어야 함', () => {
      const result = moderateWithUserContext(
        '스팸 패턴입니다 010-1234-5678',
        25
      )
      expect(result.severity).toBe('medium')
      expect(result.shouldBlock).toBe(true)
    })

    it('평판이 보통인 사용자는 기본 검열을 적용해야 함', () => {
      const baseResult = moderateMessage('씨발')
      const contextResult = moderateWithUserContext('씨발', 50)
      expect(contextResult.severity).toBe(baseResult.severity)
      expect(contextResult.shouldBlock).toBe(baseResult.shouldBlock)
    })
  })

  describe('moderateByChannelType', () => {
    it('DM에서는 검열이 완화되어야 함', () => {
      const result = moderateByChannelType('씨발', 'dm')
      expect(result.shouldBlock).toBe(false)
      expect(result.filteredContent).toBe('씨발') // 필터링 안 함
    })

    it('공개 채널에서는 검열이 강화되어야 함', () => {
      const result = moderateByChannelType('카지노 광고문의', 'public')
      expect(result.severity).toBe('medium')
      expect(result.shouldBlock).toBe(true)
    })

    it('비공개 채널에서는 기본 검열을 적용해야 함', () => {
      const baseResult = moderateMessage('테스트 메시지')
      const channelResult = moderateByChannelType('테스트 메시지', 'private')
      expect(channelResult.severity).toBe(baseResult.severity)
    })
  })

  describe('quickModerateTyping', () => {
    it('정상 메시지는 타이핑을 허용해야 함', () => {
      const result = quickModerateTyping('안녕하세요')
      expect(result).toBe(true)
    })

    it('심각한 금지어는 타이핑을 차단해야 함', () => {
      const result = quickModerateTyping('씨발')
      expect(result).toBe(false)
    })

    it('경미한 금지어는 타이핑을 허용해야 함', () => {
      const result = quickModerateTyping('카지노')
      expect(result).toBe(true) // 심각하지 않은 금지어
    })
  })

  describe('detectSpamByHistory', () => {
    it('같은 메시지 반복을 스팸으로 감지해야 함', () => {
      const now = new Date()
      const history = [
        { content: '광고입니다', timestamp: now },
        { content: '광고입니다', timestamp: now },
        { content: '광고입니다', timestamp: now },
      ]
      const isSpam = detectSpamByHistory('광고입니다', history)
      expect(isSpam).toBe(true)
    })

    it('다른 메시지는 스팸으로 감지하지 않아야 함', () => {
      const now = new Date()
      const history = [
        { content: '안녕하세요', timestamp: now },
        { content: '반갑습니다', timestamp: now },
        { content: '질문있습니다', timestamp: now },
      ]
      const isSpam = detectSpamByHistory('새로운 메시지', history)
      expect(isSpam).toBe(false)
    })

    it('너무 빠른 메시지 전송을 스팸으로 감지해야 함', () => {
      const now = new Date()
      const history = Array.from({ length: 15 }, (_, i) => ({
        content: `메시지 ${i}`,
        timestamp: new Date(now.getTime() - i * 1000), // 1초 간격
      }))
      const isSpam = detectSpamByHistory('또 다른 메시지', history)
      expect(isSpam).toBe(true)
    })

    it('5분 이상 지난 메시지는 무시해야 함', () => {
      const sixMinutesAgo = new Date(Date.now() - 6 * 60 * 1000)
      const history = [
        { content: '광고입니다', timestamp: sixMinutesAgo },
        { content: '광고입니다', timestamp: sixMinutesAgo },
        { content: '광고입니다', timestamp: sixMinutesAgo },
      ]
      const isSpam = detectSpamByHistory('광고입니다', history)
      expect(isSpam).toBe(false)
    })

    it('빈 히스토리는 스팸이 아니어야 함', () => {
      const isSpam = detectSpamByHistory('첫 메시지', [])
      expect(isSpam).toBe(false)
    })
  })

  describe('금지어 필터링', () => {
    it('한국어 욕설을 필터링해야 함', () => {
      const result = moderateMessage('시발 병신 개새끼')
      expect(result.filteredContent).toBe('** ** ***')
    })

    it('영어 욕설을 필터링해야 함', () => {
      const result = moderateMessage('fuck shit bitch')
      expect(result.filteredContent).toBe('**** **** *****')
    })

    it('광고 키워드를 필터링해야 함', () => {
      const result = moderateMessage('카지노 도박 토토')
      expect(result.filteredContent).toBe('*** ** **')
    })

    it('대소문자 구분 없이 필터링해야 함', () => {
      const result = moderateMessage('FUCK Shit BiTcH')
      expect(result.filteredContent).toBe('**** **** *****')
    })
  })

  describe('복합 시나리오', () => {
    it('고평판 사용자의 DM은 거의 모든 것을 허용해야 함', () => {
      const baseResult = moderateMessage('씨발')
      const userResult = moderateWithUserContext('씨발', 90)
      const channelResult = moderateByChannelType('씨발', 'dm')

      // DM에서는 항상 차단하지 않음
      expect(channelResult.shouldBlock).toBe(false)
      // 고평판 사용자도 차단하지 않음
      expect(userResult.shouldBlock).toBe(false)
    })

    it('저평판 사용자의 공개 채널 메시지는 엄격하게 검열해야 함', () => {
      const result = moderateByChannelType('카지노 광고문의', 'public')
      expect(result.shouldBlock).toBe(true)
    })
  })
})
