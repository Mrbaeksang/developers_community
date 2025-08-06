import { NextRequest } from 'next/server'
import { prisma } from '@/lib/core/prisma'
import { requireRoleAPI } from '@/lib/auth/session'
import { paginatedResponse } from '@/lib/api/response'
import { handleError } from '@/lib/api/errors'
import { communityPostSelect } from '@/lib/cache/patterns'
import { applyViewCountsToPosts } from '@/lib/post/viewcount'
import { redisCache, REDIS_TTL, generateCacheKey } from '@/lib/cache/redis'
import { parseHybridPagination } from '@/lib/post/pagination'
import { formatTimeAgo } from '@/lib/ui/date'
import { PostStatus, Prisma } from '@prisma/client'

// 커뮤니티 게시글 목록 조회 (관리자용)
export async function GET(request: NextRequest) {
  try {
    const session = await requireRoleAPI(['ADMIN'])
    if (session instanceof Response) {
      return session
    }

    const searchParams = request.nextUrl.searchParams
    const pagination = parseHybridPagination(searchParams)
    const status = searchParams.get('status') // 상태별 필터링
    const communityId = searchParams.get('communityId') // 커뮤니티별 필터링

    // Redis 캐시 키 생성
    const cacheKey = generateCacheKey('admin:community:posts', {
      ...pagination,
      status,
      communityId,
    })

    // Redis 캐싱 적용 - 관리자 목록은 3분 캐싱
    const cachedData = await redisCache.getOrSet(
      cacheKey,
      async () => {
        const where: Prisma.CommunityPostWhereInput = {}
        if (status) where.status = status as PostStatus
        if (communityId) where.communityId = communityId

        // 게시글 조회 - 표준화된 select 패턴 사용
        const [posts, total] = await Promise.all([
          prisma.communityPost.findMany({
            where,
            orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
            select: {
              ...communityPostSelect.list,
              status: true, // 관리자용 추가 필드
              isPinned: true,
              community: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
            },
            skip: ((pagination.page ?? 1) - 1) * (pagination.limit ?? 20),
            take: pagination.limit ?? 20,
          }),
          prisma.communityPost.count({ where }),
        ])

        // Redis 조회수 통합 적용
        const postsWithViews = await applyViewCountsToPosts(posts, {
          debug: false,
          useMaxValue: true,
        })

        // 응답 데이터 형식화
        const formattedPosts = postsWithViews.map((post) => ({
          ...post,
          createdAt: post.createdAt.toISOString(),
          timeAgo: formatTimeAgo(post.createdAt),
        }))

        return { posts: formattedPosts, total }
      },
      REDIS_TTL.API_SHORT * 3 // 3분 캐싱
    )

    return paginatedResponse(
      cachedData.posts,
      pagination.page ?? 1,
      pagination.limit ?? 20,
      cachedData.total
    )
  } catch (error) {
    return handleError(error)
  }
}
