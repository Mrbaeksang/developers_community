import { NextRequest, NextResponse } from 'next/server'
import { syncAllViewCounts } from '@/lib/redis-sync'

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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 조회수 동기화 실행
    const results = await syncAllViewCounts()

    console.error(`View counts synced:`, results)

    return NextResponse.json({
      success: true,
      results,
    })
  } catch (error) {
    console.error('Failed to sync view counts:', error)
    return NextResponse.json(
      { error: 'Failed to sync view counts' },
      { status: 500 }
    )
  }
}
