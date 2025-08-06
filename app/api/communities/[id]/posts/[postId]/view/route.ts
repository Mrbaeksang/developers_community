import { NextRequest } from 'next/server'
import { redis } from '@/lib/core/redis'
import { auth } from '@/auth'
import { prisma } from '@/lib/core/prisma'
import { successResponse } from '@/lib/api/response'
import { throwNotFoundError } from '@/lib/api/errors'

// POST /api/communities/[id]/posts/[postId]/view - 조회수 증가 (Redis 버퍼링)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; postId: string }> }
) {
  try {
    const { id, postId } = await params
    const session = await auth()

    // 커뮤니티 확인
    const community = await prisma.community.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      select: { id: true },
    })

    if (!community) {
      throw throwNotFoundError('Community not found')
    }

    // 게시글 확인 (작성자 확인용)
    const post = await prisma.communityPost.findUnique({
      where: {
        id: postId,
        communityId: community.id,
      },
      select: { authorId: true },
    })

    if (!post) {
      throw throwNotFoundError('Post not found')
    }

    // 작성자 본인은 조회수 증가 안함
    if (session?.user?.id === post.authorId) {
      return successResponse({ success: true })
    }

    // DB에서 직접 조회수 증가
    const updatedPost = await prisma.communityPost.update({
      where: { id: postId },
      data: { viewCount: { increment: 1 } },
      select: { viewCount: true },
    })

    // Redis 동기화 및 캐시 무효화
    const client = redis()
    if (client) {
      // Redis에도 동기화 (post_views 해시 사용)
      await client.hset('post_views', postId, updatedPost.viewCount)

      // 해당 게시글 상세 캐시 무효화 (조회수가 바로 반영되도록)
      const { redisCache } = await import('@/lib/cache/redis')
      await redisCache.delPattern(
        `api:cache:community:post:detail:*postId*${postId}*`
      )
      await redisCache.delPattern(
        `api:cache:community:posts:*communityId*${community.id}*`
      )
    }

    return successResponse({ success: true, viewCount: updatedPost.viewCount })
  } catch {
    // Redis 오류 시에도 정상 응답 (사용자 경험 우선)
    return successResponse({ success: true })
  }
}
