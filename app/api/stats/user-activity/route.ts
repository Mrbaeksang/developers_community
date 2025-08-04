import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { redis } from '@/lib/redis'
import { requireRoleAPI } from '@/lib/auth-utils'
import { subDays, format } from 'date-fns'

export async function GET() {
  try {
    // 인증 확인 (관리자만)
    const authResult = await requireRoleAPI(['ADMIN', 'MANAGER'])
    if (authResult instanceof NextResponse) {
      return authResult
    }

    // Redis에서 캐시 확인
    const client = redis()
    const cacheKey = 'stats:user-activity'

    if (client) {
      const cached = await client.get(cacheKey)
      if (cached) {
        return NextResponse.json({
          success: true,
          data: JSON.parse(cached),
        })
      }
    }

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
        SELECT user_id, created_at FROM "MainPost" WHERE created_at >= ${last30Days}
        UNION ALL
        SELECT user_id, created_at FROM "MainComment" WHERE created_at >= ${last30Days}
        UNION ALL
        SELECT user_id, created_at FROM "CommunityPost" WHERE created_at >= ${last30Days}
        UNION ALL
        SELECT user_id, created_at FROM "CommunityComment" WHERE created_at >= ${last30Days}
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
          SELECT user_id, created_at FROM "MainPost"
          UNION ALL
          SELECT user_id, created_at FROM "MainComment"
          UNION ALL
          SELECT user_id, created_at FROM "CommunityPost"
          UNION ALL
          SELECT user_id, created_at FROM "CommunityComment"
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
          SELECT user_id FROM "MainPost" WHERE created_at >= ${last7Days}
          UNION ALL
          SELECT user_id FROM "MainComment" WHERE created_at >= ${last7Days}
          UNION ALL
          SELECT user_id FROM "CommunityPost" WHERE created_at >= ${last7Days}
          UNION ALL
          SELECT user_id FROM "CommunityComment" WHERE created_at >= ${last7Days}
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
        SELECT created_at FROM "MainPost" WHERE created_at >= ${last7Days}
        UNION ALL
        SELECT created_at FROM "MainComment" WHERE created_at >= ${last7Days}
        UNION ALL
        SELECT created_at FROM "CommunityPost" WHERE created_at >= ${last7Days}
        UNION ALL
        SELECT created_at FROM "CommunityComment" WHERE created_at >= ${last7Days}
      ) as activities
      GROUP BY EXTRACT(HOUR FROM created_at)
      ORDER BY hour
    `

    // 5. 가장 활발한 사용자 TOP 10
    const topUsers = await prisma.$queryRaw<
      Array<{
        user_id: string
        username: string
        activity_count: bigint
        posts: bigint
        comments: bigint
      }>
    >`
      WITH user_activities AS (
        SELECT 
          u.id as user_id,
          u.username,
          COUNT(mp.id) as posts,
          COUNT(mc.id) + COUNT(cc.id) as comments,
          COUNT(mp.id) + COUNT(mc.id) + COUNT(cc.id) + COUNT(cp.id) as total_activities
        FROM "User" u
        LEFT JOIN "MainPost" mp ON u.id = mp.user_id AND mp.created_at >= ${last7Days}
        LEFT JOIN "MainComment" mc ON u.id = mc.user_id AND mc.created_at >= ${last7Days}
        LEFT JOIN "CommunityPost" cp ON u.id = cp.user_id AND cp.created_at >= ${last7Days}
        LEFT JOIN "CommunityComment" cc ON u.id = cc.user_id AND cc.created_at >= ${last7Days}
        GROUP BY u.id, u.username
      )
      SELECT 
        user_id,
        username,
        total_activities as activity_count,
        posts,
        comments
      FROM user_activities
      WHERE total_activities > 0
      ORDER BY total_activities DESC
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
        username: u.username,
        totalActivities: Number(u.activity_count),
        posts: Number(u.posts),
        comments: Number(u.comments),
      })),
      generatedAt: new Date().toISOString(),
    }

    // Redis에 캐시 (10분)
    if (client) {
      await client.setex(cacheKey, 600, JSON.stringify(result))
    }

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error('User activity stats error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch user activity statistics',
      },
      { status: 500 }
    )
  }
}
