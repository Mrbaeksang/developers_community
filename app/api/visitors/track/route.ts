import { redis } from '@/lib/core/redis'
import { successResponse } from '@/lib/api/response'
import { handleError, throwValidationError } from '@/lib/api/errors'

// 동일 세션에서 너무 자주 추적하지 않도록 쿨다운 설정
const TRACKING_COOLDOWN_MS = 30 * 1000 // 30초 (기존 60초 하트비트를 고려)

export async function POST(request: Request) {
  try {
    const { sessionId, pathname, userAgent, referrer } = await request.json()

    if (!sessionId) {
      throwValidationError('세션 ID는 필수입니다')
    }

    const client = redis()
    if (!client) {
      // Redis 없으면 조용히 무시 (로그 스팸 방지)
      return successResponse({ tracked: false })
    }

    const now = Date.now()
    const visitorKey = `visitor:${sessionId}`
    const lastTrackKey = `last_track:${sessionId}`
    const activeVisitorsKey = 'active_visitors'

    // 쿨다운 체크: 마지막 추적 시간 확인
    const lastTrack = await client.get(lastTrackKey)
    if (lastTrack) {
      const timeSinceLastTrack = now - parseInt(lastTrack)
      if (timeSinceLastTrack < TRACKING_COOLDOWN_MS) {
        // 너무 자주 추적하려고 하면 무시 (로그 없이)
        return successResponse({
          tracked: false,
          cooldown: Math.ceil(
            (TRACKING_COOLDOWN_MS - timeSinceLastTrack) / 1000
          ),
        })
      }
    }

    // 마지막 추적 시간 업데이트
    await client.setex(lastTrackKey, 120, now.toString()) // 2분 TTL

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

    // 오늘 페이지뷰 카운트 (경로별로 제한)
    const today = new Date().toISOString().split('T')[0]
    const pathKey = `${sessionId}:${pathname}:${today}`
    const pathTracked = await client.get(`tracked:${pathKey}`)

    if (!pathTracked) {
      // 오늘 이 경로를 처음 방문하는 경우만 카운트
      await client.hincrby('daily_views', today, 1)
      await client.setex(`tracked:${pathKey}`, 86400, '1') // 24시간 TTL
    }

    return successResponse({ tracked: true })
  } catch (error) {
    return handleError(error)
  }
}
