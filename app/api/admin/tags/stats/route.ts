import { auth } from '@/auth'
import { prisma } from '@/lib/core/prisma'
import { successResponse, errorResponse } from '@/lib/api/response'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return errorResponse('인증이 필요합니다', 401)
    }

    // 관리자 권한 확인
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    })

    if (!user || user.globalRole !== 'ADMIN') {
      return errorResponse('권한이 없습니다', 403)
    }

    const [totalTags, activeTags, totalPosts] = await Promise.all([
      // 전체 태그 수
      prisma.mainTag.count(),

      // 활성 태그 수 (postCount > 0)
      prisma.mainTag.count({
        where: {
          postCount: {
            gt: 0,
          },
        },
      }),

      // 태그된 총 게시글 수 (중복 계산)
      prisma.mainTag.aggregate({
        _sum: {
          postCount: true,
        },
      }),
    ])

    return successResponse({
      totalTags,
      activeTags,
      totalPosts: totalPosts._sum.postCount || 0,
    })
  } catch (error) {
    console.error('Error fetching tag stats:', error)
    return errorResponse('태그 통계 조회 실패', 500)
  }
}
