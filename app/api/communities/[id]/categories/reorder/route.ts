import { prisma } from '@/lib/core/prisma'
import { requireCommunityRoleAPI } from '@/lib/auth/session'
import { CommunityRole } from '@prisma/client'
import { successResponse } from '@/lib/api/response'
import {
  handleError,
  throwNotFoundError,
  throwValidationError,
} from '@/lib/api/errors'

// PATCH /api/communities/[id]/categories/reorder - 카테고리 순서 변경
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    let { id } = resolvedParams

    // 커뮤니티 찾기 (ID 또는 slug)
    const community = await prisma.community.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      select: { id: true },
    })

    if (!community) {
      throw throwNotFoundError('커뮤니티를 찾을 수 없습니다.')
    }

    // 실제 ID로 업데이트
    id = community.id

    // 관리자 권한 확인
    const session = await requireCommunityRoleAPI(id, [CommunityRole.ADMIN])
    if (session instanceof Response) {
      return session
    }

    const body = await request.json()
    const { categoryIds } = body

    if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
      throw throwValidationError('카테고리 ID 목록이 필요합니다.')
    }

    // 모든 카테고리가 해당 커뮤니티에 속하는지 확인
    const categories = await prisma.communityCategory.findMany({
      where: {
        id: { in: categoryIds },
        communityId: id,
      },
      select: { id: true },
    })

    if (categories.length !== categoryIds.length) {
      throw throwValidationError('유효하지 않은 카테고리가 포함되어 있습니다.')
    }

    // 트랜잭션으로 순서 업데이트
    await prisma.$transaction(
      categoryIds.map((categoryId, index) =>
        prisma.communityCategory.update({
          where: { id: categoryId },
          data: { order: index },
        })
      )
    )

    return successResponse({ message: '카테고리 순서가 변경되었습니다.' })
  } catch (error) {
    return handleError(error)
  }
}
