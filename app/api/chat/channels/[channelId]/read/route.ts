import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuthAPI } from '@/lib/auth-utils'

// POST: 메시지 읽음 상태 업데이트
export async function POST(
  req: Request,
  { params }: { params: Promise<{ channelId: string }> }
) {
  try {
    const { channelId } = await params

    // 인증 확인
    const session = await requireAuthAPI()
    if (session instanceof NextResponse) {
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
      return NextResponse.json(
        { error: '채팅방에 참여하지 않았습니다.' },
        { status: 403 }
      )
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

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to update read status:', error)
    return NextResponse.json(
      { error: '읽음 상태 업데이트에 실패했습니다.' },
      { status: 500 }
    )
  }
}
