import { NextRequest } from 'next/server'
import { redis } from '@/lib/core/redis'
import { auth } from '@/auth'
import { prisma } from '@/lib/core/prisma'
import { successResponse } from '@/lib/api/response'
import { throwNotFoundError } from '@/lib/api/errors'
import { headers } from 'next/headers'

// POST /api/communities/[id]/posts/[postId]/view - 조회수 증가 (중복 방지 + Redis 버퍼링)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; postId: string }> }
) {
  try {
    const { id, postId } = await params
    const session = await auth()
    const headersList = await headers()

    // IP 주소 또는 사용자 ID로 식별
    const identifier =
      session?.user?.id ||
      headersList.get('x-forwarded-for')?.split(',')[0] ||
      headersList.get('x-real-ip') ||
      'anonymous'

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
      const currentPost = await prisma.communityPost.findUnique({
        where: { id: postId },
        select: { viewCount: true },
      })
      return successResponse({
        success: true,
        viewCount: currentPost?.viewCount || 0,
        incremented: false,
      })
    }

    // Redis를 통한 중복 체크
    let shouldIncrement = true
    const client = redis()

    if (client) {
      try {
        // 조회 기록 키 (24시간 만료)
        const viewKey = `community_post_view:${postId}:${identifier}`
        const exists = await client.get(viewKey)

        if (exists) {
          // 이미 조회한 경우 증가하지 않음
          shouldIncrement = false
        } else {
          // 조회 기록 저장 (24시간 TTL)
          await client.setex(viewKey, 86400, '1')
        }
      } catch {
        // Redis 에러는 무시하고 진행
      }
    }

    // 조회수 증가 필요시에만 DB 업데이트
    let viewCount = 0

    if (shouldIncrement) {
      const updatedPost = await prisma.communityPost.update({
        where: { id: postId },
        data: { viewCount: { increment: 1 } },
        select: { viewCount: true },
      })
      viewCount = updatedPost.viewCount
    } else {
      // 증가하지 않는 경우 현재 값만 조회
      const currentPost = await prisma.communityPost.findUnique({
        where: { id: postId },
        select: { viewCount: true },
      })
      viewCount = currentPost?.viewCount || 0
    }

    // Redis 동기화 및 캐시 무효화 (조회수가 증가한 경우에만)
    if (shouldIncrement && client) {
      try {
        // Redis에도 동기화 (post_views 해시 사용)
        await client.hset('post_views', postId, viewCount)

        // 해당 게시글 상세 캐시 무효화 (조회수가 바로 반영되도록)
        const { redisCache } = await import('@/lib/cache/redis')
        await redisCache.delPattern(
          `api:cache:community:post:detail:*postId*${postId}*`
        )
        await redisCache.delPattern(
          `api:cache:community:posts:*communityId*${community.id}*`
        )
      } catch {
        // Redis 에러는 무시
      }
    }

    return successResponse({
      success: true,
      viewCount,
      incremented: shouldIncrement,
    })
  } catch (error) {
    console.error('Error processing view count:', error)
    // 에러 시에도 정상 응답 (사용자 경험 우선)
    return successResponse({
      success: true,
      viewCount: 0,
      incremented: false,
    })
  }
}
