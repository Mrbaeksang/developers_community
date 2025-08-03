import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRoleAPI } from '@/lib/auth-utils'
import { successResponse, deletedResponse } from '@/lib/api-response'
import {
  handleError,
  throwNotFoundError,
  throwValidationError,
} from '@/lib/error-handler'

interface Context {
  params: Promise<{ id: string }>
}

// 카테고리 수정
export async function PATCH(req: NextRequest, context: Context) {
  try {
    const session = await requireRoleAPI(['ADMIN'])
    if (session instanceof Response) {
      return session
    }

    const { id } = await context.params
    const body = await req.json()
    const {
      name,
      slug,
      description,
      color,
      icon,
      order,
      isActive,
      requiresApproval,
    } = body

    // 카테고리 존재 확인
    const existingCategory = await prisma.mainCategory.findUnique({
      where: { id },
    })

    if (!existingCategory) {
      throwNotFoundError('카테고리를 찾을 수 없습니다.')
    }

    // 슬러그 변경 시 중복 확인
    if (slug && slug !== existingCategory.slug) {
      const duplicateSlug = await prisma.mainCategory.findUnique({
        where: { slug },
      })

      if (duplicateSlug) {
        throwValidationError('이미 존재하는 슬러그입니다.')
      }
    }

    // 카테고리 업데이트
    const category = await prisma.mainCategory.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(slug !== undefined && { slug }),
        ...(description !== undefined && { description }),
        ...(color !== undefined && { color }),
        ...(icon !== undefined && { icon }),
        ...(order !== undefined && { order }),
        ...(isActive !== undefined && { isActive }),
        ...(requiresApproval !== undefined && { requiresApproval }),
      },
      include: {
        _count: {
          select: { posts: true },
        },
      },
    })

    return successResponse({
      category: {
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description,
        color: category.color,
        icon: category.icon,
        order: category.order,
        isActive: category.isActive,
        requiresApproval: category.requiresApproval,
        postCount: category._count.posts,
      },
    })
  } catch (error) {
    return handleError(error)
  }
}

// 카테고리 삭제
export async function DELETE(req: NextRequest, context: Context) {
  try {
    const session = await requireRoleAPI(['ADMIN'])
    if (session instanceof Response) {
      return session
    }

    const { id } = await context.params

    // 카테고리 존재 및 게시글 확인
    const category = await prisma.mainCategory.findUnique({
      where: { id },
      include: {
        _count: {
          select: { posts: true },
        },
      },
    })

    if (!category) {
      throwNotFoundError('카테고리를 찾을 수 없습니다.')
    }

    // 게시글이 있는 카테고리는 삭제 불가
    if (category._count.posts > 0) {
      throwValidationError(
        `이 카테고리에 ${category._count.posts}개의 게시글이 있습니다. 게시글을 먼저 삭제하거나 다른 카테고리로 이동하세요.`
      )
    }

    // 카테고리 삭제
    await prisma.mainCategory.delete({
      where: { id },
    })

    return deletedResponse('카테고리가 삭제되었습니다.')
  } catch (error) {
    return handleError(error)
  }
}
