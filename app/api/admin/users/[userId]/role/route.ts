import { prisma } from '@/lib/core/prisma'
import { GlobalRole } from '@prisma/client'
import { requireRoleAPI } from '@/lib/auth/session'
import { successResponse } from '@/lib/api/response'
import { handleError, throwValidationError } from '@/lib/api/errors'
import { withSecurity } from '@/lib/security/compatibility'

async function updateUserRole(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const result = await requireRoleAPI(['ADMIN'])
    if (result instanceof Response) return result
    const { userId } = await params
    const adminUserId = result.user.id

    const { role } = await req.json()

    if (!role || !Object.values(GlobalRole).includes(role)) {
      throw throwValidationError('유효하지 않은 역할입니다.')
    }

    // 자기 자신의 역할 변경 방지
    if (userId === adminUserId && role !== 'ADMIN') {
      throw throwValidationError('자신의 역할은 변경할 수 없습니다.')
    }

    // 역할 변경
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        globalRole: role,
      },
    })

    return successResponse(user)
  } catch (error) {
    return handleError(error)
  }
}

// CSRF 보호 적용
export const PUT = withSecurity(updateUserRole, { requireCSRF: true })
