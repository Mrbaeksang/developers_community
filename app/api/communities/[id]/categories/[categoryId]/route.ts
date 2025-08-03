import { prisma } from '@/lib/prisma'
import { requireCommunityRoleAPI } from '@/lib/auth-utils'
import { CommunityRole } from '@prisma/client'
import { successResponse } from '@/lib/api-response'
import {
  handleError,
  throwNotFoundError,
  throwValidationError,
} from '@/lib/error-handler'

// PATCH /api/communities/[id]/categories/[categoryId] - 카테고리 수정
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; categoryId: string }> }
) {
  try {
    const resolvedParams = await params
    let { id } = resolvedParams
    const { categoryId } = resolvedParams

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

    // 카테고리 존재 확인
    const category = await prisma.communityCategory.findFirst({
      where: {
        id: categoryId,
        communityId: id,
      },
    })

    if (!category) {
      throw throwNotFoundError('카테고리를 찾을 수 없습니다.')
    }

    const body = await request.json()
    const { name, slug, description, color } = body

    // 입력값 검증
    if (name !== undefined && !name.trim()) {
      throw throwValidationError('카테고리 이름은 비어있을 수 없습니다.')
    }

    if (slug !== undefined && !slug.trim()) {
      throw throwValidationError('슬러그는 비어있을 수 없습니다.')
    }

    if (color !== undefined) {
      const colorRegex = /^#[0-9A-Fa-f]{6}$/
      if (!colorRegex.test(color)) {
        throw throwValidationError('올바른 색상 형식이 아닙니다. (#RRGGBB)')
      }
    }

    // 중복 확인 (이름 또는 슬러그 변경 시)
    if (name || slug) {
      const existing = await prisma.communityCategory.findFirst({
        where: {
          communityId: id,
          id: { not: categoryId },
          OR: [
            ...(name ? [{ name: name.trim() }] : []),
            ...(slug ? [{ slug: slug.trim() }] : []),
          ],
        },
      })

      if (existing) {
        throw throwValidationError('이미 사용 중인 이름 또는 슬러그입니다.')
      }
    }

    // 카테고리 업데이트
    const updatedCategory = await prisma.communityCategory.update({
      where: { id: categoryId },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(slug !== undefined && { slug: slug.trim() }),
        ...(description !== undefined && { description: description?.trim() }),
        ...(color !== undefined && { color }),
      },
    })

    return successResponse(updatedCategory)
  } catch (error) {
    return handleError(error)
  }
}

// DELETE /api/communities/[id]/categories/[categoryId] - 카테고리 삭제
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; categoryId: string }> }
) {
  try {
    const resolvedParams = await params
    let { id } = resolvedParams
    const { categoryId } = resolvedParams

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

    // 카테고리 존재 확인
    const category = await prisma.communityCategory.findFirst({
      where: {
        id: categoryId,
        communityId: id,
      },
      include: {
        _count: {
          select: { posts: true },
        },
      },
    })

    if (!category) {
      throw throwNotFoundError('카테고리를 찾을 수 없습니다.')
    }

    // 게시글이 있는 경우 경고
    if (category._count.posts > 0) {
      throw throwValidationError(
        `이 카테고리에 ${category._count.posts}개의 게시글이 있습니다. 정말 삭제하시겠습니까?`
      )
    }

    // 카테고리 삭제 (소프트 삭제)
    await prisma.communityCategory.update({
      where: { id: categoryId },
      data: { isActive: false },
    })

    return successResponse({ message: '카테고리가 삭제되었습니다.' })
  } catch (error) {
    return handleError(error)
  }
}
