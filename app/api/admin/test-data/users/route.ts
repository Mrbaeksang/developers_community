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

    const {
      count = 1,
      name,
      email,
      globalRole = 'USER',
      image,
    } = await request.json()

    const users = []
    for (let i = 0; i < count; i++) {
      // 단일 생성이고 모든 필드가 제공된 경우
      if (count === 1 && name && email) {
        const user = await prisma.user.create({
          data: {
            email,
            name,
            username: email.split('@')[0].substring(0, 20), // email에서 username 생성
            globalRole,
            image: image || null,
            bio: faker.person.bio(),
          },
        })
        users.push(user)
      } else {
        // 대량 생성 또는 필드가 없는 경우 faker 사용
        const firstName = faker.person.firstName()
        const lastName = faker.person.lastName()
        const username = faker.internet
          .userName({ firstName, lastName })
          .toLowerCase()

        const user = await prisma.user.create({
          data: {
            email: faker.internet.email({ firstName, lastName }).toLowerCase(),
            name: `${lastName}${firstName}`,
            username: username.substring(0, 20),
            bio: faker.person.bio(),
            globalRole: 'USER',
            image: null,
          },
        })
        users.push(user)
      }
    }

    return NextResponse.json({
      success: true,
      message: `${count}명의 테스트 사용자가 생성되었습니다.`,
      users: users.map((u) => ({
        id: u.id,
        name: u.name,
        username: u.username,
        email: u.email,
      })),
    })
  } catch (error) {
    console.error('Failed to create test users:', error)
    return NextResponse.json(
      { error: '테스트 사용자 생성에 실패했습니다.' },
      { status: 500 }
    )
  }
}
