import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { NotificationType } from '@prisma/client'
import { successResponse } from '@/lib/api-response'
import { handleError, throwValidationError } from '@/lib/error-handler'
import { requireAuthAPI } from '@/lib/auth-utils'
import { formatTimeAgo } from '@/lib/date-utils'

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
    const session = await requireAuthAPI()
    if (session instanceof NextResponse) {
      return session
    }

    const { searchParams } = new URL(req.url)

    // 빈 문자열을 undefined로 변환
    const type = searchParams.get('type')
    const unreadOnly = searchParams.get('unreadOnly')
    const page = searchParams.get('page')
    const limit = searchParams.get('limit')

    const validatedParams = notificationFilterSchema.parse({
      type: type && type !== '' ? type : undefined,
      unreadOnly: unreadOnly && unreadOnly !== '' ? unreadOnly : undefined,
      page: page && page !== '' ? page : undefined,
      limit: limit && limit !== '' ? limit : undefined,
    })

    const {
      type: validatedType,
      unreadOnly: validatedUnreadOnly,
      page: validatedPage,
      limit: validatedLimit,
    } = validatedParams
    const skip = (validatedPage - 1) * validatedLimit

    // 조건 설정
    const where = {
      userId: session.user.id,
      ...(validatedType && { type: validatedType }),
      ...(validatedUnreadOnly && { isRead: false }),
    }

    // 알림 조회
    const [notifications, total, unreadCount] = await Promise.all([
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
        take: validatedLimit,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({
        where: {
          userId: session.user.id,
          isRead: false,
        },
      }),
    ])

    // resourceIds JSON 파싱 및 날짜 포맷팅
    const formattedNotifications = notifications.map((notification) => ({
      ...notification,
      resourceIds: notification.resourceIds
        ? JSON.parse(notification.resourceIds)
        : null,
      createdAt: notification.createdAt.toISOString(),
      timeAgo: formatTimeAgo(notification.createdAt),
    }))

    return successResponse({
      notifications: formattedNotifications,
      pagination: {
        total,
        page: validatedPage,
        limit: validatedLimit,
        totalPages: Math.ceil(total / validatedLimit),
      },
      unreadCount,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw throwValidationError(error.issues[0].message)
    }
    return handleError(error)
  }
}

// SSE는 /api/notifications/sse 로 이동됨
