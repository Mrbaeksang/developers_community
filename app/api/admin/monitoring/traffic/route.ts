import { auth } from '@/auth'
import { prisma } from '@/lib/core/prisma'
import { redis } from '@/lib/core/redis'
import { successResponse, errorResponse } from '@/lib/api/response'
import { redisCache, generateCacheKey } from '@/lib/cache/redis'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return errorResponse('인증이 필요합니다', 401)
    }

    // 관리자 권한 확인
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    })

    if (!user || user.globalRole !== 'ADMIN') {
      return errorResponse('권한이 없습니다', 403)
    }

    // Redis 캐싱 적용 - 30초
    const cacheKey = generateCacheKey('admin:monitoring:traffic', {})

    const data = await redisCache.getOrSet(
      cacheKey,
      async () => {
        const client = redis()

        // Redis가 없어도 기본값 반환
        if (!client) {
          return {
            activeUsers: 0,
            apiCalls: {
              total: 0,
              perHour: [],
              topEndpoints: [],
            },
            pageViews: {
              today: 0,
              topPages: [],
            },
            responseTime: {
              average: 0,
              slow: [],
            },
          }
        }

        // 활성 방문자 수 (sorted set에서 직접 가져오기)
        const activeUsers = (await client.zcard('active_visitors')) || 0

        // 현재 시간대 API 호출 통계
        const hour = new Date().getHours()
        const apiCalls = await client.hgetall(`monitoring:api:calls:${hour}`)

        const totalCalls = Object.values(apiCalls).reduce(
          (sum, count) => sum + parseInt(count),
          0
        )

        const topEndpoints = Object.entries(apiCalls)
          .map(([endpoint, count]) => ({
            endpoint,
            count: parseInt(count),
            percentage: Math.round((parseInt(count) / totalCalls) * 100),
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10)

        // 오늘의 페이지뷰
        const today = new Date().toISOString().split('T')[0]
        const pageViews = await client.hgetall(`monitoring:page_views:${today}`)

        const totalPageViews = Object.values(pageViews).reduce(
          (sum, count) => sum + parseInt(count),
          0
        )

        const topPages = Object.entries(pageViews)
          .map(([page, count]) => ({
            page,
            count: parseInt(count),
            percentage: Math.round((parseInt(count) / totalPageViews) * 100),
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10)

        // 시간대별 API 호출 추이 (최근 24시간)
        const hourlyStats = []
        for (let i = 23; i >= 0; i--) {
          const checkHour = (hour - i + 24) % 24
          const hourCalls = await client.hgetall(
            `monitoring:api:calls:${checkHour}`
          )
          const total = Object.values(hourCalls).reduce(
            (sum, count) => sum + parseInt(count),
            0
          )
          hourlyStats.push({
            hour: checkHour,
            calls: total,
          })
        }

        return {
          activeUsers,
          apiCalls: {
            total: totalCalls,
            perHour: hourlyStats,
            topEndpoints,
          },
          pageViews: {
            today: totalPageViews,
            topPages,
          },
          responseTime: {
            average: 0, // TODO: 응답 시간 계산 로직
            slow: [],
          },
        }
      },
      600 // 10분 캐싱 (Vercel Function Invocations 50% 추가 절감)
    )

    return successResponse(data)
  } catch (error) {
    console.error('Error fetching traffic data:', error)
    return errorResponse('트래픽 데이터 조회 실패', 500)
  }
}
