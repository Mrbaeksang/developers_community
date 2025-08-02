import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRoleAPI } from '@/lib/auth-utils'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const result = await requireRoleAPI(['ADMIN'])
    if (result instanceof NextResponse) return result
    const { userId } = await params

    // 사용자 차단 해제
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        isBanned: false,
        banReason: null,
        banUntil: null,
        // 차단 해제 시 활성 상태 복구
        isActive: true,
      },
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error unbanning user:', error)
    return NextResponse.json({ error: 'Failed to unban user' }, { status: 500 })
  }
}
