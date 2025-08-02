import { NextResponse } from 'next/server'
import { requireRoleAPI } from '@/lib/auth-utils'
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
    const session = await requireRoleAPI(['ADMIN', 'MANAGER'])
    if (session instanceof NextResponse) {
      return session
    }

    const { action, reason } = await request.json()

    // 현재 게시글 정보 조회 (태그 포함)
    const currentPost = await prisma.mainPost.findUnique({
      where: { id },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    })

    if (!currentPost) {
      return NextResponse.json(
        { error: '게시글을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

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

    // 태그 카운트 업데이트 (승인 시에만)
    if (action === 'approve' && currentPost.tags.length > 0) {
      const tagIds = currentPost.tags.map((t) => t.tagId)
      await prisma.mainTag.updateMany({
        where: {
          id: { in: tagIds },
        },
        data: {
          postCount: { increment: 1 },
        },
      })
    }

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
