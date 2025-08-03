import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuthAPI, checkBanStatus } from '@/lib/auth-utils'
import { successResponse, errorResponse } from '@/lib/api-response'
import { handleError } from '@/lib/error-handler'

// PUT: 특정 알림 읽음 처리
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuthAPI()
    if (session instanceof Response) {
      return session
    }

    // Ban 상태 체크
    await checkBanStatus(session.user.id)

    const resolvedParams = await params
    const notificationId = resolvedParams.id

    // 알림 존재 여부 및 소유권 확인
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
      select: { userId: true, isRead: true },
    })

    if (!notification) {
      return errorResponse('알림을 찾을 수 없습니다.', 404)
    }

    if (notification.userId !== session.user.id) {
      return errorResponse('알림에 액세스할 권한이 없습니다.', 403)
    }

    if (notification.isRead) {
      return successResponse({ isRead: true }, '이미 읽은 알림입니다.')
    }

    // 읽음 처리
    await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    })

    // 읽지 않은 알림 개수 반환
    const unreadCount = await prisma.notification.count({
      where: {
        userId: session.user.id,
        isRead: false,
      },
    })

    return successResponse(
      { isRead: true, unreadCount },
      '알림을 읽음 처리했습니다.'
    )
  } catch (error) {
    return handleError(error)
  }
}
