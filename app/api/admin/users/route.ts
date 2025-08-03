import { requireRoleAPI } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'
import { successResponse } from '@/lib/api-response'
import { handleError } from '@/lib/error-handler'

export async function GET() {
  try {
    const session = await requireRoleAPI(['ADMIN', 'MANAGER'])
    if (session instanceof Response) {
      return session
    }

    // 모든 사용자 조회
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        globalRole: true,
        isActive: true,
        isBanned: true,
        banReason: true,
        banUntil: true,
        emailVerified: true,
        createdAt: true,
        _count: {
          select: {
            mainPosts: true,
            communityPosts: true,
            mainComments: true,
            communityComments: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return successResponse(users)
  } catch (error) {
    return handleError(error)
  }
}
