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

    const tags = await prisma.mainTag.findMany({
      orderBy: [{ postCount: 'desc' }, { name: 'asc' }],
    })

    return successResponse({
      tags,
      total: tags.length,
    })
  } catch (error) {
    console.error('Error fetching tags:', error)
    return errorResponse('태그 조회 실패', 500)
  }
}
