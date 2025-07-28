import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import {
  checkBanStatus,
  checkCommunityMembership,
  unauthorized,
} from '@/lib/auth-helpers'

// GET: 커뮤니티 게시글 댓글 목록 조회
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string; postId: string }> }
) {
  try {
    const { id, postId } = await context.params

    // 게시글 존재 확인
    const post = await prisma.communityPost.findUnique({
      where: {
        id: postId,
        communityId: id,
      },
    })

    if (!post) {
      return NextResponse.json(
        { error: '게시글을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 댓글 조회 (계층 구조)
    const comments = await prisma.communityComment.findMany({
      where: {
        postId: postId,
        parentId: null, // 최상위 댓글만
      },
      include: {
        author: {
          select: { id: true, name: true, email: true, image: true },
        },
        replies: {
          include: {
            author: {
              select: { id: true, name: true, email: true, image: true },
            },
            replies: {
              include: {
                author: {
                  select: { id: true, name: true, email: true, image: true },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ comments })
  } catch (error) {
    console.error('Failed to fetch comments:', error)
    return NextResponse.json(
      { error: '댓글을 불러오는데 실패했습니다.' },
      { status: 500 }
    )
  }
}

// POST: 커뮤니티 게시글 댓글 작성
const createCommentSchema = z.object({
  content: z.string().min(1, '댓글 내용을 입력해주세요').max(1000),
  parentId: z.string().optional(),
})

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string; postId: string }> }
) {
  try {
    const { id, postId } = await context.params
    const session = await auth()

    if (!session?.user?.id) {
      return unauthorized()
    }

    // Ban 상태 체크
    await checkBanStatus(session.user.id)

    // 커뮤니티 멤버십 확인
    await checkCommunityMembership(session.user.id, id)

    const post = await prisma.communityPost.findUnique({
      where: {
        id: postId,
        communityId: id,
      },
    })

    if (!post) {
      return NextResponse.json(
        { error: '게시글을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    const body = await req.json()
    const validation = createCommentSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      )
    }

    const { content, parentId } = validation.data

    // 부모 댓글 확인
    if (parentId) {
      const parentComment = await prisma.communityComment.findUnique({
        where: { id: parentId, postId: postId },
      })

      if (!parentComment) {
        return NextResponse.json(
          { error: '부모 댓글을 찾을 수 없습니다.' },
          { status: 400 }
        )
      }

      // 대댓글의 대댓글까지만 허용 (depth 2)
      if (parentComment.parentId) {
        const grandParent = await prisma.communityComment.findUnique({
          where: { id: parentComment.parentId },
        })
        if (grandParent?.parentId) {
          return NextResponse.json(
            { error: '더 이상 답글을 작성할 수 없습니다.' },
            { status: 400 }
          )
        }
      }
    }

    // 댓글 생성
    const comment = await prisma.communityComment.create({
      data: {
        content,
        authorId: session.user.id,
        postId: postId,
        parentId,
      },
      include: {
        author: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
    })

    // 게시글 댓글 수 증가
    await prisma.communityPost.update({
      where: { id: postId },
      data: { commentCount: { increment: 1 } },
    })

    return NextResponse.json(comment, { status: 201 })
  } catch (error) {
    console.error('Failed to create comment:', error)
    return NextResponse.json(
      { error: '댓글 작성에 실패했습니다.' },
      { status: 500 }
    )
  }
}
