import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { GlobalRole } from '@prisma/client'
import { requireRoleAPI } from '@/lib/auth-utils'

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const result = await requireRoleAPI(['ADMIN'])
    if (result instanceof NextResponse) return result
    const { userId } = await params
    const adminUserId = result.user.id

    const { role } = await req.json()

    if (!role || !Object.values(GlobalRole).includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    // 자기 자신의 역할 변경 방지
    if (userId === adminUserId && role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Cannot change your own role' },
        { status: 400 }
      )
    }

    // 역할 변경
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        globalRole: role,
      },
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error changing user role:', error)
    return NextResponse.json(
      { error: 'Failed to change user role' },
      { status: 500 }
    )
  }
}
