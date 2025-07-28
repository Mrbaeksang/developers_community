import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { createPostLikeNotification } from '@/lib/notifications'
import { checkBanStatus, unauthorized } from '@/lib/auth-helpers'

// POST /api/main/posts/[id]/like - 좋아요 토글
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return unauthorized()
    }

    // Ban 상태 체크
    await checkBanStatus(session.user.id)

    const { id } = await params
    const userId = session.user.id

    // 게시글 존재 확인
    const post = await prisma.mainPost.findUnique({
      where: { id },
    })

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // 이미 좋아요했는지 확인
    const existingLike = await prisma.mainLike.findUnique({
      where: {
        userId_postId: {
          userId,
          postId: id,
        },
      },
    })

    if (existingLike) {
      // 좋아요 취소
      await prisma.mainLike.delete({
        where: {
          id: existingLike.id,
        },
      })

      // 좋아요 수 감소
      await prisma.mainPost.update({
        where: { id },
        data: { likeCount: { decrement: 1 } },
      })

      return NextResponse.json({ liked: false })
    } else {
      // 좋아요 추가
      await prisma.mainLike.create({
        data: {
          userId,
          postId: id,
        },
      })

      // 좋아요 수 증가
      const updatedPost = await prisma.mainPost.update({
        where: { id },
        data: { likeCount: { increment: 1 } },
        include: {
          author: {
            select: { id: true },
          },
        },
      })

      // 알림 생성 (작성자가 자신이 아닌 경우)
      if (updatedPost.author.id !== userId) {
        await createPostLikeNotification(
          id,
          updatedPost.author.id,
          userId,
          updatedPost.title
        )
      }

      return NextResponse.json({ liked: true })
    }
  } catch (error) {
    console.error('Failed to toggle like:', error)
    return NextResponse.json(
      { error: 'Failed to toggle like' },
      { status: 500 }
    )
  }
}

// GET /api/main/posts/[id]/like - 좋아요 상태 확인
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ liked: false })
    }

    const { id } = await params
    const userId = session.user.id

    const like = await prisma.mainLike.findUnique({
      where: {
        userId_postId: {
          userId,
          postId: id,
        },
      },
    })

    return NextResponse.json({ liked: !!like })
  } catch (error) {
    console.error('Failed to check like status:', error)
    return NextResponse.json({ liked: false })
  }
}
