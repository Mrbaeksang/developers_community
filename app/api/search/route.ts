import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { successResponse, validationErrorResponse } from '@/lib/api-response'
import { handleError } from '@/lib/error-handler'

// 검색 스키마
const searchSchema = z.object({
  q: z.string().min(1).max(100),
  type: z
    .enum(['all', 'posts', 'users', 'communities'])
    .optional()
    .default('all'),
  limit: z.coerce.number().min(1).max(50).optional().default(10),
})

// GET: 통합 검색
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const validatedParams = searchSchema.parse({
      q: searchParams.get('q'),
      type: searchParams.get('type') || 'all',
      limit: searchParams.get('limit') || '10',
    })

    const { q, type, limit } = validatedParams

    // 검색 결과 타입 정의
    type SearchPost = {
      id: string
      title: string
      content: string
      excerpt?: string | null
      createdAt: Date
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
      const [mainPosts, communityPosts] = await Promise.all([
        // 메인 게시글 검색
        prisma.mainPost.findMany({
          where: {
            status: 'PUBLISHED',
            OR: [
              { title: { contains: q, mode: 'insensitive' } },
              { content: { contains: q, mode: 'insensitive' } },
            ],
          },
          include: {
            author: {
              select: {
                id: true,
                name: true,
                username: true,
                image: true,
              },
            },
            category: true,
            _count: {
              select: {
                comments: true,
                likes: true,
              },
            },
          },
          take: limit,
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
          },
          include: {
            author: {
              select: {
                id: true,
                name: true,
                username: true,
                image: true,
              },
            },
            community: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
            _count: {
              select: {
                comments: true,
                likes: true,
              },
            },
          },
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
      ])

      results.posts = [
        ...mainPosts.map((post) => ({
          ...post,
          type: 'main' as const,
          url: `/main/posts/${post.id}`,
        })),
        ...communityPosts.map((post) => ({
          ...post,
          type: 'community' as const,
          url: `/communities/${post.community.id}/posts/${post.id}`,
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

    // 결과 요약
    const totalResults =
      results.posts.length + results.users.length + results.communities.length

    return successResponse({
      query: q,
      type,
      totalResults,
      results,
    })
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
