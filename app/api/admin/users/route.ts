import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 관리자 권한 확인
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { globalRole: true },
    })

    if (
      !user ||
      (user.globalRole !== 'ADMIN' && user.globalRole !== 'MANAGER')
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 모든 사용자 조회
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        globalRole: true,
        isActive: true,
        isBanned: true,
        banReason: true,
        banUntil: true,
        emailVerified: true,
        createdAt: true,
        _count: {
          select: {
            mainPosts: true,
            communityPosts: true,
            mainComments: true,
            communityComments: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}
