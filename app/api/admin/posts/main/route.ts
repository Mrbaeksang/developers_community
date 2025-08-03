import { prisma } from '@/lib/prisma'
import { requireRoleAPI } from '@/lib/auth-utils'
import { successResponse } from '@/lib/api-response'
import { handleError } from '@/lib/error-handler'

// 메인 게시글 목록 조회 (관리자용)
export async function GET() {
  try {
    const session = await requireRoleAPI(['ADMIN'])
    if (session instanceof Response) {
      return session
    }

    const posts = await prisma.mainPost.findMany({
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            globalRole: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            color: true,
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
      take: 500, // 최대 500개까지만 조회
    })

    return successResponse(posts)
  } catch (error) {
    return handleError(error)
  }
}
