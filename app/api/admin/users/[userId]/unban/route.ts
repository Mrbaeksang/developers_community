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
