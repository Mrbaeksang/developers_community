import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/core/prisma'
import { notificationEmitter } from '@/lib/notifications/emitter'
import { handleError } from '@/lib/api/errors'
import { requireAuthAPI } from '@/lib/auth/session'

// 활성 연결 추적
const activeConnections = new Map<
  string,
  { controller: ReadableStreamDefaultController; lastActivity: number }
>()
const MAX_CONNECTIONS_PER_USER = 3
const CONNECTION_TIMEOUT = 5 * 60 * 1000 // 5분

// 주기적으로 비활성 연결 정리
const cleanupInterval = setInterval(() => {
  const now = Date.now()
  for (const [connectionId, conn] of activeConnections) {
    if (now - conn.lastActivity > CONNECTION_TIMEOUT) {
      try {
        conn.controller.close()
      } catch {}
      activeConnections.delete(connectionId)
    }
  }
}, 60000) // 1분마다 정리

// Vercel 종료 시 정리
if (typeof process !== 'undefined') {
  process.on('beforeExit', () => {
    clearInterval(cleanupInterval)
    for (const [, conn] of activeConnections) {
      try {
        conn.controller.close()
      } catch {}
    }
    activeConnections.clear()
  })
}

// GET: SSE로 실시간 알림 스트리밍
export async function GET(req: NextRequest) {
  try {
    const session = await requireAuthAPI()
    if (session instanceof NextResponse) {
      return session
    }

    const userId = session.user.id
    const encoder = new TextEncoder()
    const connectionId = `notification-${userId}-${Date.now()}`

    // 사용자당 연결 수 제한
    const userConnections = Array.from(activeConnections.entries()).filter(
      ([id]) => id.startsWith(`notification-${userId}-`)
    )

    if (userConnections.length >= MAX_CONNECTIONS_PER_USER) {
      // 가장 오래된 연결 닫기
      const oldestConnection = userConnections.sort(
        (a, b) => a[1].lastActivity - b[1].lastActivity
      )[0]
      if (oldestConnection) {
        try {
          oldestConnection[1].controller.close()
        } catch {}
        activeConnections.delete(oldestConnection[0])
      }
    }

    // ReadableStream 생성
    const stream = new ReadableStream({
      async start(controller) {
        // 연결 등록
        activeConnections.set(connectionId, {
          controller,
          lastActivity: Date.now(),
        })
        // 연결 성공 메시지
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'connected' })}\n\n`)
        )

        // 초기 읽지 않은 알림 수 전송
        const unreadCount = await prisma.notification.count({
          where: { userId, isRead: false },
        })

        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: 'unreadCount', count: unreadCount })}\n\n`
          )
        )

        // 최근 알림 10개 전송
        const recentNotifications = await prisma.notification.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                username: true,
                image: true,
              },
            },
          },
        })

        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: 'initial',
              notifications: recentNotifications.map((n) => ({
                ...n,
                resourceIds: n.resourceIds ? JSON.parse(n.resourceIds) : null,
              })),
            })}\n\n`
          )
        )

        // 실시간 알림 리스너
        const notificationHandler = (data: {
          userId: string
          notification: {
            id: string
            type: string
            title: string
            message: string | null
            isRead: boolean
            createdAt: string
            senderId: string | null
            resourceIds: {
              postId?: string
              commentId?: string
              communityId?: string
            } | null
            sender?: {
              id: string
              name: string | null
              username: string | null
              image: string | null
            } | null
          }
        }) => {
          if (data.userId === userId) {
            // 활성 연결 체크 및 활동 시간 업데이트
            const connection = activeConnections.get(connectionId)
            if (!connection) return

            try {
              connection.lastActivity = Date.now()
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    type: 'notification',
                    data: data.notification,
                  })}\n\n`
                )
              )
            } catch {
              // 연결이 끊어진 경우
              cleanup()
            }
          }
        }

        // 정리 함수
        const cleanup = () => {
          notificationEmitter.removeListener(
            'notification',
            notificationHandler
          )
          activeConnections.delete(connectionId)
          if (heartbeatInterval) {
            clearInterval(heartbeatInterval)
          }
        }

        // 이벤트 리스너 등록
        notificationEmitter.on('notification', notificationHandler)

        // 2분마다 heartbeat (메모리 사용량 줄이기)
        const heartbeatInterval = setInterval(() => {
          const connection = activeConnections.get(connectionId)
          if (!connection) {
            clearInterval(heartbeatInterval)
            return
          }

          try {
            connection.lastActivity = Date.now()
            controller.enqueue(encoder.encode(':heartbeat\n\n'))
          } catch {
            cleanup()
          }
        }, 120000) // 2분으로 변경

        // 클린업
        req.signal.addEventListener('abort', cleanup)
      },
    })

    // SSE 응답 반환
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    })
  } catch (error) {
    return handleError(error)
  }
}
