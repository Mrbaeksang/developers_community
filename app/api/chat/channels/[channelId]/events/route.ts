import { auth } from '@/auth'
import { prisma } from '@/lib/core/prisma'
import {
  saveConnection,
  removeConnection,
  broadcastOnlineCount,
} from '@/lib/chat/broadcast'
import { throwNotFoundError, throwAuthorizationError } from '@/lib/api/errors'

// 활성 연결 추적
const activeConnections = new Map<
  string,
  { controller: ReadableStreamDefaultController; lastActivity: number }
>()
const MAX_CONNECTIONS_PER_CHANNEL = 100
const CONNECTION_TIMEOUT = 10 * 60 * 1000 // 10분

// 주기적으로 비활성 연결 정리
const cleanupInterval = setInterval(() => {
  const now = Date.now()
  for (const [connectionId, conn] of activeConnections) {
    if (now - conn.lastActivity > CONNECTION_TIMEOUT) {
      try {
        conn.controller.close()
      } catch {}
      activeConnections.delete(connectionId)
      removeConnection(connectionId)
    }
  }
}, 120000) // 2분마다 정리

// Vercel 종료 시 정리
if (typeof process !== 'undefined') {
  process.on('beforeExit', () => {
    clearInterval(cleanupInterval)
    for (const [connectionId, conn] of activeConnections) {
      try {
        conn.controller.close()
      } catch {}
      removeConnection(connectionId)
    }
    activeConnections.clear()
  })
}

// GET: SSE 스트림 연결
export async function GET(
  req: Request,
  { params }: { params: Promise<{ channelId: string }> }
) {
  const session = await auth()
  const { channelId } = await params
  const userId =
    session?.user?.id || `anon-${Math.random().toString(36).substring(7)}`

  // 채널 정보 조회
  const channel = await prisma.chatChannel.findUnique({
    where: { id: channelId },
  })

  if (!channel) {
    throw throwNotFoundError('채널을 찾을 수 없습니다.')
  }

  // GLOBAL 채널이 아닌 경우에만 멤버 확인
  if (channel.type !== 'GLOBAL') {
    // 로그인하지 않은 사용자는 GLOBAL이 아닌 채널에 접근 불가
    if (!session?.user?.id) {
      throw throwAuthorizationError('로그인이 필요합니다.')
    }

    const channelMember = await prisma.chatChannelMember.findUnique({
      where: {
        userId_channelId: {
          userId: session.user.id,
          channelId,
        },
      },
    })

    if (!channelMember) {
      throw throwAuthorizationError('채팅방에 참여하지 않았습니다.')
    }
  }

  // 채널당 연결 수 제한
  const channelConnections = Array.from(activeConnections.entries()).filter(
    ([id]) => id.includes(channelId)
  )

  if (channelConnections.length >= MAX_CONNECTIONS_PER_CHANNEL) {
    return new Response('Too many connections for this channel', {
      status: 429,
    })
  }

  // SSE 스트림 생성
  const stream = new ReadableStream({
    start(controller) {
      const connectionId = `${userId}-${channelId}-${Date.now()}`

      // 연결 저장 (두 곳에 저장)
      activeConnections.set(connectionId, {
        controller,
        lastActivity: Date.now(),
      })
      saveConnection(connectionId, controller, userId, channelId)

      // 초기 연결 확인 메시지
      controller.enqueue(
        `data: ${JSON.stringify({
          type: 'connected',
          channelId,
          timestamp: new Date().toISOString(),
        })}\n\n`
      )

      // 온라인 카운트 브로드캐스트
      setTimeout(() => {
        broadcastOnlineCount(channelId)
      }, 100)

      // 정리 함수
      const cleanup = () => {
        activeConnections.delete(connectionId)
        removeConnection(connectionId)
        if (keepAliveInterval) {
          clearInterval(keepAliveInterval)
        }
        // 온라인 카운트 업데이트
        setTimeout(() => {
          broadcastOnlineCount(channelId)
        }, 100)
        try {
          controller.close()
        } catch {
          // 이미 닫힌 경우 무시
        }
      }

      // Keepalive 인터벌 설정 (2분마다 ping - 메모리 사용량 줄이기)
      const keepAliveInterval = setInterval(() => {
        const connection = activeConnections.get(connectionId)
        if (!connection) {
          clearInterval(keepAliveInterval)
          return
        }

        try {
          connection.lastActivity = Date.now()
          controller.enqueue(`:keepalive\n\n`)
        } catch {
          cleanup()
        }
      }, 120000) // 2분으로 변경

      // 연결 종료 시 정리
      req.signal?.addEventListener('abort', cleanup)
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    },
  })
}
