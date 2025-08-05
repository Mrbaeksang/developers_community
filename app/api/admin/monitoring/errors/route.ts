import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { redis } from '@/lib/redis'
import { successResponse, errorResponse } from '@/lib/api-response'

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

    const client = redis()
    if (!client) {
      return successResponse({
        errors: [],
        summary: {
          total: 0,
          byStatus: {},
          byEndpoint: {},
        },
      })
    }

    // 최근 에러 조회
    const errorsList = await client.lrange('monitoring:errors', 0, 49)
    const errors = errorsList.map((e) => JSON.parse(e))

    // 에러 요약 통계
    const summary = {
      total: errors.length,
      byStatus: {} as Record<string, number>,
      byEndpoint: {} as Record<string, number>,
    }

    errors.forEach((error) => {
      // 상태 코드별 집계
      const status = error.statusCode.toString()
      summary.byStatus[status] = (summary.byStatus[status] || 0) + 1

      // 엔드포인트별 집계
      const endpoint = `${error.method} ${error.endpoint}`
      summary.byEndpoint[endpoint] = (summary.byEndpoint[endpoint] || 0) + 1
    })

    return successResponse({ errors, summary })
  } catch (error) {
    console.error('Error fetching monitoring errors:', error)
    return errorResponse('모니터링 데이터 조회 실패', 500)
  }
}
