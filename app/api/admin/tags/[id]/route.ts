import { auth } from '@/auth'
import { prisma } from '@/lib/core/prisma'
import { successResponse, errorResponse } from '@/lib/api/response'

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
    const { name, description, color } = body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return errorResponse('태그명은 필수입니다', 400)
    }

    if (name.trim().length > 50) {
      return errorResponse('태그명은 50자 이하여야 합니다', 400)
    }

    if (description && description.length > 200) {
      return errorResponse('설명은 200자 이하여야 합니다', 400)
    }

    if (color && !/^#[0-9A-F]{6}$/i.test(color)) {
      return errorResponse('올바른 색상 형식이 아닙니다', 400)
    }

    // 태그가 존재하는지 확인
    const existingTag = await prisma.mainTag.findUnique({
      where: { id },
    })

    if (!existingTag) {
      return errorResponse('태그를 찾을 수 없습니다', 404)
    }

    // 같은 이름의 다른 태그가 있는지 확인
    if (name.trim() !== existingTag.name) {
      const duplicateTag = await prisma.mainTag.findUnique({
        where: { name: name.trim() },
      })

      if (duplicateTag) {
        return errorResponse('이미 존재하는 태그명입니다', 400)
      }
    }

    // slug 생성
    const slug = name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9가-힣\s-]/g, '')
      .replace(/\s+/g, '-')

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
