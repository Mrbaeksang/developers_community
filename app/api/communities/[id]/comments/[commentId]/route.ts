import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { requireCommunityRoleAPI } from '@/lib/auth-utils'
import { CommunityRole } from '@prisma/client'

// 댓글 수정 스키마
const updateCommentSchema = z.object({
  content: z
    .string()
    .min(1, '댓글 내용을 입력해주세요.')
    .max(1000, '댓글은 1000자 이하로 작성해주세요.'),
})

// 댓글 수정 - PATCH /api/communities/[id]/comments/[commentId]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const resolvedParams = await params
    const communityId = resolvedParams.id
    const commentId = resolvedParams.commentId

    // 커뮤니티 찾기 (ID 또는 slug)
    const community = await prisma.community.findFirst({
      where: {
        OR: [{ id: communityId }, { slug: communityId }],
      },
      select: { id: true },
    })

    if (!community) {
      return NextResponse.json(
        { error: '커뮤니티를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    const actualCommunityId = community.id

    // 멤버십 확인 (MEMBER 이상)
    const session = await requireCommunityRoleAPI(actualCommunityId, [
      CommunityRole.MEMBER,
    ])
    if (session instanceof NextResponse) {
      return session
    }

    const userId = session.session.user.id

    // 기존 댓글 조회 (커뮤니티 멤버십 확인 포함)
    const existingComment = await prisma.communityComment.findUnique({
      where: { id: commentId },
      select: {
        id: true,
        authorId: true,
        content: true,
        post: {
          select: {
            communityId: true,
          },
        },
      },
    })

    if (!existingComment) {
      return NextResponse.json(
        { error: '댓글을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 커뮤니티 ID 일치 확인
    if (existingComment.post.communityId !== actualCommunityId) {
      return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 })
    }

    // 작성자 확인
    if (existingComment.authorId !== userId) {
      return NextResponse.json(
        { error: '댓글 수정 권한이 없습니다.' },
        { status: 403 }
      )
    }

    // 요청 데이터 검증
    const body = await request.json()
    const validatedData = updateCommentSchema.parse(body)

    // 댓글 수정
    const updatedComment = await prisma.communityComment.update({
      where: { id: commentId },
      data: {
        content: validatedData.content,
        isEdited: true,
        updatedAt: new Date(),
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
      },
    })

    return NextResponse.json({
      comment: {
        id: updatedComment.id,
        content: updatedComment.content,
        isEdited: updatedComment.isEdited,
        createdAt: updatedComment.createdAt.toISOString(),
        updatedAt: updatedComment.updatedAt.toISOString(),
        author: {
          id: updatedComment.author.id,
          name: updatedComment.author.name || 'Unknown',
          username: updatedComment.author.username,
          image: updatedComment.author.image || undefined,
        },
        parentId: updatedComment.parentId,
        authorRole: updatedComment.authorRole,
      },
    })
  } catch (error) {
    console.error('커뮤니티 댓글 수정 실패:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: '댓글 수정에 실패했습니다.' },
      { status: 500 }
    )
  }
}

// 댓글 삭제 - DELETE /api/communities/[id]/comments/[commentId]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const resolvedParams = await params
    const communityId = resolvedParams.id
    const commentId = resolvedParams.commentId

    // 커뮤니티 찾기 (ID 또는 slug)
    const community = await prisma.community.findFirst({
      where: {
        OR: [{ id: communityId }, { slug: communityId }],
      },
      select: { id: true },
    })

    if (!community) {
      return NextResponse.json(
        { error: '커뮤니티를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    const actualCommunityId = community.id

    // 멤버십 확인 (MEMBER 이상)
    const session = await requireCommunityRoleAPI(actualCommunityId, [
      CommunityRole.MEMBER,
    ])
    if (session instanceof NextResponse) {
      return session
    }

    const userId = session.session.user.id

    // 기존 댓글 조회
    const existingComment = await prisma.communityComment.findUnique({
      where: { id: commentId },
      select: {
        id: true,
        authorId: true,
        postId: true,
        parentId: true,
        authorRole: true,
        post: {
          select: {
            communityId: true,
          },
        },
        _count: {
          select: {
            replies: true,
          },
        },
      },
    })

    if (!existingComment) {
      return NextResponse.json(
        { error: '댓글을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 커뮤니티 ID 일치 확인
    if (existingComment.post.communityId !== actualCommunityId) {
      return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 })
    }

    // 작성자 또는 커뮤니티 관리자 확인
    const isAuthor = existingComment.authorId === userId
    const isOwner = session.membership.role === 'OWNER'
    const isAdmin = session.membership.role === 'ADMIN'
    const isModerator = session.membership.role === 'MODERATOR'

    // 삭제 권한 체크: 작성자 또는 관리진
    if (!isAuthor && !isOwner && !isAdmin && !isModerator) {
      return NextResponse.json(
        { error: '댓글 삭제 권한이 없습니다.' },
        { status: 403 }
      )
    }

    // 대댓글이 있는 경우 처리
    if (existingComment._count.replies > 0) {
      // 대댓글이 있으면 내용만 삭제 표시 (소프트 삭제)
      await prisma.communityComment.update({
        where: { id: commentId },
        data: {
          content: '삭제된 댓글입니다.',
          isEdited: true,
        },
      })
    } else {
      // 대댓글이 없으면 완전 삭제
      await prisma.communityComment.delete({
        where: { id: commentId },
      })

      // 게시글 댓글 수 업데이트
      await prisma.communityPost.update({
        where: { id: existingComment.postId },
        data: {
          commentCount: {
            decrement: 1,
          },
        },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('커뮤니티 댓글 삭제 실패:', error)
    return NextResponse.json(
      { error: '댓글 삭제에 실패했습니다.' },
      { status: 500 }
    )
  }
}
