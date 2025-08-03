import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuthAPI } from '@/lib/auth-utils'
import { deletedResponse } from '@/lib/api-response'
import {
  handleError,
  throwNotFoundError,
  throwAuthorizationError,
} from '@/lib/error-handler'

// DELETE: 특정 알림 삭제
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuthAPI()
    if (session instanceof Response) {
      return session
    }

    const resolvedParams = await params
    const notificationId = resolvedParams.id

    // 알림 존재 여부 및 소유권 확인
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
      select: { userId: true },
    })

    if (!notification) {
      throwNotFoundError('알림을 찾을 수 없습니다.')
    }

    if (notification.userId !== session.user.id) {
      throwAuthorizationError('권한이 없습니다.')
    }

    // 알림 삭제
    await prisma.notification.delete({
      where: { id: notificationId },
    })

    return deletedResponse('알림이 삭제되었습니다.')
  } catch (error) {
    return handleError(error)
  }
}
