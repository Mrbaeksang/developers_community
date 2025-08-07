import { NextRequest } from 'next/server'
import { prisma } from '@/lib/core/prisma'
import { z } from 'zod'
import {
  requireCommunityRoleAPI,
  hasCommunityPermission,
} from '@/lib/auth/session'
import { CommunityRole } from '@prisma/client'
import { successResponse, validationErrorResponse } from '@/lib/api/response'
import {
  handleError,
  throwNotFoundError,
  throwValidationError,
  throwAuthorizationError,
} from '@/lib/api/errors'
import { withSecurity } from '@/lib/security/compatibility'

// 댓글 수정 스키마
const updateCommentSchema = z.object({
  content: z
    .string()
    .min(1, '댓글 내용을 입력해주세요.')
    .max(1000, '댓글은 1000자 이하로 작성해주세요.'),
})

// 댓글 수정 - PATCH /api/communities/[id]/comments/[commentId]
async function updateCommunityComment(
  request: NextRequest,
  context: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const resolvedParams = await context.params
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
      throwNotFoundError('커뮤니티를 찾을 수 없습니다')
    }

    const actualCommunityId = community.id

    // 멤버십 확인 (MEMBER 이상)
    const session = await requireCommunityRoleAPI(actualCommunityId, [
      CommunityRole.MEMBER,
    ])
    if (session instanceof Response) {
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
      throwNotFoundError('댓글을 찾을 수 없습니다')
    }

    // 커뮤니티 ID 일치 확인
    if (existingComment.post.communityId !== actualCommunityId) {
      throwValidationError('잘못된 요청입니다')
    }

    // 작성자 확인
    if (existingComment.authorId !== userId) {
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

    return successResponse(
      {
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
      },
      '댓글이 수정되었습니다'
    )
  } catch (error) {
    return handleError(error)
  }
}

// 댓글 삭제 - DELETE /api/communities/[id]/comments/[commentId]
async function deleteCommunityComment(
  request: NextRequest,
  context: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const resolvedParams = await context.params
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
      throwNotFoundError('커뮤니티를 찾을 수 없습니다')
    }

    const actualCommunityId = community.id

    // 멤버십 확인 (MEMBER 이상)
    const session = await requireCommunityRoleAPI(actualCommunityId, [
      CommunityRole.MEMBER,
    ])
    if (session instanceof Response) {
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
      throwNotFoundError('댓글을 찾을 수 없습니다')
    }

    // 커뮤니티 ID 일치 확인
    if (existingComment.post.communityId !== actualCommunityId) {
      throwValidationError('잘못된 요청입니다')
    }

    // 권한 확인 (작성자 본인 또는 MODERATOR 이상)
    const isAuthor = existingComment.authorId === userId
    const hasModeratorPermission = await hasCommunityPermission(
      userId,
      actualCommunityId,
      [CommunityRole.MODERATOR, CommunityRole.ADMIN, CommunityRole.OWNER]
    )

    if (!isAuthor && !hasModeratorPermission) {
      throwAuthorizationError('댓글 삭제 권한이 없습니다')
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

    return successResponse({}, '댓글이 삭제되었습니다')
  } catch (error) {
    return handleError(error)
  }
}

// CSRF 보호 적용
export const PATCH = withSecurity(updateCommunityComment, { requireCSRF: true })
export const DELETE = withSecurity(deleteCommunityComment, {
  requireCSRF: true,
})
