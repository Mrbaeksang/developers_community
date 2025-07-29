import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import {
  createPostCommentNotification,
  createCommentReplyNotification,
} from '@/lib/notifications'
import { checkBanStatus, unauthorized } from '@/lib/auth-helpers'

// GET /api/main/posts/[id]/comments - 댓글 목록 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // 게시글 존재 확인
    const post = await prisma.mainPost.findUnique({
      where: { id },
    })

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // 댓글 목록 조회 (계층형 구조)
    const comments = await prisma.mainComment.findMany({
      where: {
        postId: id,
        parentId: null, // 최상위 댓글만 조회
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        replies: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ comments })
  } catch (error) {
    console.error('Failed to fetch comments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    )
  }
}

// POST /api/main/posts/[id]/comments - 댓글 작성
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
    const { content, parentId } = await request.json()

    // 입력값 검증
    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      )
    }

    // 게시글 존재 확인
    const post = await prisma.mainPost.findUnique({
      where: { id },
    })

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // 대댓글인 경우 부모 댓글 확인
    let parentComment = null
    if (parentId) {
      parentComment = await prisma.mainComment.findUnique({
        where: { id: parentId },
        include: {
          author: {
            select: { id: true },
          },
        },
      })

      if (!parentComment || parentComment.postId !== id) {
        return NextResponse.json(
          { error: 'Parent comment not found' },
          { status: 404 }
        )
      }
    }

    // 현재 사용자의 전역 역할 확인 (authorRole 저장을 위해)
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { globalRole: true },
    })

    if (!user) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 댓글 생성
    const comment = await prisma.mainComment.create({
      data: {
        content: content.trim(),
        authorId: session.user.id,
        authorRole: user.globalRole, // 작성 시점의 역할 저장
        postId: id,
        parentId: parentId || null,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    })

    // 댓글 수 증가
    const updatedPost = await prisma.mainPost.update({
      where: { id },
      data: { commentCount: { increment: 1 } },
      include: {
        author: {
          select: { id: true },
        },
      },
    })

    // 알림 생성
    if (parentComment) {
      // 대댓글인 경우 - 부모 댓글 작성자에게 알림
      if (parentComment.author.id !== session.user.id) {
        await createCommentReplyNotification(
          id,
          parentComment.author.id,
          session.user.id,
          content.trim(),
          comment.id
        )
      }
    } else {
      // 일반 댓글인 경우 - 게시글 작성자에게 알림
      if (updatedPost.author.id !== session.user.id) {
        await createPostCommentNotification(
          id,
          updatedPost.author.id,
          session.user.id,
          updatedPost.title,
          content.trim()
        )
      }
    }

    return NextResponse.json({ comment }, { status: 201 })
  } catch (error) {
    console.error('Failed to create comment:', error)
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    )
  }
}
