import { redis } from '@/lib/core/redis'

// Redis 키 상수
const KEYS = {
  ERRORS: 'monitoring:errors',
  API_CALLS: 'monitoring:api:calls',
  API_RESPONSE_TIME: 'monitoring:api:response_time',
  ACTIVE_USERS: 'monitoring:active_users',
  PAGE_VIEWS: 'monitoring:page_views',
} as const

// 에러 로깅
export async function logError(error: {
  endpoint: string
  method: string
  statusCode: number
  message: string
  userId?: string
}) {
  const client = redis()
  if (!client) return

  const errorData = {
    ...error,
    timestamp: new Date().toISOString(),
    id: `error:${Date.now()}`,
  }

  try {
    // 최근 100개 에러만 유지
    await client.lpush(KEYS.ERRORS, JSON.stringify(errorData))
    await client.ltrim(KEYS.ERRORS, 0, 99)

    // 1시간 후 자동 삭제
    await client.expire(KEYS.ERRORS, 3600)
  } catch (err) {
    console.error('Failed to log error:', err)
  }
}

// API 호출 추적
export async function trackApiCall(endpoint: string, responseTime: number) {
  const client = redis()
  if (!client) return

  try {
    const hour = new Date().getHours()
    const key = `${KEYS.API_CALLS}:${hour}`

    // 시간대별 API 호출 수 증가
    await client.hincrby(key, endpoint, 1)
    await client.expire(key, 7200) // 2시간 유지

    // 응답 시간 기록
    const timeKey = `${KEYS.API_RESPONSE_TIME}:${endpoint}`
    await client.lpush(timeKey, responseTime)
    await client.ltrim(timeKey, 0, 99) // 최근 100개만
    await client.expire(timeKey, 3600)
  } catch (err) {
    console.error('Failed to track API call:', err)
  }
}

// 활성 사용자 추적
export async function trackActiveUser(userId: string, page: string) {
  const client = redis()
  if (!client) return

  try {
    const userData = {
      userId,
      page,
      lastSeen: Date.now(),
    }

    // 5분간 활성으로 간주
    await client.setex(
      `${KEYS.ACTIVE_USERS}:${userId}`,
      300,
      JSON.stringify(userData)
    )
  } catch (err) {
    console.error('Failed to track active user:', err)
  }
}

// 모니터링 데이터 조회
export async function getMonitoringData() {
  const client = redis()
  if (!client) {
    return {
      errors: [],
      apiStats: { callCount: 0, avgResponseTime: 0, topEndpoints: [] },
      activeUsers: 0,
    }
  }

  try {
    // 최근 에러 조회
    const errorsList = await client.lrange(KEYS.ERRORS, 0, 19)
    const errors = errorsList.map((e) => JSON.parse(e))

    // API 통계
    const hour = new Date().getHours()
    const apiCalls = await client.hgetall(`${KEYS.API_CALLS}:${hour}`)

    const callCount = Object.values(apiCalls).reduce(
      (sum, count) => sum + parseInt(count),
      0
    )

    const topEndpoints = Object.entries(apiCalls)
      .map(([endpoint, count]) => ({ endpoint, count: parseInt(count) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    // 활성 사용자 수
    const activeUserKeys = await client.keys(`${KEYS.ACTIVE_USERS}:*`)
    const activeUsers = activeUserKeys.length

    return {
      errors,
      apiStats: {
        callCount,
        avgResponseTime: 0, // TODO: 계산 로직 추가
        topEndpoints,
      },
      activeUsers,
    }
  } catch (err) {
    console.error('Failed to get monitoring data:', err)
    return {
      errors: [],
      apiStats: { callCount: 0, avgResponseTime: 0, topEndpoints: [] },
      activeUsers: 0,
    }
  }
}

// 페이지뷰 추적
export async function trackPageView(page: string, userId?: string) {
  const client = redis()
  if (!client) return

  try {
    const date = new Date().toISOString().split('T')[0]
    const key = `${KEYS.PAGE_VIEWS}:${date}`

    await client.hincrby(key, page, 1)
    await client.expire(key, 86400 * 7) // 7일 유지

    if (userId) {
      await trackActiveUser(userId, page)
    }
  } catch (err) {
    console.error('Failed to track page view:', err)
  }
}
