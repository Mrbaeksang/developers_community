import { prisma } from '@/lib/prisma'
import { successResponse } from '@/lib/api-response'
import { handleError } from '@/lib/error-handler'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '5')

    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    // 이번 주에 가장 많은 게시글을 작성한 사용자 조회
    const activeUsers = await prisma.user.findMany({
      where: {
        mainPosts: {
          some: {
            createdAt: {
              gte: weekAgo,
            },
          },
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        _count: {
          select: {
            mainPosts: {
              where: {
                createdAt: {
                  gte: weekAgo,
                },
              },
            },
          },
        },
      },
      orderBy: {
        mainPosts: {
          _count: 'desc',
        },
      },
      take: limit,
    })

    return successResponse({
      users: activeUsers.map((user) => ({
        id: user.id,
        name: user.name || user.email?.split('@')[0] || 'Unknown',
        image: user.image,
        postCount: user._count.mainPosts,
      })),
    })
  } catch (error) {
    return handleError(error)
  }
}
