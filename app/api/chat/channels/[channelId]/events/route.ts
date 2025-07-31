import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { checkAuth } from '@/lib/auth-helpers'

// SSE 연결을 저장하기 위한 Map
const connections = new Map<
  string,
  {
    controller: ReadableStreamDefaultController
    userId: string
    channelId: string
  }
>()

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
      connections.set(connectionId, {
        controller,
        userId,
        channelId,
      })

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
        connections.delete(connectionId)
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

// 메시지를 모든 채널 구독자에게 브로드캐스트
interface ChatMessage {
  id: string
  content: string
  type: string
  createdAt: Date
  updatedAt: Date
  author: {
    id: string
    username: string | null
    name: string | null
    image: string | undefined
  }
  file?: {
    id: string
    filename: string
    size: number
    type: string
    url: string
    mimeType: string
    width: number | null
    height: number | null
    expiresAt: Date | null
    isTemporary: boolean
  }
}

export function broadcastMessage(channelId: string, message: ChatMessage) {
  const messageData = JSON.stringify({
    type: 'message',
    data: message,
    timestamp: new Date().toISOString(),
  })

  // 해당 채널을 구독하는 모든 연결에 메시지 전송
  for (const [connectionId, connection] of connections.entries()) {
    if (connection.channelId === channelId) {
      try {
        connection.controller.enqueue(`data: ${messageData}\n\n`)
      } catch {
        // 연결이 끊어진 경우 제거
        connections.delete(connectionId)
      }
    }
  }
}

// 타이핑 상태를 브로드캐스트
export function broadcastTyping(
  channelId: string,
  userId: string,
  isTyping: boolean
) {
  const typingData = JSON.stringify({
    type: 'typing',
    data: {
      userId,
      isTyping,
    },
    timestamp: new Date().toISOString(),
  })

  // 해당 채널을 구독하는 모든 연결에 타이핑 상태 전송 (자신 제외)
  for (const [connectionId, connection] of connections.entries()) {
    if (connection.channelId === channelId && connection.userId !== userId) {
      try {
        connection.controller.enqueue(`data: ${typingData}\n\n`)
      } catch {
        connections.delete(connectionId)
      }
    }
  }
}

// 온라인 사용자 수 브로드캐스트
export function broadcastOnlineCount(channelId: string) {
  const onlineUsers = Array.from(connections.values())
    .filter((conn) => conn.channelId === channelId)
    .map((conn) => conn.userId)

  const uniqueUsers = [...new Set(onlineUsers)]

  const onlineData = JSON.stringify({
    type: 'online_count',
    data: {
      count: uniqueUsers.length,
      users: uniqueUsers,
    },
    timestamp: new Date().toISOString(),
  })

  for (const [connectionId, connection] of connections.entries()) {
    if (connection.channelId === channelId) {
      try {
        connection.controller.enqueue(`data: ${onlineData}\n\n`)
      } catch {
        connections.delete(connectionId)
      }
    }
  }
}
