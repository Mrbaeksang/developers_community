import { NextRequest } from 'next/server'
import { redis } from '@/lib/redis'
import { successResponse } from '@/lib/api-response'

// POST /api/main/posts/[id]/view - 조회수 증가 (Redis 버퍼링)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Redis에 조회수 버퍼링
    const viewKey = `post:${id}:views`

    const client = redis()
    if (client) {
      // 조회수 증가
      await client.incr(viewKey)

      // TTL 설정 (24시간)
      await client.expire(viewKey, 86400)
    } else {
      console.warn('Redis client not available for post view count')
    }

    return successResponse({ viewed: true })
  } catch {
    // Redis 오류 시에도 정상 응답 (사용자 경험 우선)
    return successResponse({ viewed: true })
  }
}
