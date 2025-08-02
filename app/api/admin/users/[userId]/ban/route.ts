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
    const adminUserId = result.user.id

    // 자기 자신을 차단하는 것 방지
    if (userId === adminUserId) {
      return NextResponse.json(
        { error: 'Cannot ban yourself' },
        { status: 400 }
      )
    }

    const { banReason, banUntil } = await req.json()

    if (!banReason) {
      return NextResponse.json(
        { error: 'Ban reason is required' },
        { status: 400 }
      )
    }

    // 사용자 차단
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        isBanned: true,
        banReason,
        banUntil: banUntil ? new Date(banUntil) : null,
        // 차단 시 활성 상태도 비활성화
        isActive: false,
      },
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error banning user:', error)
    return NextResponse.json({ error: 'Failed to ban user' }, { status: 500 })
  }
}
