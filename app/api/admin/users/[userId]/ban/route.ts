import { prisma } from '@/lib/prisma'
import { requireRoleAPI } from '@/lib/auth-utils'
import { successResponse } from '@/lib/api-response'
import { handleError, throwValidationError } from '@/lib/error-handler'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const result = await requireRoleAPI(['ADMIN'])
    if (result instanceof Response) return result
    const { userId } = await params
    const adminUserId = result.user.id

    // 자기 자신을 차단하는 것 방지
    if (userId === adminUserId) {
      throw throwValidationError('자신을 차단할 수 없습니다.')
    }

    const { banReason, banUntil } = await req.json()

    if (!banReason) {
      throw throwValidationError('차단 사유를 입력해주세요.')
    }

    // 사용자 차단
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        isBanned: true,
        banReason,
        banUntil: banUntil ? new Date(banUntil) : null,
        // 차단 시 활성 상태도 비활성화
        isActive: false,
      },
    })

    return successResponse(user)
  } catch (error) {
    return handleError(error)
  }
}
