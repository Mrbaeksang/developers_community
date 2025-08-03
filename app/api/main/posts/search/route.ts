import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { redis } from '@/lib/redis'
import { successResponse } from '@/lib/api-response'
import { handleError } from '@/lib/error-handler'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')
    const type = searchParams.get('type') || 'all'
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!query || query.trim().length === 0) {
      return successResponse({ results: [] })
    }

    // 검색 조건 구성
    const where: Prisma.MainPostWhereInput = {
      status: 'PUBLISHED',
    }

    switch (type) {
      case 'title':
        where.title = {
          contains: query,
          mode: 'insensitive',
        }
        break

      case 'content':
        where.content = {
          contains: query,
          mode: 'insensitive',
        }
        break

      case 'tag':
        where.tags = {
          some: {
            tag: {
              name: {
                contains: query,
                mode: 'insensitive',
              },
            },
          },
        }
        break

      case 'all':
      default:
        where.OR = [
          {
            title: {
              contains: query,
              mode: 'insensitive',
            },
          },
          {
            content: {
              contains: query,
              mode: 'insensitive',
            },
          },
          {
            excerpt: {
              contains: query,
              mode: 'insensitive',
            },
          },
          {
            tags: {
              some: {
                tag: {
                  name: {
                    contains: query,
                    mode: 'insensitive',
                  },
                },
              },
            },
          },
          {
            category: {
              name: {
                contains: query,
                mode: 'insensitive',
              },
            },
          },
        ]
        break
    }

    // 검색 실행
    const results = await prisma.mainPost.findMany({
      where,
      take: limit,
      orderBy: [{ viewCount: 'desc' }, { createdAt: 'desc' }],
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
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
              },
            },
          },
        },
        _count: {
          select: {
            comments: true,
            likes: true,
          },
        },
      },
    })

    // Redis에서 버퍼링된 조회수 포함
    const resultsWithRedisViews = await Promise.all(
      results.map(async (post) => {
        const bufferKey = `post:${post.id}:views`
        const bufferedViews = await redis().get(bufferKey)
        const redisViews = parseInt(bufferedViews || '0')

        return {
          ...post,
          viewCount: post.viewCount + redisViews, // DB 조회수 + Redis 조회수
          tags: post.tags.map((postTag) => postTag.tag),
        }
      })
    )

    return successResponse({ results: resultsWithRedisViews })
  } catch (error) {
    return handleError(error)
  }
}
