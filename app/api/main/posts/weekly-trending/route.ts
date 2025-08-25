import { NextRequest } from 'next/server'
import { prisma } from '@/lib/core/prisma'
import { successResponse } from '@/lib/api/response'
import { handleError } from '@/lib/api/errors'
import { formatTimeAgo } from '@/lib/ui/date'
import { formatMainPostForResponse } from '@/lib/post/display'
import { redisCache, generateCacheKey } from '@/lib/cache/redis'
import { getCursorCondition } from '@/lib/post/pagination'
import { mainPostSelect } from '@/lib/cache/patterns'
import { applyViewCountsToPosts } from '@/lib/post/viewcount'
import { withRateLimiting } from '@/lib/security/compatibility'
import { ActionCategory } from '@/lib/security/actions'

async function getWeeklyTrending(request: NextRequest) {
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

    // Redis 캐싱 적용 - 주간 트렌딩은 1시간 캐싱 (Active CPU 절감)
    const cachedData = await redisCache.getOrSet(
      cacheKey,
      async () => {
        const cursorCondition = getCursorCondition(cursor)

        // 주간 트렌딩 게시글 조회 - 최근 7일간의 게시글 조회
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

        const posts = await prisma.mainPost.findMany({
          where: {
            status: 'PUBLISHED',
            createdAt: {
              gte: sevenDaysAgo, // 최근 7일간의 게시글만
            },
            ...(category && {
              category: { slug: category },
            }),
            ...cursorCondition,
          },
          select: mainPostSelect.list,
          orderBy: {
            viewCount: 'desc', // 일단 조회수 기준으로 가져오기 (DB 부하 감소)
          },
          take: 100, // 충분한 수의 게시글 가져오기
        })

        // 1. 먼저 Redis 조회수를 적용 (전체 게시글에 대해)
        const postsWithRedisViews = await applyViewCountsToPosts(posts, {
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

        // 최소 점수 기준 필터링 (너무 낮은 점수 제외) 및 limit 적용
        const filteredPosts = sortedPosts
          .filter((post) => post.weeklyScore >= 0) // 0점 이상 모두 포함 (조회수만 있어도 OK)
          .slice(0, limit)

        // 페이지네이션 정보 생성
        const hasMore = false // 주간 트렌딩은 페이지네이션 불필요
        const nextCursor = null

        const cursorResponse = {
          items: filteredPosts,
          hasMore,
          nextCursor,
        }

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
      3600 // 1시간 캐싱 (주간 트렌딩은 자주 변하지 않으므로 Active CPU 절감)
    )

    // 새로운 응답 형식에 맞춰서 반환
    return successResponse({
      posts: cachedData.items,
      hasMore: cachedData.hasMore,
      nextCursor: cachedData.nextCursor,
    })
  } catch (error) {
    return handleError(error)
  }
}

// Rate Limiting 적용 - 읽기 작업이지만 캐싱되므로 가벼운 rate limiting만 적용
export const GET = withRateLimiting(getWeeklyTrending, {
  action: ActionCategory.POST_READ,
})
