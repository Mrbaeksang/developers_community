import { prisma } from '@/lib/prisma'
import { requireRoleAPI } from '@/lib/auth-utils'
import { successResponse } from '@/lib/api-response'
import {
  handleError,
  throwNotFoundError,
  throwValidationError,
} from '@/lib/error-handler'

// 카테고리 상세 조회
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const category = await prisma.mainCategory.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            posts: true,
          },
        },
      },
    })

    if (!category) {
      throwNotFoundError('카테고리를 찾을 수 없습니다')
    }

    return successResponse({
      ...category,
      postCount: category._count.posts,
    })
  } catch (error) {
    return handleError(error)
  }
}

// 카테고리 수정 (관리자만)
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const result = await requireRoleAPI(['ADMIN'])
    if (result instanceof Response) return result
    const { id } = await params
    const body = await req.json()
    const { name, slug, description, color, icon, order, isActive } = body

    // 중복 확인 (자기 자신 제외)
    if (name || slug) {
      const existing = await prisma.mainCategory.findFirst({
        where: {
          NOT: { id },
          OR: [...(name ? [{ name }] : []), ...(slug ? [{ slug }] : [])],
        },
      })

      if (existing) {
        throwValidationError('이미 존재하는 카테고리입니다')
      }
    }

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
      },
    })

    return successResponse(category, '카테고리가 수정되었습니다')
  } catch (error) {
    return handleError(error)
  }
}

// 카테고리 삭제 (관리자만)
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const result = await requireRoleAPI(['ADMIN'])
    if (result instanceof Response) return result
    const { id } = await params

    // 게시글이 있는지 확인
    const category = await prisma.mainCategory.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            posts: true,
          },
        },
      },
    })

    if (!category) {
      throwNotFoundError('카테고리를 찾을 수 없습니다')
    }

    if (category._count.posts > 0) {
      throwValidationError('게시글이 있는 카테고리는 삭제할 수 없습니다')
    }

    await prisma.mainCategory.delete({
      where: { id },
    })

    return successResponse({ deleted: true }, '카테고리가 삭제되었습니다')
  } catch (error) {
    return handleError(error)
  }
}
