import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  errorResponse,
  paginatedResponse,
  successResponse,
} from '@/lib/api-response'
import { handleError } from '@/lib/error-handler'
import { formatTimeAgo } from '@/lib/date-utils'
import { redisCache, REDIS_TTL, generateCacheKey } from '@/lib/redis-cache'
import {
  parseHybridPagination,
  getCursorCondition,
  getCursorTake,
  formatCursorResponse,
} from '@/lib/pagination-utils'
import { mainPostSelect } from '@/lib/prisma-select-patterns'
import { applyViewCountsToPosts } from '@/lib/common-viewcount-utils'

// 사용자별 게시글 목록 조회 - GET /api/users/[id]/posts
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const userId = resolvedParams.id
    const { searchParams } = new URL(request.url)

    // 하이브리드 페이지네이션 파싱
    const pagination = parseHybridPagination(searchParams)
    const status = searchParams.get('status') as
      | 'PUBLISHED'
      | 'PENDING'
      | 'DRAFT'
      | null
    const categoryId = searchParams.get('categoryId')

    // Redis 캐시 키 생성
    const cacheKey = generateCacheKey('user:posts', {
      userId,
      ...pagination,
      status,
      categoryId,
    })

    // Redis 캐싱 적용 - 사용자별 게시글은 3분 캐싱
    const cachedData = await redisCache.getOrSet(
      cacheKey,
      async () => {
        // 사용자 존재 확인
        const userExists = await prisma.user.findUnique({
          where: {
            id: userId,
            isActive: true,
            isBanned: false,
          },
          select: { id: true },
        })

        if (!userExists) {
          return null
        }

        // 조건 설정
        const where = {
          authorId: userId,
          ...(status && { status }),
          ...(categoryId && { categoryId }),
        }

        // 커서 기반 페이지네이션
        if (pagination.type === 'cursor') {
          const cursorWhere = {
            ...where,
            ...getCursorCondition(pagination.cursor),
          }

          const posts = await prisma.mainPost.findMany({
            where: cursorWhere,
            select: mainPostSelect.list,
            orderBy: {
              createdAt: 'desc',
            },
            take: getCursorTake(pagination.limit),
          })

          const totalCount = await prisma.mainPost.count({ where })
          const cursorResponse = formatCursorResponse(posts, pagination.limit)

          // 표준화된 viewCount 적용 (Redis 통합)
          const postsWithUpdatedViews = await applyViewCountsToPosts(
            cursorResponse.items,
            { debug: false, useMaxValue: true }
          )

          // 응답 데이터 형식화
          const formattedPosts = postsWithUpdatedViews.map((post) => ({
            ...post,
            createdAt: post.createdAt.toISOString(),
            timeAgo: formatTimeAgo(post.createdAt),
          }))

          return {
            posts: formattedPosts,
            total: totalCount,
            nextCursor: cursorResponse.nextCursor,
            hasMore: cursorResponse.hasMore,
          }
        }
        // 기존 오프셋 기반 페이지네이션 (호환성)
        else {
          const skip = (pagination.page - 1) * pagination.limit

          // 게시글 목록 조회
          const [posts, totalCount] = await Promise.all([
            prisma.mainPost.findMany({
              where,
              select: mainPostSelect.list,
              orderBy: {
                createdAt: 'desc',
              },
              skip,
              take: pagination.limit,
            }),
            prisma.mainPost.count({ where }),
          ])

          // 표준화된 viewCount 적용 (Redis 통합)
          const postsWithUpdatedViews = await applyViewCountsToPosts(posts, {
            debug: false,
            useMaxValue: true,
          })

          // 응답 데이터 형식화
          const formattedPosts = postsWithUpdatedViews.map((post) => ({
            ...post,
            createdAt: post.createdAt.toISOString(),
            timeAgo: formatTimeAgo(post.createdAt),
          }))

          return { posts: formattedPosts, total: totalCount }
        }
      },
      REDIS_TTL.API_SHORT * 3 // 3분 캐싱
    )

    if (!cachedData) {
      return errorResponse('사용자를 찾을 수 없습니다.', 404)
    }

    // 응답 생성
    if (pagination.type === 'cursor') {
      return successResponse({
        items: cachedData.posts,
        pagination: {
          limit: pagination.limit,
          nextCursor: cachedData.nextCursor,
          hasMore: cachedData.hasMore,
          total: cachedData.total,
        },
      })
    } else {
      return paginatedResponse(
        cachedData.posts,
        pagination.page,
        pagination.limit,
        cachedData.total
      )
    }
  } catch (error) {
    return handleError(error)
  }
}
