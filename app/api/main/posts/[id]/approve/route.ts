import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import {
  createPostApprovedNotification,
  createPostRejectedNotification,
} from '@/lib/notifications'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      )
    }

    // 관리자 권한 확인
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { globalRole: true },
    })

    if (
      !user ||
      (user.globalRole !== 'ADMIN' && user.globalRole !== 'MANAGER')
    ) {
      return NextResponse.json(
        { error: '승인 권한이 없습니다.' },
        { status: 403 }
      )
    }

    const { action, reason } = await request.json()

    // 게시글 상태 업데이트
    const post = await prisma.mainPost.update({
      where: { id },
      data: {
        status: action === 'approve' ? 'PUBLISHED' : 'REJECTED',
        approvedAt: action === 'approve' ? new Date() : null,
        approvedById: action === 'approve' ? session.user.id : null,
        rejectedReason: action === 'reject' ? reason : null,
      },
      include: {
        author: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    // 알림 발송
    if (action === 'approve') {
      await createPostApprovedNotification(
        post.id,
        post.author.id,
        post.title,
        session.user.id
      )
    } else {
      await createPostRejectedNotification(
        post.id,
        post.author.id,
        post.title,
        reason || '기준에 맞지 않음',
        session.user.id
      )
    }

    return NextResponse.json({
      message:
        action === 'approve'
          ? '게시글이 승인되었습니다.'
          : '게시글이 거부되었습니다.',
      post: {
        id: post.id,
        status: post.status,
        approvedAt: post.approvedAt,
        rejectedReason: post.rejectedReason,
      },
    })
  } catch (error) {
    console.error('게시글 승인/거부 실패:', error)
    return NextResponse.json(
      { error: '승인/거부 처리에 실패했습니다.' },
      { status: 500 }
    )
  }
}
