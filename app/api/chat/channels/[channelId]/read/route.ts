import { prisma } from '@/lib/core/prisma'
import { requireAuthAPI } from '@/lib/auth/session'
import { successResponse } from '@/lib/api/response'
import { handleError, throwAuthorizationError } from '@/lib/api/errors'

// POST: 메시지 읽음 상태 업데이트
export async function POST(
  req: Request,
  { params }: { params: Promise<{ channelId: string }> }
) {
  try {
    const { channelId } = await params

    // 인증 확인
    const session = await requireAuthAPI()
    if (session instanceof Response) {
      return session
    }

    const userId = session.user.id

    // 채널 멤버 확인
    const channelMember = await prisma.chatChannelMember.findUnique({
      where: {
        userId_channelId: {
          userId,
          channelId,
        },
      },
    })

    if (!channelMember) {
      throw throwAuthorizationError('채팅방에 참여하지 않았습니다.')
    }

    // 마지막 읽은 시간 업데이트
    await prisma.chatChannelMember.update({
      where: {
        userId_channelId: {
          userId,
          channelId,
        },
      },
      data: {
        lastReadAt: new Date(),
      },
    })

    return successResponse({ success: true })
  } catch (error) {
    return handleError(error)
  }
}
