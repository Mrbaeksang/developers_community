import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { redis } from '@/lib/redis'
import { successResponse, errorResponse } from '@/lib/api-response'
import { handleError } from '@/lib/error-handler'
import { redisCache, REDIS_TTL, generateCacheKey } from '@/lib/redis-cache'
import {
  getCursorCondition,
  formatCursorResponse,
} from '@/lib/pagination-utils'
import { mainPostSelect } from '@/lib/prisma-select-patterns'

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

        // 관련 게시글 가져오기 - 선택적 필드 로딩 적용
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
          select: {
            ...mainPostSelect.list,
            // 추가 필드 (관련성 계산용)
            likeCount: true,
            commentCount: true,
          },
          orderBy: [
            // 점수 계산: viewCount + (likeCount * 2) + 최신성
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

        // 중복 제거 및 점수 기반 정렬
        const uniquePosts = Array.from(
          new Map(posts.map((post) => [post.id, post])).values()
        )

        // 점수 계산 및 재정렬 (Redis 조회수 포함)
        const scoredPosts = await Promise.all(
          uniquePosts.map(async (post) => {
            // Redis에서 버퍼링된 조회수 가져오기
            let totalViewCount = post.viewCount
            const client = redis()
            if (client) {
              const bufferKey = `post:${post.id}:views`
              const bufferedViews = await client.get(bufferKey)
              const redisViews = parseInt(bufferedViews || '0')
              totalViewCount = post.viewCount + redisViews
            }

            const daysSinceCreated = Math.floor(
              (Date.now() - new Date(post.createdAt).getTime()) /
                (1000 * 60 * 60 * 24)
            )
            const recencyScore = Math.max(0, 30 - daysSinceCreated) // 30일 이내 게시글에 가산점
            const score =
              totalViewCount + post.likeCount * 2 + recencyScore * 0.5

            return {
              ...post,
              viewCount: totalViewCount, // Redis 조회수가 포함된 총 조회수
              score,
            }
          })
        )

        const sortedPosts = scoredPosts
          .sort((a, b) => b.score - a.score)
          .map((post) => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { score, likeCount, commentCount, ...postWithoutScore } = post
            return postWithoutScore
          }) // score, likeCount, commentCount 필드 제거

        return formatCursorResponse(sortedPosts, limit)
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
