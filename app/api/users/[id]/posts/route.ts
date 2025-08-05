import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { redis } from '@/lib/redis'
import { errorResponse, paginatedResponse } from '@/lib/api-response'
import { handleError } from '@/lib/error-handler'
import { formatTimeAgo } from '@/lib/date-utils'
import { redisCache, REDIS_TTL, generateCacheKey } from '@/lib/redis-cache'

// 사용자별 게시글 목록 조회 - GET /api/users/[id]/posts
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const userId = resolvedParams.id
    const { searchParams } = new URL(request.url)

    // 쿼리 파라미터
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(
      50,
      Math.max(1, parseInt(searchParams.get('limit') || '10'))
    )
    const status = searchParams.get('status') as
      | 'PUBLISHED'
      | 'PENDING'
      | 'DRAFT'
      | null
    const categoryId = searchParams.get('categoryId')

    const skip = (page - 1) * limit

    // Redis 캐시 키 생성
    const cacheKey = generateCacheKey('user:posts', {
      userId,
      page,
      limit,
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

        // 게시글 목록 조회
        const [posts, totalCount] = await Promise.all([
          prisma.mainPost.findMany({
            where,
            include: {
              author: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                },
              },
              category: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  color: true,
                },
              },
              tags: {
                include: {
                  tag: {
                    select: {
                      id: true,
                      name: true,
                      slug: true,
                      color: true,
                    },
                  },
                },
              },
              _count: {
                select: {
                  comments: true,
                  likes: true,
                  bookmarks: true,
                },
              },
            },
            orderBy: {
              createdAt: 'desc',
            },
            skip,
            take: limit,
          }),
          prisma.mainPost.count({ where }),
        ])

        // 응답 데이터 형식화 및 Redis 조회수 포함
        const formattedPosts = await Promise.all(
          posts.map(async (post) => {
            // Redis에서 버퍼링된 조회수 가져오기
            let redisViews = 0
            const client = redis()
            if (client) {
              const bufferKey = `post:${post.id}:views`
              const bufferedViews = await client.get(bufferKey)
              redisViews = parseInt(bufferedViews || '0')
            }

            return {
              id: post.id,
              title: post.title,
              excerpt: post.excerpt,
              slug: post.slug,
              status: post.status,
              isPinned: post.isPinned,
              viewCount: post.viewCount + redisViews, // DB 조회수 + Redis 조회수
              likeCount: post.likeCount,
              commentCount: post.commentCount,
              createdAt: post.createdAt.toISOString(),
              updatedAt: post.updatedAt.toISOString(),
              approvedAt: post.approvedAt?.toISOString() || null,
              timeAgo: formatTimeAgo(post.createdAt),
              author: {
                id: post.author.id,
                name: post.author.name || 'Unknown',
                image: post.author.image || undefined,
              },
              category: {
                id: post.category.id,
                name: post.category.name,
                slug: post.category.slug,
                color: post.category.color,
              },
              tags: post.tags.map((tagRelation) => ({
                id: tagRelation.tag.id,
                name: tagRelation.tag.name,
                slug: tagRelation.tag.slug,
                color: tagRelation.tag.color,
              })),
              stats: {
                commentCount: post._count.comments,
                likeCount: post._count.likes,
                bookmarkCount: post._count.bookmarks,
              },
            }
          })
        )

        return { posts: formattedPosts, total: totalCount }
      },
      REDIS_TTL.API_SHORT * 3 // 3분 캐싱
    )

    if (!cachedData) {
      return errorResponse('사용자를 찾을 수 없습니다.', 404)
    }

    return paginatedResponse(cachedData.posts, page, limit, cachedData.total)
  } catch (error) {
    return handleError(error)
  }
}
