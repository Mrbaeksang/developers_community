import { NextResponse } from 'next/server'
import { requireRoleAPI } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await requireRoleAPI(['ADMIN', 'MANAGER'])
    if (session instanceof NextResponse) {
      return session
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
