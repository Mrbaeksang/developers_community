import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { checkGlobalRole } from '@/lib/auth-helpers'
import { faker } from '@faker-js/faker'

export async function POST(request: NextRequest) {
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

    const { count = 10 } = await request.json()

    const users = []
    for (let i = 0; i < count; i++) {
      const firstName = faker.person.firstName()
      const lastName = faker.person.lastName()
      const username = faker.internet
        .userName({ firstName, lastName })
        .toLowerCase()

      const user = await prisma.user.create({
        data: {
          email: faker.internet.email({ firstName, lastName }).toLowerCase(),
          name: `${lastName}${firstName}`,
          username: username.substring(0, 20), // username은 최대 20자
          bio: faker.person.bio(),
          globalRole: 'USER',
        },
      })

      users.push(user)
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
