import { NextRequest } from 'next/server'
import { prisma } from '@/lib/core/prisma'
import { successResponse, errorResponse } from '@/lib/api/response'
import { handleError } from '@/lib/api/errors'
import { redisCache, REDIS_TTL, generateCacheKey } from '@/lib/cache/redis'
import { getCursorCondition } from '@/lib/post/pagination'
import { mainPostSelect } from '@/lib/cache/patterns'
import { applyViewCountsToPosts } from '@/lib/post/viewcount'

// GET /api/main/posts/[id]/related - 관련 게시글 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get('limit') || '5')
    const cursor = url.searchParams.get('cursor')

    // Redis 캐시 키 생성
    const cacheKey = generateCacheKey('main:post:related', {
      postId: id,
      limit,
      cursor: cursor || 'none',
    })

    // Redis 캐싱 적용 - 관련 게시글은 30분 캐싱
    const cachedData = await redisCache.getOrSet(
      cacheKey,
      async () => {
        // 현재 게시글 정보 가져오기 (태그 포함)
        const currentPost = await prisma.mainPost.findUnique({
          where: { id },
          select: {
            categoryId: true,
            tags: {
              select: {
                tagId: true,
              },
            },
          },
        })

        if (!currentPost) {
          return null
        }

        const tagIds = currentPost.tags.map((tag) => tag.tagId)
        const cursorCondition = getCursorCondition(cursor)

        // 관련 게시글 가져오기 - 표준화된 패턴 사용
        const relatedPosts = await prisma.mainPost.findMany({
          where: {
            id: { not: id }, // 현재 게시글 제외
            status: 'PUBLISHED',
            OR: [
              // 같은 태그를 가진 게시글
              {
                tags: {
                  some: {
                    tagId: {
                      in: tagIds,
                    },
                  },
                },
              },
              // 같은 카테고리의 게시글
              {
                categoryId: currentPost.categoryId,
              },
            ],
            ...cursorCondition,
          },
          select: mainPostSelect.list,
          orderBy: [
            {
              likeCount: 'desc',
            },
            {
              viewCount: 'desc',
            },
            {
              createdAt: 'desc',
            },
          ],
          take: limit + 1, // 다음 페이지 확인용
        })

        // 페이지네이션 처리
        const hasMore = relatedPosts.length > limit
        const posts = hasMore ? relatedPosts.slice(0, -1) : relatedPosts

        // 중복 제거
        const uniquePosts = Array.from(
          new Map(posts.map((post) => [post.id, post])).values()
        )

        // 표준화된 viewCount 적용 (Redis 통합)
        const postsWithUpdatedViews = await applyViewCountsToPosts(
          uniquePosts,
          {
            debug: false,
            useMaxValue: true,
          }
        )

        // 관련도 점수 계산 및 정렬
        const scoredPosts = postsWithUpdatedViews.map((post) => {
          const daysSinceCreated = Math.floor(
            (Date.now() - new Date(post.createdAt).getTime()) /
              (1000 * 60 * 60 * 24)
          )
          const recencyScore = Math.max(0, 30 - daysSinceCreated) // 30일 이내 게시글에 가산점
          const score = post.viewCount + post.likeCount * 2 + recencyScore * 0.5

          return {
            ...post,
            score,
          }
        })

        const sortedPosts = scoredPosts
          .sort((a, b) => b.score - a.score)
          .map((post) => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { score, ...postWithoutScore } = post
            return postWithoutScore
          }) // score 필드 제거

        return {
          posts: sortedPosts.slice(0, limit),
          nextCursor:
            hasMore && sortedPosts.length > 0
              ? sortedPosts[sortedPosts.length - 1].createdAt.toISOString()
              : null,
          hasMore,
        }
      },
      REDIS_TTL.API_LONG / 2 // 30분 캐싱
    )

    if (!cachedData) {
      return errorResponse('Post not found', 404)
    }

    return successResponse(cachedData)
  } catch (error) {
    return handleError(error)
  }
}
