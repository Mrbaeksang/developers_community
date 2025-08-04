import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireCommunityMembershipAPI } from '@/lib/auth-utils'
import { successResponse } from '@/lib/api-response'
import {
  handleError,
  throwNotFoundError,
  throwValidationError,
} from '@/lib/error-handler'
import { withRateLimit } from '@/lib/rate-limiter'

// POST: 커뮤니티 게시글 좋아요
async function likeCommunityPost(
  req: NextRequest,
  context?: { params: Promise<{ id: string; postId: string }> }
) {
  try {
    if (!context) {
      throwValidationError('Invalid request context')
    }
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

    // 이미 좋아요 했는지 확인
    const existingLike = await prisma.communityLike.findUnique({
      where: {
        userId_postId: {
          userId: session.user.id,
          postId: postId,
        },
      },
    })

    if (existingLike) {
      throwValidationError('이미 좋아요한 게시글입니다')
    }

    // 좋아요 생성
    await prisma.communityLike.create({
      data: {
        userId: session.user.id,
        postId: postId,
      },
    })

    // 좋아요 수 업데이트
    await prisma.communityPost.update({
      where: { id: postId },
      data: { likeCount: { increment: 1 } },
    })

    return successResponse({ liked: true }, '좋아요를 눌렀습니다')
  } catch (error) {
    return handleError(error)
  }
}

// Rate Limiting 적용 - 좋아요는 분당 60회로 제한
export const POST = withRateLimit(likeCommunityPost, 'general')

// DELETE: 커뮤니티 게시글 좋아요 취소
async function unlikeCommunityPost(
  req: NextRequest,
  context?: { params: Promise<{ id: string; postId: string }> }
) {
  try {
    if (!context) {
      throwValidationError('Invalid request context')
    }
    const { id, postId } = await context.params
    const session = await requireCommunityMembershipAPI(id)
    if (session instanceof Response) {
      return session
    }

    // 좋아요 삭제
    const result = await prisma.communityLike.deleteMany({
      where: {
        userId: session.user.id,
        postId: postId,
      },
    })

    if (result.count === 0) {
      throwValidationError('좋아요하지 않은 게시글입니다')
    }

    // 좋아요 수 업데이트
    await prisma.communityPost.update({
      where: { id: postId },
      data: { likeCount: { decrement: 1 } },
    })

    return successResponse({ liked: false }, '좋아요가 취소되었습니다')
  } catch (error) {
    return handleError(error)
  }
}

// Rate Limiting 적용 - 좋아요 취소도 분당 60회로 제한
export const DELETE = withRateLimit(unlikeCommunityPost, 'general')
