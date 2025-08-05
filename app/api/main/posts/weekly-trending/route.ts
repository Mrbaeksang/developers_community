import { NextRequest } from 'next/server'
import { markdownToHtml } from '@/lib/markdown'
import { successResponse } from '@/lib/api-response'
import { handleError } from '@/lib/error-handler'
import { formatTimeAgo } from '@/lib/date-utils'
import { getCachedTrendingPosts } from '@/lib/db/query-cache'
import { redisCache, REDIS_TTL, generateCacheKey } from '@/lib/redis-cache'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '10')
    const category = searchParams.get('category') // 특정 카테고리만 조회

    // Redis 캐시 키 생성
    const cacheKey = generateCacheKey('main:posts:weekly-trending', {
      limit,
      category: category || 'all',
    })

    // Redis 캐싱 적용 - 주간 트렌딩은 30분 캐싱
    const cachedData = await redisCache.getOrSet(
      cacheKey,
      async () => {
        // 캐시된 트렌딩 게시글 조회
        const trendingPosts = await getCachedTrendingPosts({
          limit,
          category,
          days: 7,
        })

        // 게시글 데이터 포맷팅 (이미 정렬되고 필터링됨)
        const formattedPosts = trendingPosts.map((post) => ({
          ...post,
          content: markdownToHtml(post.content),
          createdAt: new Date(post.createdAt).toISOString(),
          updatedAt: new Date(post.updatedAt).toISOString(),
          timeAgo: formatTimeAgo(new Date(post.createdAt)),
        }))

        return {
          posts: formattedPosts,
          period: 'weekly',
        }
      },
      REDIS_TTL.API_LONG / 2 // 30분 캐싱
    )

    return successResponse(cachedData)
  } catch (error) {
    return handleError(error)
  }
}
