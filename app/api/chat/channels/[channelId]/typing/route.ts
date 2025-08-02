import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuthAPI } from '@/lib/auth-utils'
import { z } from 'zod'
import { broadcastTyping } from '@/lib/chat-broadcast'

const typingSchema = z.object({
  isTyping: z.boolean(),
})

// POST: 타이핑 상태 업데이트
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

    // 채널 정보 조회
    const channel = await prisma.chatChannel.findUnique({
      where: { id: channelId },
    })

    if (!channel) {
      return NextResponse.json(
        { error: '채널을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // GLOBAL 채널이 아닌 경우에만 멤버 확인
    if (channel.type !== 'GLOBAL') {
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
    }

    // 요청 본문 검증
    const body = await req.json()
    const { isTyping } = typingSchema.parse(body)

    // 타이핑 상태 브로드캐스트
    broadcastTyping(channelId, userId, isTyping)

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '잘못된 요청입니다.', details: error.issues },
        { status: 400 }
      )
    }

    console.error('타이핑 상태 업데이트 실패:', error)
    return NextResponse.json(
      { error: '타이핑 상태 업데이트에 실패했습니다.' },
      { status: 500 }
    )
  }
}
