import { NextRequest } from 'next/server'
import { prisma } from '@/lib/core/prisma'
import { successResponse } from '@/lib/api/response'
import { handleError } from '@/lib/api/errors'
import { redisCache, REDIS_TTL, generateCacheKey } from '@/lib/cache/redis'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '5')

    // Redis 캐시 키 생성
    const cacheKey = generateCacheKey('communities:active', { limit })

    // Redis 캐싱 적용 - 활동 커뮤니티는 30분 캐싱
    const cachedData = await redisCache.getOrSet(
      cacheKey,
      async () => {
        // 최근 7일간 활동이 많은 커뮤니티 조회
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

        // 커뮤니티별 최근 활동 집계
        const activeCommunities = await prisma.community.findMany({
          where: {
            visibility: 'PUBLIC', // 공개 커뮤니티만
          },
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            avatar: true, // logo가 아니라 avatar
            banner: true, // coverImage가 아니라 banner
            memberCount: true,
            _count: {
              select: {
                members: true,
                posts: true,
              },
            },
            posts: {
              where: {
                createdAt: {
                  gte: sevenDaysAgo,
                },
              },
              select: {
                id: true,
              },
            },
          },
          orderBy: [
            {
              posts: {
                _count: 'desc',
              },
            },
            {
              memberCount: 'desc',
            },
          ],
          take: limit,
        })

        // 응답 데이터 포맷팅
        const formattedCommunities = activeCommunities.map((community) => ({
          id: community.id,
          name: community.name,
          slug: community.slug,
          description: community.description,
          logo: community.avatar, // avatar를 logo로 매핑
          memberCount: community.memberCount, // 직접 필드 사용
          totalPosts: community._count.posts,
          weeklyPosts: community.posts.length, // 최근 7일간 게시글 수
        }))

        return {
          communities: formattedCommunities,
          period: 'weekly',
        }
      },
      REDIS_TTL.API_MEDIUM * 6 // 30분 캐싱
    )

    return successResponse(cachedData)
  } catch (error) {
    return handleError(error)
  }
}
