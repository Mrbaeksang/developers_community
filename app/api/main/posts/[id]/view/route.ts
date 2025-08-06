import { NextRequest } from 'next/server'
import { incrementViewCount } from '@/lib/redis'
import { successResponse } from '@/lib/api-response'
import { prisma } from '@/lib/prisma'

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

    console.log(
      `[View API] Updated viewCount for ${id}: ${updatedPost.viewCount}`
    )

    // Redis 캐시 무효화 시도 (Redis가 있는 경우)
    try {
      const { redis } = await import('@/lib/redis')
      const client = redis()
      if (client) {
        // Redis에도 동기화
        await client.hset('post_views', id, updatedPost.viewCount)
        console.log(`[View API] Synced to Redis: ${updatedPost.viewCount}`)
      }
    } catch (redisError) {
      // Redis 에러는 무시 (선택적 기능)
      console.log('[View API] Redis sync skipped (Redis not available)')
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
