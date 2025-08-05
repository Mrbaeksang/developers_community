import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { redis } from '@/lib/redis'
import { requireAuthAPI } from '@/lib/auth-utils'
import { paginatedResponse, successResponse } from '@/lib/api-response'
import { handleError } from '@/lib/error-handler'
import { formatTimeAgo } from '@/lib/date-utils'
import { redisCache, REDIS_TTL, generateCacheKey } from '@/lib/redis-cache'
import {
  parseHybridPagination,
  getCursorTake,
  formatCursorResponse,
} from '@/lib/pagination-utils'
import { bookmarkSelect } from '@/lib/prisma-select-patterns'

// 내 북마크 목록 조회 - GET /api/users/bookmarks
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuthAPI()
    if (session instanceof Response) {
      return session
    }
    const userId = session.user.id

    const { searchParams } = new URL(request.url)

    // 하이브리드 페이지네이션 파싱
    const pagination = parseHybridPagination(searchParams)
    const categoryId = searchParams.get('categoryId')

    // Redis 캐시 키 생성 - 사용자별, 페이지별로 캐싱
    const cacheKey = generateCacheKey('user:bookmarks', {
      userId,
      ...pagination,
      categoryId: categoryId || 'all',
    })

    // Redis 캐싱 적용 - 북마크 목록은 3분 캐싱
    const cachedData = await redisCache.getOrSet(
      cacheKey,
      async () => {
        // 조건 설정
        const where = {
          userId,
          post: {
            status: 'PUBLISHED' as const,
            ...(categoryId && { categoryId }),
          },
        }

        // 커서 기반 페이지네이션
        if (pagination.type === 'cursor') {
          // 커서 조건은 bookmark의 createdAt을 기준으로 함
          const cursorCondition = pagination.cursor
            ? {
                createdAt: {
                  lt: new Date(pagination.cursor),
                },
              }
            : {}

          const cursorWhere = {
            ...where,
            ...cursorCondition,
          }

          const bookmarks = await prisma.mainBookmark.findMany({
            where: cursorWhere,
            select: bookmarkSelect.list,
            orderBy: {
              createdAt: 'desc',
            },
            take: getCursorTake(pagination.limit),
          })

          const totalCount = await prisma.mainBookmark.count({ where })
          const cursorResponse = formatCursorResponse(
            bookmarks,
            pagination.limit
          )

          // 응답 데이터 형식화 및 Redis 조회수 포함
          const formattedBookmarks = await Promise.all(
            cursorResponse.items.map(async (bookmark) => {
              // post 정보 추출
              const post = bookmark.post

              // Redis에서 버퍼링된 조회수 가져오기
              let redisViews = 0
              const client = redis()
              if (client && post) {
                const bufferKey = `post:${post.id}:views`
                const bufferedViews = await client.get(bufferKey)
                redisViews = parseInt(bufferedViews || '0')
              }

              return {
                bookmarkId: bookmark.id,
                bookmarkedAt: bookmark.createdAt.toISOString(),
                bookmarkedTimeAgo: formatTimeAgo(bookmark.createdAt),
                post: {
                  id: post.id,
                  title: post.title,
                  excerpt: post.excerpt,
                  slug: post.slug,
                  isPinned: post.isPinned,
                  viewCount: (post.viewCount || 0) + redisViews,
                  createdAt: post.createdAt.toISOString(),
                  timeAgo: formatTimeAgo(post.createdAt),
                  author: post.author,
                  category: post.category,
                  stats: {
                    commentCount: post._count.comments,
                    likeCount: post._count.likes,
                    bookmarkCount: post._count.bookmarks,
                  },
                },
              }
            })
          )

          return {
            items: formattedBookmarks,
            total: totalCount,
            nextCursor: cursorResponse.nextCursor,
            hasMore: cursorResponse.hasMore,
          }
        }
        // 기존 오프셋 기반 페이지네이션 (호환성)
        else {
          const skip = (pagination.page - 1) * pagination.limit

          // 북마크 목록 조회
          const [bookmarks, totalCount] = await Promise.all([
            prisma.mainBookmark.findMany({
              where,
              select: bookmarkSelect.list,
              orderBy: {
                createdAt: 'desc',
              },
              skip,
              take: pagination.limit,
            }),
            prisma.mainBookmark.count({ where }),
          ])

          // 응답 데이터 형식화 및 Redis 조회수 포함
          const formattedBookmarks = await Promise.all(
            bookmarks.map(async (bookmark) => {
              // post 정보 추출
              const post = bookmark.post

              // Redis에서 버퍼링된 조회수 가져오기
              let redisViews = 0
              const client = redis()
              if (client && post) {
                const bufferKey = `post:${post.id}:views`
                const bufferedViews = await client.get(bufferKey)
                redisViews = parseInt(bufferedViews || '0')
              }

              return {
                bookmarkId: bookmark.id,
                bookmarkedAt: bookmark.createdAt.toISOString(),
                bookmarkedTimeAgo: formatTimeAgo(bookmark.createdAt),
                post: {
                  id: post.id,
                  title: post.title,
                  excerpt: post.excerpt,
                  slug: post.slug,
                  isPinned: post.isPinned,
                  viewCount: (post.viewCount || 0) + redisViews,
                  createdAt: post.createdAt.toISOString(),
                  timeAgo: formatTimeAgo(post.createdAt),
                  author: post.author,
                  category: post.category,
                  stats: {
                    commentCount: post._count.comments,
                    likeCount: post._count.likes,
                    bookmarkCount: post._count.bookmarks,
                  },
                },
              }
            })
          )

          return {
            items: formattedBookmarks,
            totalCount,
          }
        }
      },
      REDIS_TTL.API_SHORT * 3 // 3분 캐싱
    )

    // 응답 생성
    if (pagination.type === 'cursor') {
      return successResponse(
        {
          items: cachedData.items,
          pagination: {
            limit: pagination.limit,
            nextCursor: cachedData.nextCursor,
            hasMore: cachedData.hasMore,
            total: cachedData.total,
          },
        },
        '북마크 목록을 조회했습니다.'
      )
    } else {
      return paginatedResponse(
        cachedData.items,
        pagination.page,
        pagination.limit,
        cachedData.totalCount || 0,
        '북마크 목록을 조회했습니다.'
      )
    }
  } catch (error) {
    return handleError(error)
  }
}
