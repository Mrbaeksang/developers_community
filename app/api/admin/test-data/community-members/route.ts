import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { faker } from '@faker-js/faker'
import { CommunityRole } from '@prisma/client'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    // 관리자 권한 확인
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { globalRole: true },
    })

    if (!user || !['ADMIN', 'MANAGER'].includes(user.globalRole)) {
      return NextResponse.json(
        { error: '관리자 권한이 필요합니다.' },
        { status: 403 }
      )
    }

    const { count = 20 } = await request.json()

    // 커뮤니티와 사용자 정보 가져오기
    const [communities, users] = await Promise.all([
      prisma.community.findMany({
        include: {
          members: {
            select: { userId: true },
          },
        },
      }),
      prisma.user.findMany({ select: { id: true } }),
    ])

    if (communities.length === 0 || users.length === 0) {
      return NextResponse.json(
        { error: '멤버를 추가할 커뮤니티 또는 사용자가 없습니다.' },
        { status: 400 }
      )
    }

    const members = []
    const roles: CommunityRole[] = ['MEMBER', 'MEMBER', 'MEMBER', 'MODERATOR'] // 75% 일반, 25% 모더레이터

    for (let i = 0; i < count; i++) {
      const community = faker.helpers.arrayElement(communities)
      const userId = faker.helpers.arrayElement(users).id

      // 이미 멤버인지 확인
      const isAlreadyMember = community.members.some(
        (m: { userId: string }) => m.userId === userId
      )
      if (isAlreadyMember) continue

      const member = await prisma.communityMember.create({
        data: {
          userId,
          communityId: community.id,
          role: faker.helpers.arrayElement(roles),
        },
      })

      // 멤버 수 증가
      await prisma.community.update({
        where: { id: community.id },
        data: { memberCount: { increment: 1 } },
      })

      members.push(member)
    }

    return NextResponse.json({
      success: true,
      message: `${members.length}명의 커뮤니티 멤버가 추가되었습니다.`,
      members: members.map((m) => ({
        userId: m.userId,
        communityId: m.communityId,
        role: m.role,
      })),
    })
  } catch (error) {
    console.error('Failed to add community members:', error)
    return NextResponse.json(
      { error: '커뮤니티 멤버 추가에 실패했습니다.' },
      { status: 500 }
    )
  }
}
