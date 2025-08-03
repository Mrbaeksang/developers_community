import { prisma } from '@/lib/prisma'
import { requireAuthAPI } from '@/lib/auth-utils'
import { successResponse, errorResponse } from '@/lib/api-response'
import { handleError } from '@/lib/error-handler'
import { formatTimeAgo } from '@/lib/date-utils'

export async function GET() {
  try {
    const session = await requireAuthAPI()
    if (session instanceof Response) {
      return session
    }

    // 관리자 권한 확인
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { globalRole: true },
    })

    if (
      !user ||
      (user.globalRole !== 'ADMIN' && user.globalRole !== 'MANAGER')
    ) {
      return errorResponse('승인 권한이 없습니다.', 403)
    }

    // 승인 대기 게시글 조회
    const pendingPosts = await prisma.mainPost.findMany({
      where: {
        status: 'PENDING',
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
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

    const formattedPosts = pendingPosts.map((post) => ({
      id: post.id,
      title: post.title,
      excerpt: post.excerpt,
      createdAt: post.createdAt.toISOString(),
      timeAgo: formatTimeAgo(post.createdAt),
      author: {
        id: post.author.id,
        name: post.author.name || 'Unknown',
        email: post.author.email,
        image: post.author.image || undefined,
      },
      category: post.category,
      tags: post.tags.map((t) => t.tag),
      commentCount: post._count.comments,
      likeCount: post._count.likes,
      viewCount: post.viewCount,
    }))

    return successResponse({ posts: formattedPosts })
  } catch (error) {
    return handleError(error)
  }
}
