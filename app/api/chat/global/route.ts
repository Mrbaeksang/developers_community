import { prisma } from '@/lib/core/prisma'
import { requireAuthAPI } from '@/lib/auth/session'
import { successResponse } from '@/lib/api/response'
import { handleError } from '@/lib/api/errors'

// GET: 전체 사이트 채팅 채널 정보 조회
export async function GET() {
  try {
    // 인증 확인
    const session = await requireAuthAPI()
    if (session instanceof Response) {
      return session
    }

    const userId = session.user.id

    // GLOBAL 채널 조회 (없으면 생성)
    let channel = await prisma.chatChannel.findFirst({
      where: {
        type: 'GLOBAL',
        isDefault: true,
      },
    })

    if (!channel) {
      // GLOBAL 채널이 없으면 생성
      channel = await prisma.chatChannel.create({
        data: {
          name: '전체 채팅',
          description: '모든 회원이 참여할 수 있는 전체 채팅방입니다.',
          type: 'GLOBAL',
          isDefault: true,
          communityId: null,
        },
      })
    }

    // 채널 멤버인지 확인
    const channelMember = await prisma.chatChannelMember.findUnique({
      where: {
        userId_channelId: {
          userId,
          channelId: channel.id,
        },
      },
    })

    if (!channelMember) {
      // 채널 멤버가 아니면 추가
      await prisma.chatChannelMember.create({
        data: {
          userId,
          channelId: channel.id,
        },
      })
    }

    return successResponse({
      channel: {
        id: channel.id,
        name: channel.name,
        description: channel.description,
        type: channel.type,
      },
    })
  } catch (error) {
    return handleError(error)
  }
}
