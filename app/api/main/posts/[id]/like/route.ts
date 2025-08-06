import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/core/prisma'
import { createPostLikeNotification } from '@/lib/notifications'
import { requireAuthAPI, checkBanStatus } from '@/lib/auth/session'
import { successResponse, errorResponse } from '@/lib/api/response'
import { handleError } from '@/lib/api/errors'
import { withRateLimit } from '@/lib/api/rate-limit'

// POST /api/main/posts/[id]/like - 좋아요 토글
async function toggleLike(
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

    // 이미 좋아요했는지 확인
    const existingLike = await prisma.mainLike.findUnique({
      where: {
        userId_postId: {
          userId,
          postId: id,
        },
      },
    })

    if (existingLike) {
      // 좋아요 취소 - 트랜잭션으로 처리
      try {
        await prisma.$transaction(async (tx) => {
          // 좋아요 삭제 (존재하는 경우에만)
          await tx.mainLike.deleteMany({
            where: {
              userId,
              postId: id,
            },
          })

          // 좋아요 수 감소
          await tx.mainPost.update({
            where: { id },
            data: { likeCount: { decrement: 1 } },
          })
        })

        return successResponse({ liked: false })
      } catch {
        // 이미 삭제된 경우 무시
        return successResponse({ liked: false })
      }
    } else {
      // 좋아요 추가 - upsert로 처리
      try {
        const result = await prisma.$transaction(async (tx) => {
          // upsert로 중복 방지
          await tx.mainLike.upsert({
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

          // 좋아요 수 증가
          const updatedPost = await tx.mainPost.update({
            where: { id },
            data: { likeCount: { increment: 1 } },
            include: {
              author: {
                select: { id: true },
              },
            },
          })

          return updatedPost
        })

        // 알림 생성 (작성자가 자신이 아닌 경우)
        if (result.author.id !== userId) {
          await createPostLikeNotification(
            id,
            result.author.id,
            userId,
            result.title
          )
        }

        return successResponse({ liked: true })
      } catch {
        // 이미 좋아요한 경우 무시
        return successResponse({ liked: true })
      }
    }
  } catch (error) {
    return handleError(error)
  }
}

// Rate Limiting 적용 - 좋아요는 분당 60회로 제한
export const POST = withRateLimit(toggleLike, 'general')

// GET /api/main/posts/[id]/like - 좋아요 상태 확인
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return successResponse({ liked: false })
    }

    const { id } = await params
    const userId = session.user.id

    const like = await prisma.mainLike.findUnique({
      where: {
        userId_postId: {
          userId,
          postId: id,
        },
      },
    })

    return successResponse({ liked: !!like })
  } catch (error) {
    return handleError(error)
  }
}
