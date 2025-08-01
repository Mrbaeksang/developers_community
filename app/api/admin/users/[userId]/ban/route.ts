import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
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

    // 자기 자신을 차단하는 것 방지
    if (userId === session.user.id) {
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
