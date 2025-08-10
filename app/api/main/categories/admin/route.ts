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

    // _count.posts를 postCount로 매핑
    const categoriesWithPostCount = categories.map((category) => ({
      ...category,
      postCount: (category._count as { posts: number })?.posts || 0,
    }))

    return successResponse(categoriesWithPostCount)
  } catch (error) {
    return handleError(error)
  }
}
