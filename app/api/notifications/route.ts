import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/core/prisma'
import { z } from 'zod'
import { NotificationType } from '@prisma/client'
import { successResponse, validationErrorResponse } from '@/lib/api/response'
import { handleError } from '@/lib/api/errors'
import { requireAuthAPI } from '@/lib/auth/session'
import { formatTimeAgo } from '@/lib/ui/date'
import { redisCache, REDIS_TTL, generateCacheKey } from '@/lib/cache/redis'
import {
  parseHybridPagination,
  getCursorCondition,
  getCursorTake,
  formatCursorResponse,
} from '@/lib/post/pagination'
import { notificationSelect } from '@/lib/cache/patterns'

// 알림 타입 필터 스키마
const notificationFilterSchema = z.object({
  type: z.nativeEnum(NotificationType).optional(),
  unreadOnly: z.coerce.boolean().optional().default(false),
})

// GET: 알림 목록 조회
export async function GET(req: NextRequest) {
  try {
    const session = await requireAuthAPI()
    if (session instanceof NextResponse) {
      return session
    }

    const { searchParams } = new URL(req.url)

    // 하이브리드 페이지네이션 파싱
    const pagination = parseHybridPagination(searchParams)

    // 빈 문자열을 undefined로 변환
    const type = searchParams.get('type')
    const unreadOnly = searchParams.get('unreadOnly')

    const validatedParams = notificationFilterSchema.parse({
      type: type && type !== '' ? type : undefined,
      unreadOnly: unreadOnly && unreadOnly !== '' ? unreadOnly : undefined,
    })

    const { type: validatedType, unreadOnly: validatedUnreadOnly } =
      validatedParams

    // Redis 캐시 키 생성 - 사용자별, 필터별로 캐싱
    const cacheKey = generateCacheKey('user:notifications', {
      userId: session.user.id,
      notificationType: validatedType || 'all',
      unreadOnly: validatedUnreadOnly,
      ...pagination,
    })

    // Redis 캐싱 적용 - 알림은 1분 캐싱 (실시간성 중요)
    const cachedData = await redisCache.getOrSet(
      cacheKey,
      async () => {
        // 조건 설정
        const where = {
          userId: session.user.id,
          ...(validatedType && { type: validatedType }),
          ...(validatedUnreadOnly && { isRead: false }),
        }

        // 커서 기반 페이지네이션
        if (pagination.type === 'cursor') {
          const cursorWhere = {
            ...where,
            ...getCursorCondition(pagination.cursor),
          }

          const [notifications, total, unreadCount] = await Promise.all([
            prisma.notification.findMany({
              where: cursorWhere,
              select: notificationSelect.list,
              orderBy: { createdAt: 'desc' },
              take: getCursorTake(pagination.limit),
            }),
            prisma.notification.count({ where }),
            prisma.notification.count({
              where: {
                userId: session.user.id,
                isRead: false,
              },
            }),
          ])

          const cursorResponse = formatCursorResponse(
            notifications,
            pagination.limit
          )

          // resourceIds JSON 파싱 및 날짜 포맷팅
          const formattedNotifications = cursorResponse.items.map(
            (notification) => ({
              ...notification,
              resourceIds: notification.resourceIds
                ? JSON.parse(notification.resourceIds)
                : null,
              createdAt: notification.createdAt.toISOString(),
              timeAgo: formatTimeAgo(notification.createdAt),
            })
          )

          return {
            notifications: formattedNotifications,
            pagination: {
              limit: pagination.limit,
              nextCursor: cursorResponse.nextCursor,
              hasMore: cursorResponse.hasMore,
              total,
            },
            unreadCount,
          }
        }
        // 기존 오프셋 기반 페이지네이션 (호환성)
        else {
          const skip = (pagination.page - 1) * pagination.limit

          // 알림 조회
          const [notifications, total, unreadCount] = await Promise.all([
            prisma.notification.findMany({
              where,
              select: notificationSelect.list,
              orderBy: { createdAt: 'desc' },
              skip,
              take: pagination.limit,
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

          return {
            notifications: formattedNotifications,
            pagination: {
              total,
              page: pagination.page,
              limit: pagination.limit,
              totalPages: Math.ceil(total / pagination.limit),
            },
            unreadCount,
          }
        }
      },
      REDIS_TTL.API_SHORT // 1분 캐싱
    )

    return successResponse(cachedData)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string[]> = {}
      error.issues.forEach((issue) => {
        const field = issue.path.join('.')
        if (!errors[field]) {
          errors[field] = []
        }
        errors[field].push(issue.message)
      })
      return validationErrorResponse(errors)
    }
    return handleError(error)
  }
}

// SSE는 /api/notifications/sse 로 이동됨
