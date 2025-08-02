import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRoleAPI } from '@/lib/auth-utils'

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const result = await requireRoleAPI(['ADMIN', 'MANAGER'])
    if (result instanceof NextResponse) return result
    const { userId } = await params
    const adminUserId = result.user.id

    // 자기 자신의 활성 상태 변경 방지
    if (userId === adminUserId) {
      return NextResponse.json(
        { error: 'Cannot change your own active status' },
        { status: 400 }
      )
    }

    const { isActive } = await req.json()

    // 차단된 사용자는 활성화할 수 없음
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { isBanned: true },
    })

    if (targetUser?.isBanned && isActive) {
      return NextResponse.json(
        { error: 'Cannot activate banned user' },
        { status: 400 }
      )
    }

    // 활성 상태 변경
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        isActive,
      },
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error changing user active status:', error)
    return NextResponse.json(
      { error: 'Failed to change user active status' },
      { status: 500 }
    )
  }
}
