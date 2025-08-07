import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { trackPageView } from '@/lib/api/monitoring-base'
import { handleError, throwValidationError } from '@/lib/api/errors'

export async function POST(request: NextRequest) {
  try {
    const { page } = await request.json()

    if (!page) {
      throw throwValidationError('Page is required')
    }

    // 세션에서 사용자 ID 가져오기 (선택사항)
    const session = await auth()
    const userId = session?.user?.id

    // 페이지뷰 추적 - Rate Limit 우회 (모니터링은 제한 없어야 함)
    await trackPageView(page, userId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to track page view:', error)
    return handleError(error)
  }
}
