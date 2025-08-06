import { NextRequest } from 'next/server'
import { prisma } from '@/lib/core/prisma'
import { requireAuthAPI } from '@/lib/auth/session'
import { successResponse, errorResponse } from '@/lib/api/response'
import { handleError } from '@/lib/api/errors'
import { formatTimeAgo } from '@/lib/ui/date'
import { getCursorCondition, formatCursorResponse } from '@/lib/post/pagination'
import { mainPostSelect } from '@/lib/cache/patterns'
import { applyViewCountsToPosts } from '@/lib/post/viewcount'
import { redisCache, REDIS_TTL, generateCacheKey } from '@/lib/cache/redis'

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuthAPI()
    if (session instanceof Response) {
      return session
    }

    // 관리자 권한 확인
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { globalRole: true },
    })

    if (
      !user ||
      (user.globalRole !== 'ADMIN' && user.globalRole !== 'MANAGER')
    ) {
      return errorResponse('승인 권한이 없습니다.', 403)
    }

    // URL 파라미터 파싱
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const cursor = searchParams.get('cursor')

    // Redis 캐시 키 생성
    const cacheKey = generateCacheKey('main:posts:pending', {
      userId: session.user.id,
      limit,
      cursor: cursor || 'none',
    })

    // Redis 캐싱 적용 - 승인 대기 목록은 5분 캐싱
    const cachedData = await redisCache.getOrSet(
      cacheKey,
      async () => {
        const cursorCondition = getCursorCondition(cursor)

        // 승인 대기 게시글 조회 - 목록용 선택 패턴 사용
        const pendingPosts = await prisma.mainPost.findMany({
          where: {
            status: 'PENDING',
            ...cursorCondition,
          },
          select: {
            ...mainPostSelect.list, // 목록용 패턴 사용
            authorRole: true, // 작성자 역할 추가
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: limit + 1, // 다음 페이지 확인용
        })

        // 페이지네이션 처리
        const hasMore = pendingPosts.length > limit
        const posts = hasMore ? pendingPosts.slice(0, -1) : pendingPosts

        // Redis 조회수 통합 적용
        const postsWithViews = await applyViewCountsToPosts(posts, {
          debug: false,
          useMaxValue: true,
        })

        const formattedPosts = postsWithViews.map((post) => ({
          id: post.id,
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt,
          viewCount: post.viewCount, // Redis 통합 조회수
          createdAt: post.createdAt, // Date 객체 유지
          timeAgo: formatTimeAgo(post.createdAt),
          author: {
            id: post.author.id,
            name: post.author.name || 'Unknown',
            image: post.author.image || undefined,
          },
          authorRole: post.authorRole,
          category: post.category,
          tags: post.tags.map((t) => t.tag),
          _count: post._count,
        }))

        return formatCursorResponse(formattedPosts, limit)
      },
      REDIS_TTL.API_MEDIUM // 5분 캐싱
    )

    return successResponse(cachedData)
  } catch (error) {
    return handleError(error)
  }
}
