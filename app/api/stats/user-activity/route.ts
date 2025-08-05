import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRoleAPI } from '@/lib/auth-utils'
import { subDays, format } from 'date-fns'
import { redisCache, REDIS_TTL, generateCacheKey } from '@/lib/redis-cache'
import { successResponse } from '@/lib/api-response'
import { handleError } from '@/lib/error-handler'

export async function GET() {
  try {
    // 인증 확인 (관리자만)
    const authResult = await requireRoleAPI(['ADMIN', 'MANAGER'])
    if (authResult instanceof NextResponse) {
      return authResult
    }

    // Redis 캐시 키 생성
    const cacheKey = generateCacheKey('stats:user-activity', {})

    // 날짜 범위 설정
    const now = new Date()
    const last30Days = subDays(now, 30)
    const last7Days = subDays(now, 7)

    // 1. 일일 활성 사용자 통계
    const dailyActiveUsers = await prisma.$queryRaw<
      Array<{ date: Date; active_users: bigint }>
    >`
      SELECT 
        DATE(created_at) as date,
        COUNT(DISTINCT user_id) as active_users
      FROM (
        SELECT user_id, created_at FROM main_posts WHERE created_at >= ${last30Days}
        UNION ALL
        SELECT user_id, created_at FROM main_comments WHERE created_at >= ${last30Days}
        UNION ALL
        SELECT user_id, created_at FROM community_posts WHERE created_at >= ${last30Days}
        UNION ALL
        SELECT user_id, created_at FROM community_comments WHERE created_at >= ${last30Days}
      ) as activities
      GROUP BY DATE(created_at)
      ORDER BY date DESC
      LIMIT 30
    `

    // 2. 사용자 활동 유형별 통계
    const activityTypes = await prisma.$transaction([
      prisma.mainPost.count({
        where: { createdAt: { gte: last7Days } },
      }),
      prisma.mainComment.count({
        where: { createdAt: { gte: last7Days } },
      }),
      prisma.communityPost.count({
        where: { createdAt: { gte: last7Days } },
      }),
      prisma.communityComment.count({
        where: { createdAt: { gte: last7Days } },
      }),
      prisma.mainLike.count({
        where: { createdAt: { gte: last7Days } },
      }),
      prisma.communityLike.count({
        where: { createdAt: { gte: last7Days } },
      }),
    ])

    // 3. 신규 사용자 vs 기존 사용자 활동
    const newVsReturning = await prisma.$queryRaw<
      Array<{ user_type: string; count: bigint }>
    >`
      WITH user_first_activity AS (
        SELECT 
          user_id,
          MIN(created_at) as first_activity
        FROM (
          SELECT user_id, created_at FROM main_posts
          UNION ALL
          SELECT user_id, created_at FROM main_comments
          UNION ALL
          SELECT user_id, created_at FROM community_posts
          UNION ALL
          SELECT user_id, created_at FROM community_comments
        ) as all_activities
        GROUP BY user_id
      )
      SELECT 
        CASE 
          WHEN first_activity >= ${last7Days} THEN 'new'
          ELSE 'returning'
        END as user_type,
        COUNT(DISTINCT user_id) as count
      FROM user_first_activity
      WHERE user_id IN (
        SELECT DISTINCT user_id FROM (
          SELECT user_id FROM main_posts WHERE created_at >= ${last7Days}
          UNION ALL
          SELECT user_id FROM main_comments WHERE created_at >= ${last7Days}
          UNION ALL
          SELECT user_id FROM community_posts WHERE created_at >= ${last7Days}
          UNION ALL
          SELECT user_id FROM community_comments WHERE created_at >= ${last7Days}
        ) as recent_activities
      )
      GROUP BY user_type
    `

    // 4. 시간대별 활동 분포
    const hourlyActivity = await prisma.$queryRaw<
      Array<{ hour: number; activity_count: bigint }>
    >`
      SELECT 
        EXTRACT(HOUR FROM created_at) as hour,
        COUNT(*) as activity_count
      FROM (
        SELECT created_at FROM main_posts WHERE created_at >= ${last7Days}
        UNION ALL
        SELECT created_at FROM main_comments WHERE created_at >= ${last7Days}
        UNION ALL
        SELECT created_at FROM community_posts WHERE created_at >= ${last7Days}
        UNION ALL
        SELECT created_at FROM community_comments WHERE created_at >= ${last7Days}
      ) as activities
      GROUP BY EXTRACT(HOUR FROM created_at)
      ORDER BY hour
    `

    // 5. 가장 활발한 사용자 TOP 10 - 최적화된 쿼리
    const topUsers = await prisma.$queryRaw<
      Array<{
        user_id: string
        username: string | null
        name: string | null
        image: string | null
        activity_count: bigint
        posts: bigint
        comments: bigint
      }>
    >`
      WITH user_activities AS (
        SELECT 
          user_id,
          'post' as activity_type,
          created_at
        FROM main_posts 
        WHERE created_at >= ${last7Days}
        UNION ALL
        SELECT 
          user_id,
          'comment' as activity_type,
          created_at
        FROM main_comments 
        WHERE created_at >= ${last7Days}
        UNION ALL
        SELECT 
          user_id,
          'post' as activity_type,
          created_at
        FROM community_posts 
        WHERE created_at >= ${last7Days}
        UNION ALL
        SELECT 
          user_id,
          'comment' as activity_type,
          created_at
        FROM community_comments 
        WHERE created_at >= ${last7Days}
      ),
      user_stats AS (
        SELECT 
          user_id,
          COUNT(*) as total_activities,
          COUNT(CASE WHEN activity_type = 'post' THEN 1 END) as posts,
          COUNT(CASE WHEN activity_type = 'comment' THEN 1 END) as comments
        FROM user_activities
        GROUP BY user_id
      )
      SELECT 
        us.user_id,
        u.username,
        u.name,
        u.image,
        us.total_activities as activity_count,
        us.posts,
        us.comments
      FROM user_stats us
      INNER JOIN users u ON us.user_id = u.id
      WHERE u.is_active = true AND u.is_banned = false
      ORDER BY us.total_activities DESC
      LIMIT 10
    `

    // 결과 정리
    const result = {
      dailyActiveUsers: dailyActiveUsers.map((d) => ({
        date: format(d.date, 'yyyy-MM-dd'),
        activeUsers: Number(d.active_users),
      })),
      activityBreakdown: {
        mainPosts: activityTypes[0],
        mainComments: activityTypes[1],
        communityPosts: activityTypes[2],
        communityComments: activityTypes[3],
        mainLikes: activityTypes[4],
        communityLikes: activityTypes[5],
      },
      userTypes: {
        new: Number(
          newVsReturning.find((u) => u.user_type === 'new')?.count || 0
        ),
        returning: Number(
          newVsReturning.find((u) => u.user_type === 'returning')?.count || 0
        ),
      },
      hourlyDistribution: hourlyActivity.map((h) => ({
        hour: Number(h.hour),
        count: Number(h.activity_count),
      })),
      topUsers: topUsers.map((u) => ({
        userId: u.user_id,
        username: u.username || undefined,
        name: u.name || 'Unknown',
        image: u.image || undefined,
        totalActivities: Number(u.activity_count),
        posts: Number(u.posts),
        comments: Number(u.comments),
      })),
      generatedAt: new Date().toISOString(),
    }

    // Redis 캐싱 적용
    const cachedData = await redisCache.getOrSet(
      cacheKey,
      async () => result,
      REDIS_TTL.API_MEDIUM // 10분 캐싱
    )

    return successResponse(cachedData)
  } catch (error) {
    return handleError(error)
  }
}
