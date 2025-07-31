import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { checkAuth } from '@/lib/auth-helpers'
import { saveConnection, removeConnection } from '@/lib/chat-broadcast'

// GET: SSE 스트림 연결
export async function GET(
  req: Request,
  { params }: { params: Promise<{ channelId: string }> }
) {
  const session = await auth()
  const { channelId } = await params

  // 인증 확인
  if (!checkAuth(session)) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
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

  // SSE 스트림 생성
  const stream = new ReadableStream({
    start(controller) {
      const connectionId = `${userId}-${channelId}-${Date.now()}`

      // 연결 저장
      saveConnection(connectionId, controller, userId, channelId)

      // 초기 연결 확인 메시지
      controller.enqueue(
        `data: ${JSON.stringify({
          type: 'connected',
          channelId,
          timestamp: new Date().toISOString(),
        })}\n\n`
      )

      // 연결 종료 시 정리
      req.signal?.addEventListener('abort', () => {
        removeConnection(connectionId)
        try {
          controller.close()
        } catch {
          // 이미 닫힌 경우 무시
        }
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    },
  })
}
