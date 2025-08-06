import { auth } from '@/auth'
import { prisma } from '@/lib/core/prisma'
import {
  saveConnection,
  removeConnection,
  broadcastOnlineCount,
} from '@/lib/chat/broadcast'
import { throwNotFoundError, throwAuthorizationError } from '@/lib/api/errors'

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

      // 온라인 카운트 브로드캐스트
      setTimeout(() => {
        broadcastOnlineCount(channelId)
      }, 100)

      // Keepalive 인터벌 설정 (30초마다 ping)
      const keepAliveInterval = setInterval(() => {
        try {
          controller.enqueue(`:keepalive\n\n`)
        } catch {
          // 연결이 끊어진 경우
          clearInterval(keepAliveInterval)
          removeConnection(connectionId)
        }
      }, 30000)

      // 연결 종료 시 정리
      req.signal?.addEventListener('abort', () => {
        clearInterval(keepAliveInterval)
        removeConnection(connectionId)

        // 온라인 카운트 업데이트
        setTimeout(() => {
          broadcastOnlineCount(channelId)
        }, 100)

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
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    },
  })
}
