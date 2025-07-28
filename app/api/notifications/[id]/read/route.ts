import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// PUT: 특정 알림 읽음 처리
export async function PUT(
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
      select: { userId: true, isRead: true },
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
