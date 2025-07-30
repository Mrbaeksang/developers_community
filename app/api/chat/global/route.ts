import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { checkAuth } from '@/lib/auth-helpers'

// GET: 전체 사이트 채팅 채널 정보 조회
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

    return NextResponse.json({
      channel: {
        id: channel.id,
        name: channel.name,
        description: channel.description,
        type: channel.type,
      },
    })
  } catch (error) {
    console.error('Failed to fetch global channel:', error)
    return NextResponse.json(
      { error: '채널 정보를 불러오는데 실패했습니다.' },
      { status: 500 }
    )
  }
}
