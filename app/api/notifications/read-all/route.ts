import { prisma } from '@/lib/prisma'
import { requireAuthAPI } from '@/lib/auth-utils'
import { successResponse } from '@/lib/api-response'
import { handleError } from '@/lib/error-handler'

// PUT: 모든 알림 읽음 처리
export async function PUT() {
  try {
    const session = await requireAuthAPI()
    if (session instanceof Response) {
      return session
    }

    // 읽지 않은 알림 개수 확인
    const unreadCount = await prisma.notification.count({
      where: {
        userId: session.user.id,
        isRead: false,
      },
    })

    if (unreadCount === 0) {
      return successResponse({ updatedCount: 0 }, '읽지 않은 알림이 없습니다.')
    }

    // 모든 알림 읽음 처리
    const result = await prisma.notification.updateMany({
      where: {
        userId: session.user.id,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    })

    return successResponse(
      { updatedCount: result.count },
      `${result.count}개의 알림을 읽음 처리했습니다.`
    )
  } catch (error) {
    return handleError(error)
  }
}
