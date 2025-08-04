import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRoleAPI } from '@/lib/auth-utils'
import { redis } from '@/lib/redis'
import { successResponse } from '@/lib/api-response'
import { handleError } from '@/lib/error-handler'

export async function GET() {
  try {
    const result = await requireRoleAPI(['ADMIN', 'MANAGER'])
    if (result instanceof NextResponse) return result

    // 통계 데이터 가져오기
    const [users, mainPosts, mainComments, communities, communityPosts, tags] =
      await Promise.all([
        prisma.user.count(),
        prisma.mainPost.count(),
        prisma.mainComment.count(),
        prisma.community.count(),
        prisma.communityPost.count(),
        prisma.mainTag.count(),
      ])

    // 실시간 데이터 가져오기
    let realtime = {
      activeVisitors: 0,
      todayViews: 0,
    }

    try {
      const redisClient = redis()
      if (!redisClient) {
        console.warn('Redis client not available for admin stats')
      } else {
        // 활성 방문자 수
        const activeVisitors = await redisClient.scard('active_visitors')

        // 오늘 조회수
        const today = new Date().toISOString().split('T')[0]
        const todayViews = await redisClient.hget('daily_views', today)

        realtime = {
          activeVisitors: activeVisitors || 0,
          todayViews: todayViews ? parseInt(todayViews) : 0,
        }
      }
    } catch (redisError) {
      console.error('Redis error:', redisError)
      // Redis 오류 시에도 기본 통계는 반환
    }

    return successResponse({
      users,
      mainPosts,
      mainComments,
      communities,
      communityPosts,
      tags,
      realtime,
    })
  } catch (error) {
    return handleError(error)
  }
}
