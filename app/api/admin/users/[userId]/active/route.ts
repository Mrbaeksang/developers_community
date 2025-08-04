import { prisma } from '@/lib/prisma'
import { requireRoleAPI } from '@/lib/auth-utils'
import { successResponse } from '@/lib/api-response'
import { handleError, throwValidationError } from '@/lib/error-handler'
import { withCSRFProtection } from '@/lib/csrf'

async function updateUserActive(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const result = await requireRoleAPI(['ADMIN', 'MANAGER'])
    if (result instanceof Response) return result
    const { userId } = await params
    const adminUserId = result.user.id

    // 자기 자신의 활성 상태 변경 방지
    if (userId === adminUserId) {
      throw throwValidationError('자신의 활성 상태는 변경할 수 없습니다.')
    }

    const { isActive } = await req.json()

    // 차단된 사용자는 활성화할 수 없음
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { isBanned: true },
    })

    if (targetUser?.isBanned && isActive) {
      throw throwValidationError('차단된 사용자는 활성화할 수 없습니다.')
    }

    // 활성 상태 변경
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        isActive,
      },
    })

    return successResponse(user)
  } catch (error) {
    return handleError(error)
  }
}

// CSRF 보호 적용
export const PUT = withCSRFProtection(updateUserActive)
