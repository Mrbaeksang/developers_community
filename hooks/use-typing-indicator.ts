import { useCallback, useEffect, useRef } from 'react'

// 타이핑 상태를 관리하는 훅
export function useTypingIndicator(
  sendTypingStatus: (isTyping: boolean) => void,
  delay = 5000 // 타이핑 중지 후 지연시간 증가 (ms)
) {
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isTypingRef = useRef(false)
  const lastSentTimeRef = useRef<number>(0)
  const throttleDelay = 10000 // 최소 10초 간격으로만 전송 (429 에러 방지)

  // 타이핑 시작
  const startTyping = useCallback(() => {
    const now = Date.now()
    const timeSinceLastSent = now - lastSentTimeRef.current

    // 쓰로틀링: 마지막 전송 후 일정 시간이 지나지 않았으면 무시
    // 이미 타이핑 중이거나, 최근에 전송했으면 새로 전송하지 않음
    if (!isTypingRef.current && timeSinceLastSent >= throttleDelay) {
      isTypingRef.current = true
      lastSentTimeRef.current = now
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
  }, [sendTypingStatus, delay, throttleDelay])

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
