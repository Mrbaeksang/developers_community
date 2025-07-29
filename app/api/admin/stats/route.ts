import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { checkGlobalRole } from '@/lib/auth-helpers'

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

    return NextResponse.json({
      users,
      mainPosts,
      mainComments,
      communities,
      communityPosts,
      tags,
    })
  } catch (error) {
    console.error('Failed to fetch stats:', error)
    return NextResponse.json(
      { error: '통계 조회에 실패했습니다.' },
      { status: 500 }
    )
  }
}
