import { NextRequest } from 'next/server'
import { prisma } from '@/lib/core/prisma'
import { requireCommunityMembershipAPI } from '@/lib/auth/session'
import { successResponse } from '@/lib/api/response'
import {
  handleError,
  throwNotFoundError,
  throwValidationError,
} from '@/lib/api/errors'
import { withRateLimit } from '@/lib/api/rate-limit'

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

    // 이미 북마크 했는지 확인
    const existingBookmark = await prisma.communityBookmark.findUnique({
      where: {
        userId_postId: {
          userId: session.user.id,
          postId: postId,
        },
      },
    })

    if (existingBookmark) {
      throwValidationError('이미 북마크한 게시글입니다')
    }

    // 북마크 생성
    await prisma.communityBookmark.create({
      data: {
        userId: session.user.id,
        postId: postId,
      },
    })

    return successResponse({ bookmarked: true }, '북마크에 저장되었습니다')
  } catch (error) {
    return handleError(error)
  }
}

// Rate Limiting 적용 - 북마크는 분당 60회로 제한
export const POST = withRateLimit(bookmarkCommunityPost, 'general')

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

    // 북마크 삭제
    const result = await prisma.communityBookmark.deleteMany({
      where: {
        userId: session.user.id,
        postId: postId,
      },
    })

    if (result.count === 0) {
      throwValidationError('북마크하지 않은 게시글입니다')
    }

    return successResponse({ bookmarked: false }, '북마크가 해제되었습니다')
  } catch (error) {
    return handleError(error)
  }
}

// Rate Limiting 적용 - 북마크 취소도 분당 60회로 제한
export const DELETE = withRateLimit(unbookmarkCommunityPost, 'general')
