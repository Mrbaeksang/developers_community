import { NextRequest } from 'next/server'
import { prisma } from '@/lib/core/prisma'
import { successResponse } from '@/lib/api/response'
import { handleError } from '@/lib/api/errors'
import { formatTimeAgo } from '@/lib/ui/date'
import { formatMainPostForResponse } from '@/lib/post/display'
import { redisCache, REDIS_TTL, generateCacheKey } from '@/lib/cache/redis'
import { getCursorCondition, formatCursorResponse } from '@/lib/post/pagination'
import { mainPostSelect } from '@/lib/cache/patterns'
import { applyViewCountsToPosts } from '@/lib/post/viewcount'

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

        // 주간 트렌딩 게시글 조회 - 표준화된 패턴 사용 (include만 사용)
        const posts = await prisma.mainPost.findMany({
          where: {
            status: 'PUBLISHED',
            ...(category && {
              category: { slug: category },
            }),
            ...cursorCondition,
          },
          select: mainPostSelect.list,
          orderBy: {
            createdAt: 'desc',
          },
          take: limit + 1, // 다음 페이지 확인용
        })

        // 페이지네이션 처리
        const hasMore = posts.length > limit
        const postList = hasMore ? posts.slice(0, -1) : posts

        // 1. 먼저 Redis 조회수를 적용
        const postsWithRedisViews = await applyViewCountsToPosts(postList, {
          debug: false,
          useMaxValue: true,
        })

        // 2. Redis가 적용된 viewCount로 주간 트렌딩 점수 계산
        const postsWithWeeklyScore = postsWithRedisViews.map((post) => {
          // 인기도 점수 계산: viewCount + (좋아요 * 2) + (댓글 * 1.5)
          const weeklyScore =
            post.viewCount + post.likeCount * 2 + post.commentCount * 1.5
          return {
            ...post,
            weeklyViews: post.viewCount, // 호환성을 위해 weeklyViews로도 제공
            weeklyScore,
          }
        })

        // 3. weeklyScore 기준으로 정렬
        const sortedPosts = postsWithWeeklyScore.sort(
          (a, b) => b.weeklyScore - a.weeklyScore
        )

        // 최소 점수 기준 필터링 및 limit 적용
        const filteredPosts = sortedPosts
          .filter((post) => post.weeklyScore > 5)
          .slice(0, limit)

        // 커서 응답 생성 (Date 객체 필요)
        const cursorResponse = formatCursorResponse(filteredPosts, limit)

        // 응답 포맷팅 - 통합 포맷터 사용
        const formattedItems = cursorResponse.items.map((post) => {
          return formatMainPostForResponse({
            ...post,
            timeAgo: formatTimeAgo(post.createdAt),
          })
        })

        return {
          ...cursorResponse,
          items: formattedItems,
        }
      },
      REDIS_TTL.API_MEDIUM // 2분 캐싱 (계산 비용은 높지만 자주 업데이트 필요)
    )

    return successResponse(cachedData)
  } catch (error) {
    return handleError(error)
  }
}
