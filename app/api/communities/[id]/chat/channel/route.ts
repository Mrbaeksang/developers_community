import { auth } from '@/auth'
import { prisma } from '@/lib/core/prisma'
import { successResponse } from '@/lib/api/response'
import {
  handleError,
  throwAuthenticationError,
  throwNotFoundError,
  throwAuthorizationError,
} from '@/lib/api/errors'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET: 커뮤니티의 기본 채팅 채널 가져오기 (없으면 생성)
export async function GET(req: Request, { params }: RouteParams) {
  try {
    const { id: communityId } = await params
    const session = await auth()

    if (!session?.user?.id) {
      return throwAuthenticationError('로그인이 필요합니다.')
    }

    // 커뮤니티 확인 (ID 기반)
    const community = await prisma.community.findUnique({
      where: { id: communityId },
      select: {
        id: true,
        name: true,
        allowChat: true,
      },
    })

    if (!community) {
      return throwNotFoundError('커뮤니티를 찾을 수 없습니다.')
    }

    if (!community.allowChat) {
      return throwAuthorizationError(
        '이 커뮤니티는 채팅이 비활성화되어 있습니다.'
      )
    }

    // 멤버 확인
    const member = await prisma.communityMember.findUnique({
      where: {
        userId_communityId: {
          userId: session.user.id,
          communityId: community.id,
        },
      },
      select: {
        status: true,
        role: true,
      },
    })

    if (!member || member.status !== 'ACTIVE') {
      return throwAuthorizationError(
        '커뮤니티 멤버만 채팅에 참여할 수 있습니다.'
      )
    }

    // 기본 채널 찾기 또는 생성
    let channel = await prisma.chatChannel.findFirst({
      where: {
        communityId: community.id,
        isDefault: true,
      },
    })

    if (!channel) {
      // 기본 채널 생성
      channel = await prisma.chatChannel.create({
        data: {
          name: '일반',
          description: `${community.name} 커뮤니티의 기본 채팅 채널입니다.`,
          type: 'COMMUNITY',
          isDefault: true,
          communityId: community.id,
        },
      })

      // 현재 사용자를 채널 멤버로 추가
      await prisma.chatChannelMember.create({
        data: {
          userId: session.user.id,
          channelId: channel.id,
        },
      })
    } else {
      // 채널 멤버 확인 및 추가
      const channelMember = await prisma.chatChannelMember.findUnique({
        where: {
          userId_channelId: {
            userId: session.user.id,
            channelId: channel.id,
          },
        },
      })

      if (!channelMember) {
        await prisma.chatChannelMember.create({
          data: {
            userId: session.user.id,
            channelId: channel.id,
          },
        })
      }
    }

    return successResponse({
      channel: {
        id: channel.id,
        name: channel.name,
        description: channel.description,
        type: channel.type,
        isDefault: channel.isDefault,
        communityId: channel.communityId,
      },
    })
  } catch (error) {
    return handleError(error)
  }
}
