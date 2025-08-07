import { NextRequest } from 'next/server'
import { prisma } from '@/lib/core/prisma'
import { Prisma } from '@prisma/client'
import { successResponse } from '@/lib/api/response'
import { handleError } from '@/lib/api/errors'
import { mainPostSelect } from '@/lib/cache/patterns'
import { applyViewCountsAndSort } from '@/lib/post/viewcount'
import { redisCache, REDIS_TTL, generateCacheKey } from '@/lib/cache/redis'
import { formatTimeAgo } from '@/lib/ui/date'
import { formatMainPostForResponse } from '@/lib/post/display'
import { withRateLimiting } from '@/lib/security/compatibility'
import { ActionCategory } from '@/lib/security/actions'

async function searchPosts(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')
    const type = searchParams.get('type') || 'all'
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!query || query.trim().length === 0) {
      return successResponse({ results: [] })
    }

    // Redis 캐시 키 생성
    const cacheKey = generateCacheKey('main:posts:search', {
      query,
      type,
      limit,
    })

    // Redis 캐싱 적용 - 검색 결과는 5분 캐싱
    const cachedData = await redisCache.getOrSet(
      cacheKey,
      async () => {
        // 검색 조건 구성
        const where: Prisma.MainPostWhereInput = {
          status: 'PUBLISHED',
        }

        switch (type) {
          case 'title':
            where.title = {
              contains: query,
              mode: 'insensitive',
            }
            break

          case 'content':
            where.content = {
              contains: query,
              mode: 'insensitive',
            }
            break

          case 'tag':
            where.tags = {
              some: {
                tag: {
                  name: {
                    contains: query,
                    mode: 'insensitive',
                  },
                },
              },
            }
            break

          case 'all':
          default:
            where.OR = [
              {
                title: {
                  contains: query,
                  mode: 'insensitive',
                },
              },
              {
                content: {
                  contains: query,
                  mode: 'insensitive',
                },
              },
              {
                excerpt: {
                  contains: query,
                  mode: 'insensitive',
                },
              },
              {
                tags: {
                  some: {
                    tag: {
                      name: {
                        contains: query,
                        mode: 'insensitive',
                      },
                    },
                  },
                },
              },
              {
                category: {
                  name: {
                    contains: query,
                    mode: 'insensitive',
                  },
                },
              },
            ]
            break
        }

        // 검색 실행 - 표준화된 select 패턴 사용
        const results = await prisma.mainPost.findMany({
          where,
          take: limit,
          orderBy: [{ viewCount: 'desc' }, { createdAt: 'desc' }],
          select: mainPostSelect.list, // 목록용 패턴 사용
        })

        // Redis 조회수 적용 및 viewCount 기준 정렬
        const resultsWithViews = await applyViewCountsAndSort(
          results,
          'viewCount',
          {
            debug: false,
            useMaxValue: true,
          }
        )

        // 응답 데이터 형식화 - 통합 포맷터 사용
        const formattedResults = resultsWithViews.map((post) => {
          return formatMainPostForResponse({
            ...post,
            timeAgo: formatTimeAgo(post.createdAt),
          })
        })

        return { results: formattedResults }
      },
      REDIS_TTL.API_MEDIUM // 5분 캐싱
    )

    return successResponse(cachedData)
  } catch (error) {
    return handleError(error)
  }
}

// Rate Limiting 적용 - 검색은 리소스 집약적이므로 Rate Limiting 필요
export const GET = withRateLimiting(searchPosts, {
  action: ActionCategory.POST_READ,
  enablePatternDetection: true,
})
