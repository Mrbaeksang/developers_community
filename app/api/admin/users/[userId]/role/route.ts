import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { GlobalRole } from '@prisma/client'

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await auth()
    const { userId } = await params

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 관리자 권한 확인
    const admin = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { globalRole: true },
    })

    if (!admin || admin.globalRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { role } = await req.json()

    if (!role || !Object.values(GlobalRole).includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    // 자기 자신의 역할 변경 방지
    if (userId === session.user.id && role !== 'ADMIN') {
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
