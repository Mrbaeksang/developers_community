import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// GET: SSE로 실시간 알림 스트리밍
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      )
    }

    // SSE 응답 헤더 설정
    const encoder = new TextEncoder()
    const stream = new TransformStream()
    const writer = stream.writable.getWriter()

    // 5초마다 새로운 알림 확인 (실제로는 Redis Pub/Sub나 WebSocket이 더 좋음)
    const intervalId = setInterval(async () => {
      try {
        const notifications = await prisma.notification.findMany({
          where: {
            userId: session.user.id,
            isRead: false,
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        })

        const data = {
          count: notifications.length,
          notifications: notifications.map((n) => ({
            id: n.id,
            type: n.type,
            title: n.title,
            message: n.message,
            isRead: n.isRead,
            createdAt: n.createdAt,
          })),
        }

        await writer.write(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
      } catch (error) {
        console.error('Failed to fetch notifications:', error)
        clearInterval(intervalId)
        await writer.close()
      }
    }, 5000)

    // 요청이 취소되면 interval 정리
    req.signal.addEventListener('abort', () => {
      clearInterval(intervalId)
      writer.close()
    })

    // SSE 헤더 설정
    const response = new Response(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })

    return response
  } catch (error) {
    console.error('Failed to stream notifications:', error)
    return NextResponse.json(
      { error: '알림 스트리밍에 실패했습니다.' },
      { status: 500 }
    )
  }
}
