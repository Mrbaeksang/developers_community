import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// DELETE: 특정 알림 삭제
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      )
    }

    const resolvedParams = await params
    const notificationId = resolvedParams.id

    // 알림 존재 여부 및 소유권 확인
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
      select: { userId: true },
    })

    if (!notification) {
      return NextResponse.json(
        { error: '알림을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    if (notification.userId !== session.user.id) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
    }

    // 알림 삭제
    await prisma.notification.delete({
      where: { id: notificationId },
    })

    return NextResponse.json({
      message: '알림이 삭제되었습니다.',
    })
  } catch (error) {
    console.error('Failed to delete notification:', error)
    return NextResponse.json(
      { error: '알림 삭제에 실패했습니다.' },
      { status: 500 }
    )
  }
}
