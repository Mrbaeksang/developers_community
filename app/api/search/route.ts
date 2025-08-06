import { NextRequest } from 'next/server'
import { prisma } from '@/lib/core/prisma'
import { z } from 'zod'
import { successResponse, validationErrorResponse } from '@/lib/api/response'
import { handleError } from '@/lib/api/errors'
import { redisCache, REDIS_TTL, generateCacheKey } from '@/lib/cache/redis'
import { mainPostSelect, communityPostSelect } from '@/lib/cache/patterns'
import { applyViewCountsToPosts } from '@/lib/post/viewcount'

// 검색 스키마
const searchSchema = z.object({
  q: z.string().min(1).max(100),
  type: z
    .enum(['all', 'posts', 'users', 'communities'])
    .optional()
    .default('all'),
  limit: z.coerce.number().min(1).max(50).optional().default(10),
  cursor: z.string().optional(), // 커서 페이지네이션 추가
})

// GET: 통합 검색
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const validatedParams = searchSchema.parse({
      q: searchParams.get('q'),
      type: searchParams.get('type') || 'all',
      limit: searchParams.get('limit') || '10',
      cursor: searchParams.get('cursor'),
    })

    const { q, type, limit, cursor } = validatedParams

    // Redis 캐시 키 생성
    const cacheKey = generateCacheKey('search:results', {
      q,
      type,
      limit,
      cursor: cursor || 'none',
    })

    // Redis 캐싱 적용 - 검색 결과는 5분 캐싱
    const cachedResults = await redisCache.getOrSet(
      cacheKey,
      async () => {
        // 검색 결과 타입 정의
        type SearchPost = {
          id: string
          title: string
          content: string
          excerpt?: string | null
          createdAt: Date
          viewCount: number // Redis 통합 조회수 추가
          type: 'main' | 'community'
          url: string
          author: {
            id: string
            name: string | null
            username: string | null
            image: string | null
          }
          category?: {
            id: string
            name: string
            slug: string
          }
          community?: {
            id: string
            name: string
            slug: string
          }
          _count: {
            comments: number
            likes: number
          }
        }

        type SearchUser = {
          id: string
          name: string | null
          username: string | null
          email: string
          image: string | null
          bio: string | null
          url: string
          postCount: number
          _count: {
            mainPosts: number
            communityPosts: number
          }
        }

        type SearchCommunity = {
          id: string
          name: string
          slug: string
          description: string | null
          avatar: string | null
          visibility: string
          memberCount: number
          postCount: number
          url: string
          _count: {
            members: number
            posts: number
          }
        }

        const results: {
          posts: SearchPost[]
          users: SearchUser[]
          communities: SearchCommunity[]
        } = {
          posts: [],
          users: [],
          communities: [],
        }

        // 게시글 검색 (메인 + 커뮤니티)
        if (type === 'all' || type === 'posts') {
          // 커서 기반 페이지네이션을 위한 날짜 파싱
          const cursorDate = cursor ? new Date(cursor) : null

          const [mainPosts, communityPosts] = await Promise.all([
            // 메인 게시글 검색
            prisma.mainPost.findMany({
              where: {
                status: 'PUBLISHED',
                OR: [
                  { title: { contains: q, mode: 'insensitive' } },
                  { content: { contains: q, mode: 'insensitive' } },
                ],
                ...(cursorDate ? { createdAt: { lt: cursorDate } } : {}),
              },
              select: mainPostSelect.list,
              take: Math.ceil(limit / 2), // 반씩 나눠서 가져오기
              orderBy: { createdAt: 'desc' },
            }),
            // 커뮤니티 게시글 검색
            prisma.communityPost.findMany({
              where: {
                status: 'PUBLISHED',
                OR: [
                  { title: { contains: q, mode: 'insensitive' } },
                  { content: { contains: q, mode: 'insensitive' } },
                ],
                ...(cursorDate ? { createdAt: { lt: cursorDate } } : {}),
              },
              select: {
                ...communityPostSelect.list,
                community: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                  },
                },
              },
              take: Math.ceil(limit / 2), // 반씩 나눠서 가져오기
              orderBy: { createdAt: 'desc' },
            }),
          ])

          // Redis viewCount 적용
          const mainPostsWithViews = await applyViewCountsToPosts(mainPosts, {
            debug: false,
            useMaxValue: true,
          })

          const communityPostsWithViews = await applyViewCountsToPosts(
            communityPosts,
            {
              debug: false,
              useMaxValue: true,
            }
          )

          results.posts = [
            ...mainPostsWithViews.map((post) => ({
              id: post.id,
              title: post.title,
              content: post.content,
              excerpt: post.excerpt,
              createdAt: post.createdAt,
              viewCount: post.viewCount, // Redis 통합 조회수 포함
              type: 'main' as const,
              url: `/main/posts/${post.id}`,
              author: post.author,
              category: post.category,
              _count: post._count,
            })),
            ...communityPostsWithViews.map((post) => ({
              id: post.id,
              title: post.title,
              content: post.content,
              excerpt: null,
              createdAt: post.createdAt,
              viewCount: post.viewCount, // Redis 통합 조회수 포함
              type: 'community' as const,
              url: `/communities/${post.community.id}/posts/${post.id}`,
              author: post.author,
              category: post.category || undefined,
              community: post.community,
              _count: post._count,
            })),
          ]
        }

        // 사용자 검색
        if (type === 'all' || type === 'users') {
          const users = await prisma.user.findMany({
            where: {
              isActive: true,
              isBanned: false,
              OR: [
                { name: { contains: q, mode: 'insensitive' } },
                { username: { contains: q, mode: 'insensitive' } },
                { email: { contains: q, mode: 'insensitive' } },
              ],
            },
            select: {
              id: true,
              name: true,
              username: true,
              email: true,
              image: true,
              bio: true,
              _count: {
                select: {
                  mainPosts: true,
                  communityPosts: true,
                },
              },
            },
            take: limit,
          })

          results.users = users.map((user) => ({
            ...user,
            url: `/profile/${user.id}`,
            postCount: user._count.mainPosts + user._count.communityPosts,
          }))
        }

        // 커뮤니티 검색
        if (type === 'all' || type === 'communities') {
          const communities = await prisma.community.findMany({
            where: {
              OR: [
                { name: { contains: q, mode: 'insensitive' } },
                { description: { contains: q, mode: 'insensitive' } },
              ],
            },
            select: {
              id: true,
              name: true,
              slug: true,
              description: true,
              avatar: true,
              visibility: true,
              memberCount: true,
              postCount: true,
              _count: {
                select: {
                  members: true,
                  posts: true,
                },
              },
            },
            take: limit,
            orderBy: { memberCount: 'desc' },
          })

          results.communities = communities.map((community) => ({
            ...community,
            url: `/communities/${community.id}`,
          }))
        }

        // 결과 정렬 (createdAt 기준)
        results.posts.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )

        // 상위 limit개만 선택
        const limitedPosts = results.posts.slice(0, limit)
        const hasMorePosts = results.posts.length > limit

        // 다음 커서 생성 (가장 오래된 게시글의 createdAt)
        let nextCursor: string | null = null
        if (hasMorePosts && limitedPosts.length > 0) {
          const lastPost = limitedPosts[limitedPosts.length - 1]
          nextCursor = lastPost.createdAt.toISOString()
        }

        // 결과 요약
        const totalResults =
          limitedPosts.length +
          results.users.length +
          results.communities.length

        return {
          query: q,
          type,
          totalResults,
          results: {
            posts: limitedPosts,
            users: results.users,
            communities: results.communities,
          },
          pagination: {
            nextCursor,
            hasMore: hasMorePosts,
          },
        }
      },
      REDIS_TTL.API_MEDIUM // 5분 캐싱
    )

    return successResponse(cachedResults)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string[]> = {}
      error.issues.forEach((issue) => {
        const field = issue.path.join('.')
        if (!errors[field]) {
          errors[field] = []
        }
        errors[field].push(issue.message)
      })
      return validationErrorResponse(errors)
    }
    return handleError(error)
  }
}
