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
import { applyViewCountsToPosts } from '@/lib/common-viewcount-utils'

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

        // 표준화된 viewCount 적용 (Redis 통합)
        const postsWithUpdatedViews = await applyViewCountsToPosts(postList, {
          debug: false,
          useMaxValue: true,
        })

        // 주간 트렌딩 점수 계산 및 정렬
        const postsWithWeeklyScore = postsWithUpdatedViews
          .map((post) => {
            // 인기도 점수 계산: viewCount + (좋아요 * 2) + (댓글 * 1.5)
            const weeklyScore =
              post.viewCount + post.likeCount * 2 + post.commentCount * 1.5
            return {
              ...post,
              weeklyViews: post.viewCount, // 호환성을 위해 weeklyViews로도 제공
              weeklyScore,
            }
          })
          .filter((post) => post.weeklyScore > 5) // 최소 점수 기준
          .sort((a, b) => b.weeklyScore - a.weeklyScore)
          .slice(0, limit)

        // 응답 포맷팅
        const formattedPosts = postsWithWeeklyScore.map((post) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { weeklyScore, ...postData } = post
          return {
            ...postData,
            timeAgo: formatTimeAgo(post.createdAt),
            // 호환성을 위해 weeklyViews와 weeklyScore 모두 제공
            weeklyViews: post.weeklyViews,
            weeklyScore: post.weeklyScore,
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
