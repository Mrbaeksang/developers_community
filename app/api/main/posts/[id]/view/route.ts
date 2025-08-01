import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/redis'

// POST /api/main/posts/[id]/view - 조회수 증가 (Redis 버퍼링)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Redis에 조회수 버퍼링
    const viewKey = `post:${id}:views`

    // 조회수 증가
    await redis().incr(viewKey)

    // TTL 설정 (24시간)
    await redis().expire(viewKey, 86400)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to increment view count:', error)
    // Redis 오류 시에도 정상 응답 (사용자 경험 우선)
    return NextResponse.json({ success: true })
  }
}
