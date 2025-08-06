'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { apiClient } from '@/lib/api/client'

export function VisitorTracker() {
  const pathname = usePathname()

  useEffect(() => {
    // 방문자 추적 API 호출
    const trackVisitor = async () => {
      try {
        const sessionId = document.cookie
          .split('; ')
          .find((row) => row.startsWith('visitor_session='))
          ?.split('=')[1]

        if (sessionId) {
          await apiClient('/api/visitors/track', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              sessionId,
              pathname,
            }),
          })
        }
      } catch (error) {
        // 추적 실패는 조용히 무시
        console.error('Visitor tracking error:', error)
      }
    }

    trackVisitor()
  }, [pathname])

  return null
}
