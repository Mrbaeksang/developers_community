import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { checkAuth } from '@/lib/auth-helpers'

// GET: 사용자가 접근 가능한 채팅 채널 목록 조회
export async function GET() {
  try {
    const session = await auth()

    // 인증 확인
    if (!checkAuth(session)) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      )
    }

    const userId = session.user.id

    // 1. 사용자가 속한 활성 커뮤니티 ID 목록 조회
    const userCommunities = await prisma.communityMember.findMany({
      where: {
        userId,
        status: 'ACTIVE',
      },
      select: {
        communityId: true,
      },
    })

    const communityIds = userCommunities.map((m) => m.communityId)

    // 2. 접근 가능한 채널 조회
    const channels = await prisma.chatChannel.findMany({
      where: {
        OR: [
          // 전체 사이트 채팅 (GLOBAL)
          { type: 'GLOBAL' },
          // 내가 속한 커뮤니티의 채팅 (COMMUNITY)
          {
            AND: [
              { type: 'COMMUNITY' },
              { communityId: { in: communityIds } },
              { community: { allowChat: true } }, // 채팅이 활성화된 커뮤니티만
            ],
          },
        ],
        isDefault: true, // 기본 채널만 (커뮤니티당 1개)
      },
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
        members: {
          where: { userId },
          select: {
            lastReadAt: true,
          },
        },
      },
      orderBy: [
        // GLOBAL 타입을 먼저 표시
        { createdAt: 'desc' },
      ],
    })

    // 3. 읽지 않은 메시지 수 계산
    const channelsWithUnread = await Promise.all(
      channels.map(async (channel) => {
        const memberInfo = channel.members[0]
        let unreadCount = 0

        if (memberInfo) {
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

    return NextResponse.json({ channels: sortedChannels })
  } catch (error) {
    console.error('Failed to fetch chat channels:', error)
    return NextResponse.json(
      { error: '채팅 채널 목록을 불러오는데 실패했습니다.' },
      { status: 500 }
    )
  }
}
