'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { apiClient } from '@/lib/api/client'

// 고유한 방문자 세션 ID 생성
function getOrCreateSessionId(): string {
  const cookieName = 'visitor_session'

  // 기존 세션 ID 확인
  const existingId = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${cookieName}=`))
    ?.split('=')[1]

  if (existingId) {
    return existingId
  }

  // 새 세션 ID 생성 (타임스탬프 + 랜덤 문자열)
  const newId = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}`

  // 쿠키 설정 (1일 유효)
  const expires = new Date()
  expires.setDate(expires.getDate() + 1)
  document.cookie = `${cookieName}=${newId}; path=/; expires=${expires.toUTCString()}; SameSite=Lax`

  return newId
}

export function VisitorTracker() {
  const pathname = usePathname()

  useEffect(() => {
    // 방문자 추적 API 호출
    const trackVisitor = async () => {
      try {
        // 세션 ID 가져오기 또는 생성
        const sessionId = getOrCreateSessionId()

        await apiClient('/api/visitors/track', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionId,
            pathname,
            userAgent: navigator.userAgent,
            referrer: document.referrer,
          }),
        })
      } catch (error) {
        // 추적 실패는 조용히 무시
        console.error('Visitor tracking error:', error)
      }
    }

    trackVisitor()

    // 60초마다 하트비트 전송 (Vercel 비용 최적화 - Function Invocations 50% 감소)
    const heartbeatInterval = setInterval(() => {
      trackVisitor()
    }, 60000)

    return () => {
      clearInterval(heartbeatInterval)
    }
  }, [pathname])

  return null
}
