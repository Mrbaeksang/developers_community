import { NextRequest } from 'next/server'
import { prisma } from '@/lib/core/prisma'
import { requireCommunityMembershipAPI } from '@/lib/auth/session'
import { successResponse } from '@/lib/api/response'
import { handleError, throwNotFoundError } from '@/lib/api/errors'
import { withRateLimiting } from '@/lib/security/compatibility'
import { ActionCategory } from '@/lib/security/actions'

// POST: 커뮤니티 게시글 좋아요
async function likeCommunityPost(
  req: NextRequest,
  context: { params: Promise<{ id: string; postId: string }> }
) {
  try {
    const { id, postId } = await context.params
    const session = await requireCommunityMembershipAPI(id)
    if (session instanceof Response) {
      return session
    }

    // 게시글 존재 확인
    const post = await prisma.communityPost.findUnique({
      where: { id: postId, communityId: id },
    })

    if (!post) {
      throwNotFoundError('게시글을 찾을 수 없습니다')
    }

    // 트랜잭션으로 좋아요 생성과 카운트 업데이트를 원자적으로 처리
    const result = await prisma.$transaction(async (tx) => {
      // 이미 좋아요가 있는지 먼저 확인
      const existingLike = await tx.communityLike.findUnique({
        where: {
          userId_postId: {
            userId: session.user.id,
            postId: postId,
          },
        },
      })

      // 이미 좋아요가 있으면 그대로 반환
      if (existingLike) {
        return { liked: true, created: false }
      }

      // upsert로 중복 방지 (Race Condition 해결)
      await tx.communityLike.upsert({
        where: {
          userId_postId: {
            userId: session.user.id,
            postId: postId,
          },
        },
        create: {
          userId: session.user.id,
          postId: postId,
        },
        update: {}, // 이미 존재하면 아무것도 하지 않음
      })

      // 좋아요 수 업데이트
      await tx.communityPost.update({
        where: { id: postId },
        data: { likeCount: { increment: 1 } },
      })

      return { liked: true, created: true }
    })

    return successResponse(
      { liked: true },
      result.created ? '좋아요를 눌렀습니다' : '이미 좋아요한 게시글입니다'
    )
  } catch (error) {
    return handleError(error)
  }
}

// Rate Limiting 적용 - 새로운 Rate Limiting 시스템 사용
export const POST = withRateLimiting(likeCommunityPost, {
  action: ActionCategory.POST_LIKE,
  enablePatternDetection: true,
  enableAbuseTracking: true,
})

// DELETE: 커뮤니티 게시글 좋아요 취소
async function unlikeCommunityPost(
  req: NextRequest,
  context: { params: Promise<{ id: string; postId: string }> }
) {
  try {
    const { id, postId } = await context.params
    const session = await requireCommunityMembershipAPI(id)
    if (session instanceof Response) {
      return session
    }

    // 트랜잭션으로 좋아요 삭제와 카운트 업데이트를 원자적으로 처리
    const result = await prisma.$transaction(async (tx) => {
      // 좋아요 삭제
      const deleted = await tx.communityLike.deleteMany({
        where: {
          userId: session.user.id,
          postId: postId,
        },
      })

      if (deleted.count === 0) {
        return { liked: false, deleted: false }
      }

      // 좋아요 수 감소 (음수 방지)
      await tx.communityPost.update({
        where: { id: postId },
        data: {
          likeCount: {
            decrement: 1,
          },
        },
      })

      return { liked: false, deleted: true }
    })

    return successResponse(
      { liked: false },
      result.deleted
        ? '좋아요가 취소되었습니다'
        : '좋아요하지 않은 게시글입니다'
    )
  } catch (error) {
    return handleError(error)
  }
}

// Rate Limiting 적용 - 좋아요 취소도 동일한 제한 사용
export const DELETE = withRateLimiting(unlikeCommunityPost, {
  action: ActionCategory.POST_LIKE,
  enablePatternDetection: true,
  enableAbuseTracking: true,
})
