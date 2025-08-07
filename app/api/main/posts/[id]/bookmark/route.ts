import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/core/prisma'
import { requireAuthAPI, checkBanStatus } from '@/lib/auth/session'
import { successResponse, errorResponse } from '@/lib/api/response'
import { handleError } from '@/lib/api/errors'
import { withRateLimiting } from '@/lib/security/compatibility'
import { ActionCategory } from '@/lib/security/actions'

// POST /api/main/posts/[id]/bookmark - 북마크 토글
async function toggleBookmark(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuthAPI()
    if (session instanceof NextResponse) {
      return session
    }

    // Ban 상태 체크
    await checkBanStatus(session.user.id)

    const { id } = await context.params
    const userId = session.user.id

    // 게시글 존재 확인
    const post = await prisma.mainPost.findUnique({
      where: { id },
    })

    if (!post) {
      return errorResponse('Post not found', 404)
    }

    // 이미 북마크했는지 확인
    const existingBookmark = await prisma.mainBookmark.findUnique({
      where: {
        userId_postId: {
          userId,
          postId: id,
        },
      },
    })

    if (existingBookmark) {
      // 북마크 취소 - deleteMany로 안전하게 처리
      try {
        await prisma.mainBookmark.deleteMany({
          where: {
            userId,
            postId: id,
          },
        })

        return successResponse({ bookmarked: false })
      } catch {
        // 이미 삭제된 경우 무시
        return successResponse({ bookmarked: false })
      }
    } else {
      // 북마크 추가 - upsert로 중복 방지
      try {
        await prisma.mainBookmark.upsert({
          where: {
            userId_postId: {
              userId,
              postId: id,
            },
          },
          create: {
            userId,
            postId: id,
          },
          update: {}, // 이미 존재하면 아무것도 하지 않음
        })

        return successResponse({ bookmarked: true })
      } catch {
        // 이미 북마크한 경우 무시
        return successResponse({ bookmarked: true })
      }
    }
  } catch (error) {
    return handleError(error)
  }
}

// Rate Limiting 적용 - 새로운 Rate Limiting 시스템 사용
export const POST = withRateLimiting(toggleBookmark, {
  action: ActionCategory.POST_BOOKMARK,
  enablePatternDetection: true,
  enableAbuseTracking: true,
})

// GET /api/main/posts/[id]/bookmark - 북마크 상태 확인
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return successResponse({ bookmarked: false })
    }

    const { id } = await params
    const userId = session.user.id

    const bookmark = await prisma.mainBookmark.findUnique({
      where: {
        userId_postId: {
          userId,
          postId: id,
        },
      },
    })

    return successResponse({ bookmarked: !!bookmark })
  } catch (error) {
    return handleError(error)
  }
}
