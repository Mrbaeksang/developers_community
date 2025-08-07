import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/core/prisma'
import {
  createPostCommentNotification,
  createCommentReplyNotification,
} from '@/lib/notifications'
import { requireAuthAPI, checkBanStatus } from '@/lib/auth/session'
import {
  successResponse,
  errorResponse,
  createdResponse,
} from '@/lib/api/response'
import { handleError } from '@/lib/api/errors'
import { formatTimeAgo } from '@/lib/ui/date'
import { withRateLimiting } from '@/lib/security/compatibility'
import { ActionCategory } from '@/lib/security/actions'
import { withSecurity } from '@/lib/security/compatibility'
import { redisCache, REDIS_TTL, generateCacheKey } from '@/lib/cache/redis'

// GET /api/main/posts/[id]/comments - 댓글 목록 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Redis 캐시 키 생성
    const cacheKey = generateCacheKey('main:post:comments', { postId: id })

    // Redis 캐싱 적용 - 댓글은 3분 캐싱
    const cachedData = await redisCache.getOrSet(
      cacheKey,
      async () => {
        // 게시글 존재 확인
        const post = await prisma.mainPost.findUnique({
          where: { id },
        })

        if (!post) {
          return null
        }

        // 댓글 목록 조회 (계층형 구조)
        const comments = await prisma.mainComment.findMany({
          where: {
            postId: id,
            parentId: null, // 최상위 댓글만 조회
          },
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
            replies: {
              include: {
                author: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    image: true,
                  },
                },
              },
              orderBy: {
                createdAt: 'asc',
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        })

        // 날짜 포맷팅 추가
        const formattedComments = comments.map((comment) => ({
          ...comment,
          createdAt: comment.createdAt.toISOString(),
          updatedAt: comment.updatedAt.toISOString(),
          timeAgo: formatTimeAgo(comment.createdAt),
          replies: comment.replies.map((reply) => ({
            ...reply,
            createdAt: reply.createdAt.toISOString(),
            updatedAt: reply.updatedAt.toISOString(),
            timeAgo: formatTimeAgo(reply.createdAt),
          })),
        }))

        return { comments: formattedComments }
      },
      REDIS_TTL.API_SHORT * 3 // 3분 캐싱
    )

    if (!cachedData) {
      return errorResponse('게시글을 찾을 수 없습니다.', 404)
    }

    return successResponse(cachedData)
  } catch (error) {
    return handleError(error)
  }
}

// POST /api/main/posts/[id]/comments - 댓글 작성
async function createComment(
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
    const { content, parentId } = await request.json()

    // 입력값 검증
    if (!content || content.trim().length === 0) {
      return errorResponse('댓글 내용을 입력해주세요.', 400)
    }

    // 게시글 존재 확인
    const post = await prisma.mainPost.findUnique({
      where: { id },
    })

    if (!post) {
      return errorResponse('게시글을 찾을 수 없습니다.', 404)
    }

    // 대댓글인 경우 부모 댓글 확인
    let parentComment = null
    if (parentId) {
      parentComment = await prisma.mainComment.findUnique({
        where: { id: parentId },
        include: {
          author: {
            select: { id: true },
          },
        },
      })

      if (!parentComment || parentComment.postId !== id) {
        return errorResponse('부모 댓글을 찾을 수 없습니다.', 404)
      }
    }

    // 현재 사용자의 전역 역할 확인 (authorRole 저장을 위해)
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { globalRole: true },
    })

    if (!user) {
      return errorResponse('사용자를 찾을 수 없습니다.', 404)
    }

    // 댓글 생성
    const comment = await prisma.mainComment.create({
      data: {
        content: content.trim(),
        authorId: session.user.id,
        authorRole: user.globalRole, // 작성 시점의 역할 저장
        postId: id,
        parentId: parentId || null,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    })

    // 댓글 수 증가
    const updatedPost = await prisma.mainPost.update({
      where: { id },
      data: { commentCount: { increment: 1 } },
      include: {
        author: {
          select: { id: true },
        },
      },
    })

    // 알림 생성
    if (parentComment) {
      // 대댓글인 경우 - 부모 댓글 작성자에게 알림
      if (parentComment.author.id !== session.user.id) {
        await createCommentReplyNotification(
          id,
          parentComment.author.id,
          session.user.id,
          content.trim(),
          comment.id
        )
      }
    } else {
      // 일반 댓글인 경우 - 게시글 작성자에게 알림
      if (updatedPost.author.id !== session.user.id) {
        await createPostCommentNotification(
          id,
          updatedPost.author.id,
          session.user.id,
          updatedPost.title,
          content.trim()
        )
      }
    }

    // Redis 캐시 무효화 - 댓글이 추가되었으므로 캐시 삭제
    await redisCache.del(generateCacheKey('main:post:comments', { postId: id }))

    // 날짜 포맷팅 추가
    const formattedComment = {
      ...comment,
      createdAt: comment.createdAt.toISOString(),
      updatedAt: comment.updatedAt.toISOString(),
      timeAgo: formatTimeAgo(comment.createdAt),
    }

    return createdResponse(
      { comment: formattedComment },
      '댓글이 작성되었습니다.'
    )
  } catch (error) {
    return handleError(error)
  }
}

// Rate Limiting과 CSRF 보호 적용 - 새로운 Rate Limiting 시스템 사용
export const POST = withSecurity(
  withRateLimiting(createComment, {
    action: ActionCategory.COMMENT_CREATE,
    enablePatternDetection: true,
    enableAbuseTracking: true,
  }),
  { requireCSRF: true }
)
