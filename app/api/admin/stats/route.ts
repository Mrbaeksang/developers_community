import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { checkGlobalRole } from '@/lib/auth-helpers'
import { redis } from '@/lib/redis'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    // 관리자 권한 확인
    const roleError = await checkGlobalRole(session.user.id, [
      'ADMIN',
      'MANAGER',
    ])
    if (roleError) {
      return NextResponse.json({ error: roleError }, { status: 403 })
    }

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

      // 활성 방문자 수
      const activeVisitors = await redisClient.scard('active_visitors')

      // 오늘 조회수
      const today = new Date().toISOString().split('T')[0]
      const todayViews = await redisClient.hget('daily_views', today)

      realtime = {
        activeVisitors: activeVisitors || 0,
        todayViews: todayViews ? parseInt(todayViews) : 0,
      }
    } catch (redisError) {
      console.error('Redis error:', redisError)
      // Redis 오류 시에도 기본 통계는 반환
    }

    return NextResponse.json({
      users,
      mainPosts,
      mainComments,
      communities,
      communityPosts,
      tags,
      realtime,
    })
  } catch (error) {
    console.error('Failed to fetch stats:', error)
    return NextResponse.json(
      { error: '통계 조회에 실패했습니다.' },
      { status: 500 }
    )
  }
}
