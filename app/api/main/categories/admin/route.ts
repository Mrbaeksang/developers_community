import { prisma } from '@/lib/core/prisma'
import { requireRoleAPI } from '@/lib/auth/session'
import { successResponse } from '@/lib/api/response'
import { handleError } from '@/lib/api/errors'
import { categorySelect } from '@/lib/cache/patterns'

// 관리자용 전체 카테고리 조회 (비활성 포함)
export async function GET() {
  try {
    const result = await requireRoleAPI(['ADMIN'])
    if (result instanceof Response) return result

    const categories = await prisma.mainCategory.findMany({
      orderBy: {
        order: 'asc',
      },
      select: categorySelect.list,
    })

    return successResponse(categories)
  } catch (error) {
    return handleError(error)
  }
}
