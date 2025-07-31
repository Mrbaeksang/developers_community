import { useCallback, useEffect, useRef } from 'react'

// 타이핑 상태를 관리하는 훅
export function useTypingIndicator(
  sendTypingStatus: (isTyping: boolean) => void,
  delay = 1000 // 타이핑 중지 후 지연시간 (ms)
) {
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isTypingRef = useRef(false)

  // 타이핑 시작
  const startTyping = useCallback(() => {
    if (!isTypingRef.current) {
      isTypingRef.current = true
      sendTypingStatus(true)
    }

    // 기존 타이머 클리어
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // 일정 시간 후 타이핑 중지
    typingTimeoutRef.current = setTimeout(() => {
      if (isTypingRef.current) {
        isTypingRef.current = false
        sendTypingStatus(false)
      }
    }, delay)
  }, [sendTypingStatus, delay])

  // 타이핑 중지
  const stopTyping = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
      typingTimeoutRef.current = null
    }

    if (isTypingRef.current) {
      isTypingRef.current = false
      sendTypingStatus(false)
    }
  }, [sendTypingStatus])

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      if (isTypingRef.current) {
        sendTypingStatus(false)
      }
    }
  }, [sendTypingStatus])

  return {
    startTyping,
    stopTyping,
    isTyping: isTypingRef.current,
  }
}
