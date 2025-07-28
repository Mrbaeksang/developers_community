import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// PUT: 모든 알림 읽음 처리
export async function PUT() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      )
    }

    // 읽지 않은 알림 개수 확인
    const unreadCount = await prisma.notification.count({
      where: {
        userId: session.user.id,
        isRead: false,
      },
    })

    if (unreadCount === 0) {
      return NextResponse.json({
        message: '읽지 않은 알림이 없습니다.',
        updatedCount: 0,
      })
    }

    // 모든 알림 읽음 처리
    const result = await prisma.notification.updateMany({
      where: {
        userId: session.user.id,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    })

    return NextResponse.json({
      message: `${result.count}개의 알림을 읽음 처리했습니다.`,
      updatedCount: result.count,
    })
  } catch (error) {
    console.error('Failed to mark all notifications as read:', error)
    return NextResponse.json(
      { error: '알림 읽음 처리에 실패했습니다.' },
      { status: 500 }
    )
  }
}
