import { NextRequest, NextResponse } from 'next/server'
import { trackApiCall, logError, trackActiveUser } from '@/lib/monitoring'

type RouteContext = {
  params?: Record<string, string | string[]>
}

export function withMonitoring(
  handler: (req: NextRequest, context?: RouteContext) => Promise<NextResponse>
) {
  return async (req: NextRequest, context?: RouteContext) => {
    const start = Date.now()
    const endpoint = req.url ? new URL(req.url).pathname : 'unknown'
    const method = req.method

    try {
      const response = await handler(req, context)
      const responseTime = Date.now() - start

      // API 호출 추적
      await trackApiCall(endpoint, responseTime)

      // 활성 사용자 추적 (인증된 요청만)
      const userId = response.headers.get('x-user-id')
      if (userId) {
        await trackActiveUser(userId, endpoint)
      }

      // 에러 응답 로깅
      if (response.status >= 400) {
        const body = await response.text()
        let message = 'Unknown error'

        try {
          const json = JSON.parse(body)
          message = json.error || json.message || message
        } catch {
          message = body || message
        }

        await logError({
          endpoint,
          method,
          statusCode: response.status,
          message,
          userId: userId || undefined,
        })

        // 응답 재생성 (body가 이미 읽혔으므로)
        return new NextResponse(body, {
          status: response.status,
          headers: response.headers,
        })
      }

      return response
    } catch (error) {
      const responseTime = Date.now() - start

      // 에러 로깅
      await logError({
        endpoint,
        method,
        statusCode: 500,
        message:
          error instanceof Error ? error.message : 'Internal server error',
      })

      // API 호출 추적 (실패한 경우도)
      await trackApiCall(endpoint, responseTime)

      throw error
    }
  }
}
