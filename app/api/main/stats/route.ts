import { prisma } from '@/lib/core/prisma'
import { successResponse } from '@/lib/api/response'
import { handleError } from '@/lib/api/errors'
import { redisCache, REDIS_TTL, generateCacheKey } from '@/lib/cache/redis'

export async function GET() {
  try {
    // Redis 캐시 키 생성
    const cacheKey = generateCacheKey('main:stats', {})

    // Redis 캐싱 적용 - 통계는 30분 캐싱
    const cachedStats = await redisCache.getOrSet(
      cacheKey,
      async () => {
        const now = new Date()
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

        // 병렬로 통계 조회
        const [
          totalUsers,
          weeklyPosts,
          weeklyComments,
          activeDiscussions,
          verifiedPosts,
          freePosts,
          qnaPosts,
        ] = await Promise.all([
          // 전체 사용자 수
          prisma.user.count(),

          // 이번 주 게시물 수 (승인된 것만)
          prisma.mainPost.count({
            where: {
              status: 'PUBLISHED',
              createdAt: {
                gte: weekAgo,
              },
            },
          }),

          // 이번 주 댓글 수
          prisma.mainComment.count({
            where: {
              createdAt: {
                gte: weekAgo,
              },
            },
          }),

          // 활성 토론 (최근 24시간 내 댓글이 달린 게시글 수)
          prisma.mainPost.count({
            where: {
              status: 'PUBLISHED',
              comments: {
                some: {
                  createdAt: {
                    gte: new Date(now.getTime() - 24 * 60 * 60 * 1000),
                  },
                },
              },
            },
          }),

          // 검증된 게시글 수 (승인 필요한 카테고리)
          prisma.mainPost.count({
            where: {
              status: 'PUBLISHED',
              category: {
                requiresApproval: true,
              },
            },
          }),

          // 자유게시판 게시글 수
          prisma.mainPost.count({
            where: {
              status: 'PUBLISHED',
              category: {
                slug: 'free',
              },
            },
          }),

          // Q&A 게시글 수
          prisma.mainPost.count({
            where: {
              status: 'PUBLISHED',
              category: {
                slug: 'qna',
              },
            },
          }),
        ])

        return {
          stats: {
            totalUsers,
            weeklyPosts,
            weeklyComments,
            activeDiscussions,
            verifiedPosts,
            freePosts,
            qnaPosts,
          },
        }
      },
      REDIS_TTL.API_LONG / 2 // 30분 캐싱
    )

    return successResponse(cachedStats)
  } catch (error) {
    return handleError(error)
  }
}
