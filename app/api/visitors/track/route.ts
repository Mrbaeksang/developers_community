import { NextResponse } from 'next/server'
import { redis } from '@/lib/redis'

export async function POST(request: Request) {
  try {
    const { sessionId, pathname } = await request.json()

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      )
    }

    const client = redis()
    const now = Date.now()

    // 방문자 세션 정보 저장 (5분 TTL)
    await client.setex(
      `visitor:${sessionId}`,
      300,
      JSON.stringify({
        lastPath: pathname,
        timestamp: now,
      })
    )

    // 활성 방문자 집합에 추가
    await client.sadd('active_visitors', sessionId)
    await client.expire('active_visitors', 300)

    // 오늘 페이지뷰 카운트
    const today = new Date().toISOString().split('T')[0]
    await client.hincrby('daily_views', today, 1)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error tracking visitor:', error)
    return NextResponse.json(
      { error: 'Failed to track visitor' },
      { status: 500 }
    )
  }
}
