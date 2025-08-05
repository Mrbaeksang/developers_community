import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse } from '@/lib/api-response'
import { handleError } from '@/lib/error-handler'
import { redisCache, REDIS_TTL, generateCacheKey } from '@/lib/redis-cache'
import { subDays } from 'date-fns'
import { Prisma } from '@prisma/client'

// 활성 사용자 조회 - GET /api/main/users/active
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '10')
    const period = parseInt(searchParams.get('period') || '7') // 기간 (기본 7일)
    const cursor = searchParams.get('cursor') // 커서 기반 페이지네이션

    // Redis 캐시 키 생성
    const cacheKey = generateCacheKey('main:users:active', {
      limit,
      period,
      cursor: cursor || 'none',
    })

    // Redis 캐싱 적용 - 활성 사용자는 30분 캐싱
    const cachedData = await redisCache.getOrSet(
      cacheKey,
      async () => {
        const now = new Date()
        const periodAgo = subDays(now, period)

        // 활성 사용자 조회 - Raw SQL로 최적화
        const activeUsers = await prisma.$queryRaw<
          Array<{
            id: string
            username: string | null
            name: string | null
            email: string
            image: string | null
            role: string
            post_count: bigint
            comment_count: bigint
            like_count: bigint
            activity_score: number
          }>
        >`
          WITH user_activity AS (
            SELECT 
              u.id,
              u.username,
              u.name,
              u.email,
              u.image,
              u.role,
              COUNT(DISTINCT mp.id) as post_count,
              COUNT(DISTINCT mc.id) as comment_count,
              COUNT(DISTINCT ml.id) as like_count,
              -- 활동 점수: 게시글 3점, 댓글 2점, 좋아요 1점
              (COUNT(DISTINCT mp.id) * 3 + COUNT(DISTINCT mc.id) * 2 + COUNT(DISTINCT ml.id) * 1) as activity_score
            FROM "User" u
            LEFT JOIN "MainPost" mp ON u.id = mp.author_id 
              AND mp.created_at >= ${periodAgo}
              AND mp.status = 'PUBLISHED'
            LEFT JOIN "MainComment" mc ON u.id = mc.author_id 
              AND mc.created_at >= ${periodAgo}
            LEFT JOIN "MainLike" ml ON u.id = ml.user_id 
              AND ml.created_at >= ${periodAgo}
            WHERE u.is_active = true 
              AND u.is_banned = false
              ${cursor ? Prisma.sql`AND u.id < ${cursor}` : Prisma.empty}
            GROUP BY u.id, u.username, u.name, u.email, u.image, u.role
            HAVING COUNT(DISTINCT mp.id) > 0 
               OR COUNT(DISTINCT mc.id) > 0 
               OR COUNT(DISTINCT ml.id) > 0
          )
          SELECT *
          FROM user_activity
          ORDER BY activity_score DESC, id DESC
          LIMIT ${limit + 1}
        `

        // 페이지네이션 처리
        const hasMore = activeUsers.length > limit
        const userList = hasMore ? activeUsers.slice(0, -1) : activeUsers

        // 응답 포맷팅
        const formattedUsers = userList.map((user) => ({
          id: user.id,
          username: user.username || undefined,
          name: user.name || user.email.split('@')[0] || 'Unknown',
          email: user.email,
          image: user.image || undefined,
          role: user.role,
          stats: {
            posts: Number(user.post_count),
            comments: Number(user.comment_count),
            likes: Number(user.like_count),
            activityScore: user.activity_score,
          },
        }))

        return {
          users: formattedUsers,
          hasMore,
          cursor: hasMore ? userList[userList.length - 1].id : null,
        }
      },
      REDIS_TTL.API_LONG / 2 // 30분 캐싱
    )

    return successResponse(cachedData)
  } catch (error) {
    return handleError(error)
  }
}
