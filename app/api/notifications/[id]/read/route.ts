import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { checkBanStatus, unauthorized, forbidden } from '@/lib/auth-helpers'

// PUT: 특정 알림 읽음 처리
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return unauthorized()
    }

    // Ban 상태 체크
    await checkBanStatus(session.user.id)

    const resolvedParams = await params
    const notificationId = resolvedParams.id

    // 알림 존재 여부 및 소유권 확인
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
      select: { userId: true, isRead: true },
    })

    if (!notification) {
      return NextResponse.json(
        { error: '알림을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    if (notification.userId !== session.user.id) {
      return forbidden()
    }

    if (notification.isRead) {
      return NextResponse.json({
        message: '이미 읽은 알림입니다.',
        isRead: true,
      })
    }

    // 읽음 처리
    await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    })

    // 읽지 않은 알림 개수 반환
    const unreadCount = await prisma.notification.count({
      where: {
        userId: session.user.id,
        isRead: false,
      },
    })

    return NextResponse.json({
      message: '알림을 읽음 처리했습니다.',
      isRead: true,
      unreadCount,
    })
  } catch (error) {
    console.error('Failed to mark notification as read:', error)
    return NextResponse.json(
      { error: '알림 읽음 처리에 실패했습니다.' },
      { status: 500 }
    )
  }
}
