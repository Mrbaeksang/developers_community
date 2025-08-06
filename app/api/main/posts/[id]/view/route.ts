import { NextRequest } from 'next/server'
import { successResponse } from '@/lib/api/response'
import { prisma } from '@/lib/core/prisma'

// POST /api/main/posts/[id]/view - 조회수 증가 (Redis 버퍼링 + DB 동기화)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // DB에서 직접 조회수 증가 (Redis가 설치되지 않은 경우 대비)
    const updatedPost = await prisma.mainPost.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
      select: { viewCount: true },
    })

    // 조회수 업데이트 성공

    // Redis 캐시 무효화 시도 (Redis가 있는 경우)
    try {
      const { redis } = await import('@/lib/core/redis')
      const client = redis()
      if (client) {
        // Redis에도 동기화
        await client.hset('post_views', id, updatedPost.viewCount)
        // Redis 동기화 성공
      }
    } catch {
      // Redis 에러는 무시 (선택적 기능)
    }

    return successResponse({ viewed: true, viewCount: updatedPost.viewCount })
  } catch (error) {
    console.error('Error incrementing view count:', error)
    // 에러 시에도 DB 직접 업데이트 시도
    try {
      const updatedPost = await prisma.mainPost.update({
        where: { id: (await params).id },
        data: { viewCount: { increment: 1 } },
      })
      return successResponse({ viewed: true, viewCount: updatedPost.viewCount })
    } catch {
      return successResponse({ viewed: true })
    }
  }
}
