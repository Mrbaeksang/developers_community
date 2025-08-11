import { NextRequest } from 'next/server'
import { prisma } from '@/lib/core/prisma'
import { requireRoleAPI } from '@/lib/auth/session'
import { paginatedResponse } from '@/lib/api/response'
import { handleError } from '@/lib/api/errors'
import { mainPostSelect } from '@/lib/cache/patterns'
import { applyViewCountsToPosts } from '@/lib/post/viewcount'
// Redis 캐싱 제거 - 관리자 페이지는 실시간성 우선
// import { redisCache, generateCacheKey } from '@/lib/cache/redis'
import { parseHybridPagination } from '@/lib/post/pagination'
import { formatTimeAgo } from '@/lib/ui/date'
import { PostStatus, Prisma } from '@prisma/client'

// 메인 게시글 목록 조회 (관리자용)
export async function GET(request: NextRequest) {
  try {
    const session = await requireRoleAPI(['ADMIN'])
    if (session instanceof Response) {
      return session
    }

    const searchParams = request.nextUrl.searchParams
    const pagination = parseHybridPagination(searchParams)
    const status = searchParams.get('status') // 상태별 필터링

    // 관리자 페이지는 실시간성이 중요하므로 캐싱 제거
    // Redis 캐싱 없이 직접 조회
    const cachedData = await (async () => {
      const where: Prisma.MainPostWhereInput = status
        ? { status: status as PostStatus }
        : {}

      // 게시글 조회 - 표준화된 select 패턴 사용
      const [posts, total] = await Promise.all([
        prisma.mainPost.findMany({
          where,
          orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
          select: {
            ...mainPostSelect.list,
            status: true, // 관리자용 추가 필드
            isPinned: true,
            authorRole: true,
            approvedAt: true,
          },
          skip: ((pagination.page ?? 1) - 1) * (pagination.limit ?? 20),
          take: pagination.limit ?? 20,
        }),
        prisma.mainPost.count({ where }),
      ])

      // Redis 조회수 통합 적용
      const postsWithViews = await applyViewCountsToPosts(posts, {
        debug: false,
        useMaxValue: true,
      })

      // 응답 데이터 형식화
      const formattedPosts = postsWithViews.map((post) => ({
        ...post,
        tags:
          'tags' in post &&
          Array.isArray((post as { tags: Array<{ tag: unknown }> }).tags)
            ? (post as { tags: Array<{ tag: unknown }> }).tags.map(
                (postTag) => postTag.tag
              )
            : [],
        createdAt: post.createdAt.toISOString(),
        timeAgo: formatTimeAgo(post.createdAt),
        approvedAt: post.approvedAt?.toISOString(),
      }))

      return { posts: formattedPosts, total }
    })()

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
