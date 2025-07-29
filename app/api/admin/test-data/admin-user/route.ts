import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { GlobalRole } from '@prisma/client'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    // 관리자 권한 확인
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { globalRole: true },
    })

    if (!currentUser || !['ADMIN'].includes(currentUser.globalRole)) {
      return NextResponse.json(
        { error: '관리자 권한이 필요합니다.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { role = 'MANAGER' } = body

    if (!['ADMIN', 'MANAGER'].includes(role)) {
      return NextResponse.json(
        { error: '유효하지 않은 역할입니다.' },
        { status: 400 }
      )
    }

    const timestamp = Date.now()
    const user = await prisma.user.create({
      data: {
        email: `${role.toLowerCase()}-${timestamp}@test.com`,
        name: `테스트 ${role === 'ADMIN' ? '관리자' : '매니저'}`,
        username: `test_${role.toLowerCase()}_${timestamp}`,
        bio: `테스트용 ${role === 'ADMIN' ? '관리자' : '매니저'} 계정입니다.`,
        globalRole: role as GlobalRole,
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        globalRole: true,
      },
    })

    return NextResponse.json({
      success: true,
      message: `${role} 권한의 계정이 생성되었습니다.`,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        globalRole: user.globalRole,
      },
    })
  } catch (error) {
    console.error('Failed to create admin user:', error)
    return NextResponse.json(
      { error: '관리자 계정 생성에 실패했습니다.' },
      { status: 500 }
    )
  }
}
