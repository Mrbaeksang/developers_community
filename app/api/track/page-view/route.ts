import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { trackPageView } from '@/lib/monitoring'

export async function POST(request: NextRequest) {
  try {
    const { page } = await request.json()

    if (!page) {
      return NextResponse.json({ error: 'Page is required' }, { status: 400 })
    }

    // 세션에서 사용자 ID 가져오기 (선택사항)
    const session = await auth()
    const userId = session?.user?.id

    // 페이지뷰 추적
    await trackPageView(page, userId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to track page view:', error)
    return NextResponse.json(
      { error: 'Failed to track page view' },
      { status: 500 }
    )
  }
}
