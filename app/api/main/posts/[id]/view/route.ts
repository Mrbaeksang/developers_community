import { NextRequest } from 'next/server'
import { successResponse } from '@/lib/api/response'
import { prisma } from '@/lib/core/prisma'
import { headers } from 'next/headers'
import { auth } from '@/auth'

// POST /api/main/posts/[id]/view - 조회수 증가 (중복 방지 + Redis 버퍼링)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    const headersList = await headers()

    // IP 주소 또는 사용자 ID로 식별
    const identifier =
      session?.user?.id ||
      headersList.get('x-forwarded-for')?.split(',')[0] ||
      headersList.get('x-real-ip') ||
      'anonymous'

    // Redis를 통한 중복 체크 (선택적)
    let shouldIncrement = true

    try {
      const { redis } = await import('@/lib/core/redis')
      const client = redis()

      if (client) {
        // 조회 기록 키 (24시간 만료)
        const viewKey = `post_view:${id}:${identifier}`
        const exists = await client.get(viewKey)

        if (exists) {
          // 이미 조회한 경우 증가하지 않음
          shouldIncrement = false
        } else {
          // 조회 기록 저장 (24시간 TTL)
          await client.setex(viewKey, 86400, '1')
        }
      }
    } catch {
      // Redis 에러는 무시하고 진행
    }

    // 조회수 증가 필요시에만 DB 업데이트
    let viewCount = 0

    if (shouldIncrement) {
      const updatedPost = await prisma.mainPost.update({
        where: { id },
        data: { viewCount: { increment: 1 } },
        select: { viewCount: true },
      })
      viewCount = updatedPost.viewCount
    } else {
      // 증가하지 않는 경우 현재 값만 조회
      const post = await prisma.mainPost.findUnique({
        where: { id },
        select: { viewCount: true },
      })
      viewCount = post?.viewCount || 0
    }

    // Redis 캐시 무효화 시도 (조회수가 증가한 경우에만)
    if (shouldIncrement) {
      try {
        const { redis } = await import('@/lib/core/redis')
        const { redisCache } = await import('@/lib/cache/redis')
        const client = redis()
        if (client) {
          // Redis에도 동기화
          await client.hset('post_views', id, viewCount)

          // 해당 게시글 상세 캐시 무효화 (조회수가 바로 반영되도록)
          await redisCache.delPattern(`api:cache:main:post:detail:*id*${id}*`)
        }
      } catch {
        // Redis 에러는 무시 (선택적 기능)
      }
    }

    return successResponse({
      viewed: true,
      viewCount,
      incremented: shouldIncrement,
    })
  } catch (error) {
    console.error('Error processing view count:', error)
    // 에러 시에도 현재 조회수 반환
    try {
      const post = await prisma.mainPost.findUnique({
        where: { id: (await params).id },
        select: { viewCount: true },
      })
      return successResponse({
        viewed: true,
        viewCount: post?.viewCount || 0,
        incremented: false,
      })
    } catch {
      return successResponse({
        viewed: true,
        viewCount: 0,
        incremented: false,
      })
    }
  }
}
