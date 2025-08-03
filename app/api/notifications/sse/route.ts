import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { notificationEmitter } from '@/lib/notification-emitter'
import { handleError } from '@/lib/error-handler'
import { requireAuthAPI } from '@/lib/auth-utils'

// GET: SSE로 실시간 알림 스트리밍
export async function GET(req: NextRequest) {
  try {
    const session = await requireAuthAPI()
    if (session instanceof NextResponse) {
      return session
    }

    const userId = session.user.id
    const encoder = new TextEncoder()

    // ReadableStream 생성
    const stream = new ReadableStream({
      async start(controller) {
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
            try {
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
              notificationEmitter.removeListener(
                'notification',
                notificationHandler
              )
            }
          }
        }

        // 이벤트 리스너 등록
        notificationEmitter.on('notification', notificationHandler)

        // 30초마다 heartbeat
        const heartbeatInterval = setInterval(() => {
          try {
            controller.enqueue(encoder.encode(':heartbeat\n\n'))
          } catch {
            clearInterval(heartbeatInterval)
          }
        }, 30000)

        // 클린업
        req.signal.addEventListener('abort', () => {
          clearInterval(heartbeatInterval)
          notificationEmitter.removeListener(
            'notification',
            notificationHandler
          )
        })
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
