import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { faker } from '@faker-js/faker'

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

    const body = await request.json()
    const { count = 5 } = body

    // 사용 가능한 사용자 가져오기
    const users = await prisma.user.findMany({ select: { id: true } })

    if (users.length === 0) {
      return NextResponse.json(
        { error: '커뮤니티를 생성하기 위한 사용자가 없습니다.' },
        { status: 400 }
      )
    }

    const communities = []
    for (let i = 0; i < count; i++) {
      const name = faker.company.name()
      const slug = faker.helpers.slugify(name).toLowerCase()

      // 중복 체크
      const existing = await prisma.community.findUnique({ where: { slug } })
      if (existing) continue

      const community = await prisma.community.create({
        data: {
          name,
          slug,
          description: faker.company.catchPhrase(),
          ownerId: faker.helpers.arrayElement(users).id,
          memberCount: 1,
        },
      })

      // 소유자를 멤버로 추가
      await prisma.communityMember.create({
        data: {
          userId: community.ownerId,
          communityId: community.id,
          role: 'OWNER',
        },
      })

      // 기본 카테고리 생성
      await prisma.communityCategory.create({
        data: {
          name: '일반',
          slug: 'general',
          description: '일반적인 토론을 위한 공간',
          communityId: community.id,
        },
      })

      // 기본 채팅 채널 생성
      await prisma.chatChannel.create({
        data: {
          name: 'general',
          description: '일반 채팅',
          isDefault: true,
          communityId: community.id,
        },
      })

      communities.push(community)
    }

    return NextResponse.json({
      success: true,
      message: `${communities.length}개의 커뮤니티가 생성되었습니다.`,
      communities: communities.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
      })),
    })
  } catch (error) {
    console.error('Failed to create test communities:', error)
    return NextResponse.json(
      { error: '테스트 커뮤니티 생성에 실패했습니다.' },
      { status: 500 }
    )
  }
}
