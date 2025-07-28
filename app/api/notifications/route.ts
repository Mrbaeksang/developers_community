import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { NotificationType } from '@prisma/client'

// 알림 타입 필터 스키마
const notificationFilterSchema = z.object({
  type: z.nativeEnum(NotificationType).optional(),
  unreadOnly: z.coerce.boolean().optional().default(false),
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(50).optional().default(20),
})

// GET: 알림 목록 조회
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)
    const validatedParams = notificationFilterSchema.parse({
      type: searchParams.get('type'),
      unreadOnly: searchParams.get('unreadOnly'),
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
    })

    const { type, unreadOnly, page, limit } = validatedParams
    const skip = (page - 1) * limit

    // 조건 설정
    const where = {
      userId: session.user.id,
      ...(type && { type }),
      ...(unreadOnly && { isRead: false }),
    }

    // 알림 조회
    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
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
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where }),
    ])

    // 읽지 않은 알림 개수
    const unreadCount = await prisma.notification.count({
      where: {
        userId: session.user.id,
        isRead: false,
      },
    })

    // resourceIds JSON 파싱
    const formattedNotifications = notifications.map((notification) => ({
      ...notification,
      resourceIds: notification.resourceIds
        ? JSON.parse(notification.resourceIds)
        : null,
    }))

    return NextResponse.json({
      notifications: formattedNotifications,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      unreadCount,
    })
  } catch (error) {
    console.error('Failed to fetch notifications:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: '알림 조회에 실패했습니다.' },
      { status: 500 }
    )
  }
}

// SSE (Server-Sent Events) 엔드포인트
export async function SSE(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 })
  }

  const encoder = new TextEncoder()
  const stream = new TransformStream()
  const writer = stream.writable.getWriter()

  // SSE 헤더 설정
  const response = new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })

  // 초기 연결 메시지
  writer.write(encoder.encode('event: connected\ndata: {}\n\n'))

  // 5초마다 알림 확인 (실제로는 Redis Pub/Sub 또는 WebSocket 사용 권장)
  const interval = setInterval(async () => {
    try {
      const unreadCount = await prisma.notification.count({
        where: {
          userId: session.user.id,
          isRead: false,
        },
      })

      // 최신 알림 1개 가져오기
      const latestNotification = await prisma.notification.findFirst({
        where: {
          userId: session.user.id,
          isRead: false,
        },
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
        orderBy: { createdAt: 'desc' },
      })

      const data = {
        unreadCount,
        latest: latestNotification
          ? {
              ...latestNotification,
              resourceIds: latestNotification.resourceIds
                ? JSON.parse(latestNotification.resourceIds)
                : null,
            }
          : null,
      }

      writer.write(
        encoder.encode(`event: notification\ndata: ${JSON.stringify(data)}\n\n`)
      )
    } catch (error) {
      console.error('SSE error:', error)
    }
  }, 5000)

  // 클라이언트 연결 종료 시 정리
  req.signal.addEventListener('abort', () => {
    clearInterval(interval)
    writer.close()
  })

  return response
}
