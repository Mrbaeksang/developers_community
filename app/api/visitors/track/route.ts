import { redis } from '@/lib/core/redis'
import { successResponse } from '@/lib/api/response'
import { handleError, throwValidationError } from '@/lib/api/errors'

export async function POST(request: Request) {
  try {
    const { sessionId, pathname, userAgent, referrer } = await request.json()

    if (!sessionId) {
      throwValidationError('세션 ID는 필수입니다')
    }

    const client = redis()
    if (!client) {
      console.warn('Redis client not available for visitor tracking')
      return successResponse({ tracked: false })
    }

    const now = Date.now()
    const visitorKey = `visitor:${sessionId}`
    const activeVisitorsKey = 'active_visitors'

    // 방문자 정보 저장/업데이트 (90초 TTL - 하트비트가 60초마다 오므로 버퍼 추가)
    await client.setex(
      visitorKey,
      90, // 90초 TTL (하트비트 60초 + 버퍼 30초)
      JSON.stringify({
        lastPath: pathname,
        timestamp: now,
        userAgent,
        referrer,
        lastActive: new Date().toISOString(),
      })
    )

    // 활성 방문자 집합에 추가
    await client.zadd(activeVisitorsKey, now, sessionId)

    // 90초 이상 오래된 방문자 제거
    const ninetySecondsAgo = now - 90000
    await client.zremrangebyscore(activeVisitorsKey, '-inf', ninetySecondsAgo)

    // 오늘 페이지뷰 카운트
    const today = new Date().toISOString().split('T')[0]
    await client.hincrby('daily_views', today, 1)

    return successResponse({ tracked: true }, '방문자 추적이 완료되었습니다')
  } catch (error) {
    return handleError(error)
  }
}
