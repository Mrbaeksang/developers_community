import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse } from '@/lib/api-response'
import { handleError } from '@/lib/error-handler'
import { formatTimeAgo } from '@/lib/date-utils'
import { redisCache, REDIS_TTL, generateCacheKey } from '@/lib/redis-cache'
import {
  getCursorCondition,
  formatCursorResponse,
} from '@/lib/pagination-utils'
import { mainPostSelect } from '@/lib/prisma-select-patterns'
import { getBatchWeeklyViewCounts } from '@/lib/db/query-helpers'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '10')
    const cursor = searchParams.get('cursor')
    const category = searchParams.get('category') // 특정 카테고리만 조회

    // Redis 캐시 키 생성
    const cacheKey = generateCacheKey('main:posts:weekly-trending', {
      limit,
      cursor: cursor || 'none',
      category: category || 'all',
    })

    // Redis 캐싱 적용 - 주간 트렌딩은 30분 캐싱
    const cachedData = await redisCache.getOrSet(
      cacheKey,
      async () => {
        const cursorCondition = getCursorCondition(cursor)

        // 주간 트렌딩 게시글 조회 - 선택적 필드 로딩 적용
        const posts = await prisma.mainPost.findMany({
          where: {
            status: 'PUBLISHED',
            ...(category && {
              category: { slug: category },
            }),
            ...cursorCondition,
          },
          select: {
            ...mainPostSelect.list,
            likeCount: true,
            commentCount: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: limit + 1, // 다음 페이지 확인용
        })

        // 페이지네이션 처리
        const hasMore = posts.length > limit
        const postList = hasMore ? posts.slice(0, -1) : posts

        // 게시글 ID 목록 추출
        const postIds = postList.map((p) => p.id)

        // 주간 조회수 배치 조회
        const weeklyViewsMap =
          postIds.length > 0
            ? await getBatchWeeklyViewCounts(postIds)
            : new Map<string, number>()

        // 주간 조회수로 필터링 및 정렬
        const postsWithWeeklyViews = postList
          .map((post) => ({
            ...post,
            weeklyViews: weeklyViewsMap.get(post.id) || 0,
          }))
          .filter((post) => post.weeklyViews > 0) // 주간 조회수가 있는 것만
          .sort((a, b) => {
            // 인기도 점수 계산: 주간 조회수 + (좋아요 * 2) + (댓글 * 1.5)
            const scoreA =
              a.weeklyViews + a.likeCount * 2 + a.commentCount * 1.5
            const scoreB =
              b.weeklyViews + b.likeCount * 2 + b.commentCount * 1.5
            return scoreB - scoreA
          })
          .slice(0, limit)

        // 응답 포맷팅
        const formattedPosts = postsWithWeeklyViews.map((post) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { likeCount, commentCount, weeklyViews, ...postData } = post
          return {
            ...postData,
            timeAgo: formatTimeAgo(post.createdAt),
            weeklyViews,
          }
        })

        return formatCursorResponse(formattedPosts, limit)
      },
      REDIS_TTL.API_LONG / 2 // 30분 캐싱
    )

    return successResponse(cachedData)
  } catch (error) {
    return handleError(error)
  }
}
