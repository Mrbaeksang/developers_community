import { prisma } from '@/lib/prisma'
import { requireRoleAPI } from '@/lib/auth-utils'
import { successResponse } from '@/lib/api-response'
import { handleError } from '@/lib/error-handler'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const result = await requireRoleAPI(['ADMIN'])
    if (result instanceof Response) return result
    const { userId } = await params

    // 사용자 차단 해제
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        isBanned: false,
        banReason: null,
        banUntil: null,
        // 차단 해제 시 활성 상태 복구
        isActive: true,
      },
    })

    return successResponse(user)
  } catch (error) {
    return handleError(error)
  }
}
