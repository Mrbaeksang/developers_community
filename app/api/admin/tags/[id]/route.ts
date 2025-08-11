import { auth } from '@/auth'
import { prisma } from '@/lib/core/prisma'
import { successResponse, errorResponse } from '@/lib/api/response'
import { updateTagSchema } from '@/lib/validations/admin'
import { handleZodError } from '@/lib/api/validation-error'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function PATCH(request: Request, { params }: RouteParams) {
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

    const { id } = await params
    const body = await request.json()

    // Zod로 검증
    const result = updateTagSchema.safeParse(body)
    if (!result.success) {
      return handleZodError(result.error)
    }

    const { name, slug, description, color } = result.data

    // 태그가 존재하는지 확인
    const existingTag = await prisma.mainTag.findUnique({
      where: { id },
    })

    if (!existingTag) {
      return errorResponse('태그를 찾을 수 없습니다', 404)
    }

    // 같은 이름의 다른 태그가 있는지 확인
    if (name !== existingTag.name) {
      const duplicateTag = await prisma.mainTag.findUnique({
        where: { name },
      })

      if (duplicateTag) {
        return errorResponse('이미 존재하는 태그명입니다', 400)
      }
    }

    // slug는 Zod에서 이미 검증되고 변환됨

    const updatedTag = await prisma.mainTag.update({
      where: { id },
      data: {
        name: name.trim(),
        slug,
        description: description?.trim() || null,
        color: color || '#64748b',
      },
    })

    return successResponse({
      tag: updatedTag,
      message: '태그가 성공적으로 수정되었습니다',
    })
  } catch (error) {
    console.error('Error updating tag:', error)
    return errorResponse('태그 수정 실패', 500)
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
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

    const { id } = await params

    // 태그가 존재하는지 확인
    const existingTag = await prisma.mainTag.findUnique({
      where: { id },
    })

    if (!existingTag) {
      return errorResponse('태그를 찾을 수 없습니다', 404)
    }

    // 트랜잭션으로 태그와 연결 삭제
    await prisma.$transaction(async (tx) => {
      // 먼저 태그-게시글 연결 삭제
      await tx.mainPostTag.deleteMany({
        where: { tagId: id },
      })

      // 태그 삭제
      await tx.mainTag.delete({
        where: { id },
      })
    })

    return successResponse({
      message: '태그가 성공적으로 삭제되었습니다',
    })
  } catch (error) {
    console.error('Error deleting tag:', error)
    return errorResponse('태그 삭제 실패', 500)
  }
}
