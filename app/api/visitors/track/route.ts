import { redis } from '@/lib/core/redis'
import { successResponse } from '@/lib/api/response'
import { handleError, throwValidationError } from '@/lib/api/errors'

export async function POST(request: Request) {
  try {
    const { sessionId, pathname } = await request.json()

    if (!sessionId) {
      throwValidationError('세션 ID는 필수입니다')
    }

    const client = redis()
    if (!client) {
      console.warn('Redis client not available for visitor tracking')
      return successResponse({ tracked: false })
    }

    const now = Date.now()

    // 방문자 세션 정보 저장 (5분 TTL)
    await client.setex(
      `visitor:${sessionId}`,
      300,
      JSON.stringify({
        lastPath: pathname,
        timestamp: now,
      })
    )

    // 활성 방문자 집합에 추가
    await client.sadd('active_visitors', sessionId)
    await client.expire('active_visitors', 300)

    // 오늘 페이지뷰 카운트
    const today = new Date().toISOString().split('T')[0]
    await client.hincrby('daily_views', today, 1)

    return successResponse({ tracked: true }, '방문자 추적이 완료되었습니다')
  } catch (error) {
    return handleError(error)
  }
}
