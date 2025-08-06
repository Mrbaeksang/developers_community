import { auth } from '@/auth'
import { prisma } from '@/lib/core/prisma'
import { successResponse, errorResponse } from '@/lib/api/response'
import { handleError } from '@/lib/api/errors'
import { redisCache, REDIS_TTL, generateCacheKey } from '@/lib/cache/redis'

// 내 활동 통계 조회 - GET /api/users/stats
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return errorResponse('로그인이 필요합니다.', 401)
    }

    const userId = session.user.id

    // Redis 캐시 키 생성 - 사용자별로 다른 캐시
    const cacheKey = generateCacheKey('user:stats', { userId })

    // Redis 캐싱 적용 - 사용자 통계는 10분 캐싱
    const cachedStats = await redisCache.getOrSet(
      cacheKey,
      async () => {
        // 기본 통계 조회
        const [
          totalPosts,
          publishedPosts,
          pendingPosts,
          totalComments,
          totalLikes,
          totalBookmarks,
          receivedLikes,
          recentActivity,
        ] = await Promise.all([
          // 전체 게시글 수
          prisma.mainPost.count({
            where: { authorId: userId },
          }),
          // 게시된 게시글 수
          prisma.mainPost.count({
            where: {
              authorId: userId,
              status: 'PUBLISHED',
            },
          }),
          // 승인 대기 게시글 수
          prisma.mainPost.count({
            where: {
              authorId: userId,
              status: 'PENDING',
            },
          }),
          // 총 댓글 수
          prisma.mainComment.count({
            where: { authorId: userId },
          }),
          // 누른 좋아요 수
          prisma.mainLike.count({
            where: { userId },
          }),
          // 북마크 수
          prisma.mainBookmark.count({
            where: { userId },
          }),
          // 받은 좋아요 수 (내 게시글에 대한)
          prisma.mainLike.count({
            where: {
              post: {
                authorId: userId,
              },
            },
          }),
          // 최근 7일간 활동
          prisma.mainPost.count({
            where: {
              authorId: userId,
              createdAt: {
                gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
              },
            },
          }),
        ])

        // 카테고리별 게시글 분포 - 최적화된 쿼리
        const postsByCategory = await prisma.mainPost.groupBy({
          by: ['categoryId'],
          where: {
            authorId: userId,
            status: 'PUBLISHED',
          },
          _count: {
            id: true,
          },
        })

        // 카테고리 정보 배치 조회 (N+1 문제 해결)
        const categoryIds = postsByCategory
          .map((stat) => stat.categoryId)
          .filter(Boolean)
        const categories = await prisma.mainCategory.findMany({
          where: { id: { in: categoryIds } },
          select: {
            id: true,
            name: true,
            slug: true,
            color: true,
          },
        })

        const categoryMap = new Map(categories.map((cat) => [cat.id, cat]))
        const categoryStats = postsByCategory
          .filter((stat) => stat.categoryId !== null)
          .map((stat) => ({
            category: categoryMap.get(stat.categoryId),
            postCount: stat._count.id,
          }))
          .filter((stat) => stat.category !== undefined)

        // 월별 게시글 작성 통계 (최근 6개월)
        const sixMonthsAgo = new Date()
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

        const monthlyPosts = await prisma.mainPost.groupBy({
          by: ['createdAt'],
          where: {
            authorId: userId,
            status: 'PUBLISHED',
            createdAt: {
              gte: sixMonthsAgo,
            },
          },
          _count: {
            id: true,
          },
        })

        // 월별 데이터 정리
        const monthlyStats = monthlyPosts.reduce(
          (acc: Record<string, number>, post) => {
            const month = post.createdAt.toISOString().slice(0, 7) // YYYY-MM
            acc[month] = (acc[month] || 0) + post._count.id
            return acc
          },
          {}
        )

        return {
          stats: {
            posts: {
              total: totalPosts,
              published: publishedPosts,
              pending: pendingPosts,
              draft: totalPosts - publishedPosts - pendingPosts,
            },
            engagement: {
              comments: totalComments,
              likes: totalLikes,
              bookmarks: totalBookmarks,
              receivedLikes,
            },
            activity: {
              recentPosts: recentActivity,
              categoryDistribution: categoryStats,
              monthlyPosts: monthlyStats,
            },
          },
        }
      },
      REDIS_TTL.API_MEDIUM * 2 // 10분 캐싱
    )

    return successResponse(cachedStats)
  } catch (error) {
    return handleError(error)
  }
}
