import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { successResponse } from '@/lib/api-response'
import { handleError } from '@/lib/error-handler'

// GET: 사용자가 접근 가능한 채팅 채널 목록 조회
export async function GET() {
  try {
    const session = await auth()
    const userId = session?.user?.id

    // 1. 로그인한 경우에만 커뮤니티 조회
    let communityIds: string[] = []
    if (userId) {
      const userCommunities = await prisma.communityMember.findMany({
        where: {
          userId,
          status: 'ACTIVE',
        },
        select: {
          communityId: true,
        },
      })
      communityIds = userCommunities.map((m) => m.communityId)
    }

    // 2. 접근 가능한 채널 조회
    const whereConditions: Prisma.ChatChannelWhereInput = {
      isDefault: true, // 기본 채널만 (커뮤니티당 1개)
    }

    if (userId && communityIds.length > 0) {
      // 로그인한 경우: GLOBAL + 내가 속한 커뮤니티 채널
      whereConditions.OR = [
        { type: 'GLOBAL' },
        {
          AND: [
            { type: 'COMMUNITY' },
            { communityId: { in: communityIds } },
            { community: { allowChat: true } },
          ],
        },
      ]
    } else {
      // 로그인하지 않은 경우: GLOBAL만
      whereConditions.type = 'GLOBAL'
    }

    const channels = await prisma.chatChannel.findMany({
      where: whereConditions,
      include: {
        community: {
          select: {
            id: true,
            name: true,
            slug: true,
            avatar: true,
          },
        },
        // 마지막 메시지 정보
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          include: {
            author: {
              select: {
                id: true,
                name: true,
                username: true,
              },
            },
          },
        },
        // 내 채널 멤버 정보 (읽지 않은 메시지 수 계산용)
        members: userId
          ? {
              where: { userId },
              select: {
                lastReadAt: true,
              },
            }
          : false,
      },
      orderBy: [
        // GLOBAL 타입을 먼저 표시
        { createdAt: 'desc' },
      ],
    })

    // 3. 읽지 않은 메시지 수 계산
    const channelsWithUnread = await Promise.all(
      channels.map(async (channel) => {
        let unreadCount = 0

        // 로그인한 사용자만 읽지 않은 메시지 수 계산
        if (userId && channel.members && channel.members[0]) {
          const memberInfo = channel.members[0]
          unreadCount = await prisma.chatMessage.count({
            where: {
              channelId: channel.id,
              createdAt: { gt: memberInfo.lastReadAt },
              authorId: { not: userId }, // 내가 보낸 메시지는 제외
            },
          })
        }

        // 필요한 정보만 반환
        return {
          id: channel.id,
          name: channel.name,
          description: channel.description,
          type: channel.type,
          communityId: channel.communityId,
          community: channel.community,
          lastMessage: channel.messages[0] || null,
          unreadCount,
        }
      })
    )

    // GLOBAL 채널을 먼저 정렬
    const sortedChannels = channelsWithUnread.sort((a, b) => {
      if (a.type === 'GLOBAL' && b.type !== 'GLOBAL') {
        return -1
      }
      if (a.type !== 'GLOBAL' && b.type === 'GLOBAL') {
        return 1
      }
      return 0
    })

    return successResponse({ channels: sortedChannels })
  } catch (error) {
    return handleError(error)
  }
}
