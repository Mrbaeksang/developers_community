import { NextRequest } from 'next/server'
import { prisma } from '@/lib/core/prisma'
import { requireCommunityMembershipAPI } from '@/lib/auth/session'
import { successResponse } from '@/lib/api/response'
import { handleError, throwNotFoundError } from '@/lib/api/errors'
import { withRateLimiting } from '@/lib/security/compatibility'
import { ActionCategory } from '@/lib/security/actions'

// POST: 커뮤니티 게시글 북마크
async function bookmarkCommunityPost(
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

    // 트랜잭션으로 북마크 생성을 원자적으로 처리
    const result = await prisma.$transaction(async (tx) => {
      // 이미 북마크가 있는지 먼저 확인
      const existingBookmark = await tx.communityBookmark.findUnique({
        where: {
          userId_postId: {
            userId: session.user.id,
            postId: postId,
          },
        },
      })

      // 이미 북마크가 있으면 그대로 반환
      if (existingBookmark) {
        return { bookmarked: true, created: false }
      }

      // upsert로 중복 방지 (Race Condition 해결)
      await tx.communityBookmark.upsert({
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

      return { bookmarked: true, created: true }
    })

    return successResponse(
      { bookmarked: true },
      result.created ? '북마크에 저장되었습니다' : '이미 북마크한 게시글입니다'
    )
  } catch (error) {
    return handleError(error)
  }
}

// Rate Limiting 적용 - 새로운 Rate Limiting 시스템 사용
export const POST = withRateLimiting(bookmarkCommunityPost, {
  action: ActionCategory.POST_BOOKMARK,
  enablePatternDetection: true,
  enableAbuseTracking: true,
})

// DELETE: 커뮤니티 게시글 북마크 취소
async function unbookmarkCommunityPost(
  req: NextRequest,
  context: { params: Promise<{ id: string; postId: string }> }
) {
  try {
    const { id, postId } = await context.params
    const session = await requireCommunityMembershipAPI(id)
    if (session instanceof Response) {
      return session
    }

    // 트랜잭션으로 북마크 삭제를 원자적으로 처리
    const result = await prisma.$transaction(async (tx) => {
      // 북마크 삭제
      const deleted = await tx.communityBookmark.deleteMany({
        where: {
          userId: session.user.id,
          postId: postId,
        },
      })

      return { bookmarked: false, deleted: deleted.count > 0 }
    })

    return successResponse(
      { bookmarked: false },
      result.deleted
        ? '북마크가 해제되었습니다'
        : '북마크하지 않은 게시글입니다'
    )
  } catch (error) {
    return handleError(error)
  }
}

// Rate Limiting 적용 - 북마크 취소도 동일한 제한 사용
export const DELETE = withRateLimiting(unbookmarkCommunityPost, {
  action: ActionCategory.POST_BOOKMARK,
  enablePatternDetection: true,
  enableAbuseTracking: true,
})
