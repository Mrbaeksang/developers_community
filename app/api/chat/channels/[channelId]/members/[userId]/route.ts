import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/core/prisma'
import { auth } from '@/auth'
import {
  handleError,
  throwNotFoundError,
  throwAuthorizationError,
} from '@/lib/api/errors'

// GET: 채팅 채널 멤버의 정보 조회 (lastReadAt 포함)
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ channelId: string; userId: string }> }
) {
  try {
    const { channelId, userId } = await context.params

    // 채널 멤버 정보 조회
    const channelMember = await prisma.chatChannelMember.findUnique({
      where: {
        userId_channelId: {
          userId,
          channelId,
        },
      },
      select: {
        id: true,
        userId: true,
        channelId: true,
        joinedAt: true,
        lastReadAt: true,
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
      },
    })

    if (!channelMember) {
      throwNotFoundError('Channel member not found')
    }

    return NextResponse.json({
      success: true,
      data: channelMember,
    })
  } catch (error) {
    console.error('Failed to fetch channel member:', error)
    return handleError(error)
  }
}

// PATCH: lastReadAt 업데이트
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ channelId: string; userId: string }> }
) {
  try {
    const { channelId, userId } = await context.params
    const session = await auth()

    // 본인만 업데이트 가능
    if (!session?.user?.id || session.user.id !== userId) {
      throwAuthorizationError('본인만 수정할 수 있습니다')
    }

    // lastReadAt 업데이트
    const updatedMember = await prisma.chatChannelMember.update({
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

    return NextResponse.json({
      success: true,
      data: updatedMember,
    })
  } catch (error) {
    console.error('Failed to update lastReadAt:', error)
    return handleError(error)
  }
}
