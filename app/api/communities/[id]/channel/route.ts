import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuthAPI } from '@/lib/auth-utils'
import { successResponse } from '@/lib/api-response'
import {
  handleError,
  throwNotFoundError,
  throwAuthorizationError,
} from '@/lib/error-handler'

// GET: 커뮤니티의 기본 채팅 채널 정보 조회
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const session = await requireAuthAPI()
    if (session instanceof Response) {
      return session
    }
    const userId = session.user.id

    // 커뮤니티 확인 및 멤버십 체크
    const community = await prisma.community.findUnique({
      where: { id },
      include: {
        members: {
          where: {
            userId,
            status: 'ACTIVE',
          },
        },
      },
    })

    if (!community) {
      throwNotFoundError('커뮤니티를 찾을 수 없습니다')
    }

    // 채팅이 비활성화된 경우
    if (!community.allowChat) {
      throwAuthorizationError('이 커뮤니티는 채팅 기능을 사용하지 않습니다')
    }

    // 멤버가 아닌 경우
    if (community.members.length === 0) {
      throwAuthorizationError('커뮤니티 멤버만 채팅을 이용할 수 있습니다')
    }

    // 기본 채널 조회 (없으면 생성)
    let channel = await prisma.chatChannel.findFirst({
      where: {
        communityId: id,
        isDefault: true,
      },
    })

    if (!channel) {
      // 기본 채널이 없으면 생성
      channel = await prisma.chatChannel.create({
        data: {
          name: community.name,
          description: `${community.name} 커뮤니티 채팅방`,
          type: 'COMMUNITY',
          isDefault: true,
          communityId: id,
        },
      })

      // 채널 멤버로 추가
      await prisma.chatChannelMember.create({
        data: {
          userId,
          channelId: channel.id,
        },
      })
    } else {
      // 이미 채널이 있는 경우, 멤버인지 확인
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
