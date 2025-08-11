import { requireRoleAPI } from '@/lib/auth/session'
import { prisma } from '@/lib/core/prisma'
import {
  createPostApprovedNotification,
  createPostRejectedNotification,
} from '@/lib/notifications'
import { successResponse, errorResponse } from '@/lib/api/response'
import { handleError } from '@/lib/api/errors'
import { redisCache } from '@/lib/cache/redis'
import { approvePostSchema } from '@/lib/validations/admin'
import { handleZodError } from '@/lib/api/validation-error'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await requireRoleAPI(['ADMIN', 'MANAGER'])
    if (session instanceof Response) {
      return session
    }

    const body = await request.json()

    // Zod로 검증
    const result = approvePostSchema.safeParse(body)
    if (!result.success) {
      return handleZodError(result.error)
    }

    const { action, reason } = result.data

    // 현재 게시글 정보 조회 (태그 포함)
    const currentPost = await prisma.mainPost.findUnique({
      where: { id },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    })

    if (!currentPost) {
      return errorResponse('게시글을 찾을 수 없습니다.', 404)
    }

    // 게시글 상태 업데이트
    const post = await prisma.mainPost.update({
      where: { id },
      data: {
        status: action === 'approve' ? 'PUBLISHED' : 'REJECTED',
        approvedAt: action === 'approve' ? new Date() : null,
        approvedById: action === 'approve' ? session.user.id : null,
        rejectedReason: action === 'reject' ? reason : null,
      },
      include: {
        author: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    // 태그 카운트 업데이트 (승인 시에만)
    if (action === 'approve' && currentPost.tags.length > 0) {
      const tagIds = currentPost.tags.map((t) => t.tagId)
      await prisma.mainTag.updateMany({
        where: {
          id: { in: tagIds },
        },
        data: {
          postCount: { increment: 1 },
        },
      })
    }

    // 알림 발송
    if (action === 'approve') {
      await createPostApprovedNotification(
        post.id,
        post.author.id,
        post.title,
        session.user.id
      )
    } else {
      await createPostRejectedNotification(
        post.id,
        post.author.id,
        post.title,
        reason || '기준에 맞지 않음',
        session.user.id
      )
    }

    // Redis 캐시 무효화 - 승인/거부 시 관련 캐시 삭제
    await redisCache.delPattern('api:cache:main:posts:*')
    await redisCache.delPattern('api:cache:admin:main:posts:*')
    await redisCache.delPattern(`api:cache:main:post:detail:*${id}*`)

    return successResponse(
      {
        post: {
          id: post.id,
          status: post.status,
          approvedAt: post.approvedAt?.toISOString() || undefined,
          rejectedReason: post.rejectedReason,
        },
      },
      action === 'approve'
        ? '게시글이 승인되었습니다.'
        : '게시글이 거부되었습니다.'
    )
  } catch (error) {
    return handleError(error)
  }
}
