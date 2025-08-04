import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { requireAuthAPI, checkBanStatus } from '@/lib/auth-utils'
import { successResponse, errorResponse } from '@/lib/api-response'
import { handleError } from '@/lib/error-handler'
import { withRateLimit } from '@/lib/rate-limiter'

// POST /api/main/posts/[id]/bookmark - 북마크 토글
async function toggleBookmark(
  request: NextRequest,
  context?: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuthAPI()
    if (session instanceof NextResponse) {
      return session
    }

    // Ban 상태 체크
    await checkBanStatus(session.user.id)

    if (!context) {
      return errorResponse('Invalid request context', 400)
    }
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
      // 북마크 취소
      await prisma.mainBookmark.delete({
        where: {
          id: existingBookmark.id,
        },
      })

      return successResponse({ bookmarked: false })
    } else {
      // 북마크 추가
      await prisma.mainBookmark.create({
        data: {
          userId,
          postId: id,
        },
      })

      return successResponse({ bookmarked: true })
    }
  } catch (error) {
    return handleError(error)
  }
}

// Rate Limiting 적용 - 북마크는 분당 60회로 제한
export const POST = withRateLimit(toggleBookmark, 'general')

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
