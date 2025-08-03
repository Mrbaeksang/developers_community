import { NextRequest } from 'next/server'
import { syncAllViewCounts } from '@/lib/redis-sync'
import { successResponse, errorResponse } from '@/lib/api-response'

// Vercel Cron Job 또는 수동 실행을 위한 API
// GET /api/cron/sync-views
export async function GET(request: NextRequest) {
  try {
    // Vercel Cron Secret 확인 (프로덕션 환경)
    const authHeader = request.headers.get('authorization')
    if (
      process.env.CRON_SECRET &&
      authHeader !== `Bearer ${process.env.CRON_SECRET}`
    ) {
      return errorResponse('Unauthorized', 401)
    }

    // 조회수 동기화 실행
    const results = await syncAllViewCounts()

    console.error(`View counts synced:`, results)

    return successResponse({
      results,
    })
  } catch {
    return errorResponse('Failed to sync view counts', 500)
  }
}
