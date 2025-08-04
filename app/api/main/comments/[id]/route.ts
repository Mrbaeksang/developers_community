import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { requireAuthAPI, checkBanStatus, hasPermission } from '@/lib/auth-utils'
import { successResponse, validationErrorResponse } from '@/lib/api-response'
import {
  handleError,
  throwNotFoundError,
  throwAuthorizationError,
} from '@/lib/error-handler'
import { withCSRFProtection } from '@/lib/csrf'

// 댓글 수정 스키마
const updateCommentSchema = z.object({
  content: z
    .string()
    .min(1, '댓글 내용을 입력해주세요.')
    .max(1000, '댓글은 1000자 이하로 작성해주세요.'),
})

// 댓글 수정 - PUT /api/main/comments/[id]
async function updateComment(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuthAPI()
    if (session instanceof Response) {
      return session
    }

    // Ban 상태 체크
    await checkBanStatus(session.user.id)

    const resolvedParams = await params
    const commentId = resolvedParams.id

    // 기존 댓글 조회
    const existingComment = await prisma.mainComment.findUnique({
      where: { id: commentId },
      select: {
        id: true,
        authorId: true,
        content: true,
      },
    })

    if (!existingComment) {
      throwNotFoundError('댓글을 찾을 수 없습니다')
    }

    // 작성자 확인
    if (existingComment.authorId !== session.user.id) {
      throwAuthorizationError('댓글 수정 권한이 없습니다')
    }

    // 요청 데이터 검증
    const body = await request.json()
    const validation = updateCommentSchema.safeParse(body)

    if (!validation.success) {
      const errors: Record<string, string[]> = {}
      validation.error.issues.forEach((issue) => {
        const field = issue.path.join('.')
        if (!errors[field]) {
          errors[field] = []
        }
        errors[field].push(issue.message)
      })
      return validationErrorResponse(errors)
    }

    const validatedData = validation.data

    // 댓글 수정
    const updatedComment = await prisma.mainComment.update({
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
            image: true,
          },
        },
      },
    })

    return successResponse({
      comment: {
        id: updatedComment.id,
        content: updatedComment.content,
        isEdited: updatedComment.isEdited,
        createdAt: updatedComment.createdAt.toISOString(),
        updatedAt: updatedComment.updatedAt.toISOString(),
        author: {
          id: updatedComment.author.id,
          name: updatedComment.author.name || 'Unknown',
          image: updatedComment.author.image || undefined,
        },
        parentId: updatedComment.parentId,
      },
    })
  } catch (error) {
    return handleError(error)
  }
}

// 댓글 삭제 - DELETE /api/main/comments/[id]
async function deleteComment(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuthAPI()
    if (session instanceof Response) {
      return session
    }

    // Ban 상태 체크
    await checkBanStatus(session.user.id)

    const resolvedParams = await params
    const commentId = resolvedParams.id

    // 기존 댓글 조회
    const existingComment = await prisma.mainComment.findUnique({
      where: { id: commentId },
      select: {
        id: true,
        authorId: true,
        postId: true,
        parentId: true,
        _count: {
          select: {
            replies: true,
          },
        },
      },
    })

    if (!existingComment) {
      throwNotFoundError('댓글을 찾을 수 없습니다')
    }

    // 권한 확인 (작성자 본인 또는 ADMIN/MANAGER)
    const isAuthor = existingComment.authorId === session.user.id
    const hasAdminPermission = await hasPermission(session.user.id, [
      'ADMIN',
      'MANAGER',
    ])

    if (!isAuthor && !hasAdminPermission) {
      throwAuthorizationError('댓글 삭제 권한이 없습니다')
    }

    // 대댓글이 있는 경우 처리
    if (existingComment._count.replies > 0) {
      // 대댓글이 있으면 내용만 삭제 표시 (소프트 삭제)
      await prisma.mainComment.update({
        where: { id: commentId },
        data: {
          content: '삭제된 댓글입니다.',
          isEdited: true,
        },
      })
    } else {
      // 대댓글이 없으면 완전 삭제
      await prisma.mainComment.delete({
        where: { id: commentId },
      })

      // 게시글 댓글 수 업데이트
      await prisma.mainPost.update({
        where: { id: existingComment.postId },
        data: {
          commentCount: {
            decrement: 1,
          },
        },
      })
    }

    return successResponse({ deleted: true }, '댓글이 삭제되었습니다')
  } catch (error) {
    return handleError(error)
  }
}

// CSRF 보호 적용
export const PUT = withCSRFProtection(updateComment)
export const DELETE = withCSRFProtection(deleteComment)
