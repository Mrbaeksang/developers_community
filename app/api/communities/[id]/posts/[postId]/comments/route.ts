import { NextRequest } from 'next/server'
import { prisma } from '@/lib/core/prisma'
import { z } from 'zod'
import { requireCommunityRoleAPI } from '@/lib/auth/session'
import { CommunityRole } from '@prisma/client'
import {
  successResponse,
  createdResponse,
  validationErrorResponse,
} from '@/lib/api/response'
import {
  handleError,
  throwNotFoundError,
  throwValidationError,
} from '@/lib/api/errors'
import { withRateLimiting } from '@/lib/security/compatibility'
import { ActionCategory } from '@/lib/security/actions'
import { withSecurity } from '@/lib/security/compatibility'
import { formatTimeAgo } from '@/lib/ui/date'
import { redisCache, REDIS_TTL, generateCacheKey } from '@/lib/cache/redis'
import {
  parseHybridPagination,
  getCursorCondition,
  getCursorTake,
  formatCursorResponse,
} from '@/lib/post/pagination'
import { communityCommentSelect } from '@/lib/cache/patterns'

// GET: 커뮤니티 게시글 댓글 목록 조회
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string; postId: string }> }
) {
  try {
    const { id, postId } = await context.params
    const { searchParams } = new URL(req.url)

    // 커뮤니티 찾기 (ID 또는 slug)
    const community = await prisma.community.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      select: { id: true },
    })

    if (!community) {
      throwNotFoundError('커뮤니티를 찾을 수 없습니다')
    }

    const actualCommunityId = community.id

    // 하이브리드 페이지네이션 파싱
    const pagination = parseHybridPagination(searchParams)

    // Redis 캐시 키 생성
    const cacheKey = generateCacheKey('community:post:comments', {
      communityId: actualCommunityId,
      postId,
      ...pagination,
    })

    // Redis 캐싱 적용 - 댓글은 3분 캐싱
    const cachedData = await redisCache.getOrSet(
      cacheKey,
      async () => {
        // 게시글 존재 확인
        const post = await prisma.communityPost.findUnique({
          where: {
            id: postId,
            communityId: actualCommunityId,
          },
        })

        if (!post) {
          return null
        }

        // 조건 설정 (최상위 댓글만)
        const where = {
          postId: postId,
          parentId: null,
        }

        // 커서 기반 페이지네이션
        if (pagination.type === 'cursor') {
          const cursorWhere = {
            ...where,
            ...getCursorCondition(pagination.cursor),
          }

          const comments = await prisma.communityComment.findMany({
            where: cursorWhere,
            select: communityCommentSelect.list,
            orderBy: { createdAt: 'desc' },
            take: getCursorTake(pagination.limit),
          })

          const totalCount = await prisma.communityComment.count({ where })
          const cursorResponse = formatCursorResponse(
            comments,
            pagination.limit
          )

          // 응답 데이터 형식화
          const formattedComments = cursorResponse.items.map(formatComment)

          return {
            comments: formattedComments,
            total: totalCount,
            nextCursor: cursorResponse.nextCursor,
            hasMore: cursorResponse.hasMore,
          }
        }
        // 기존 오프셋 기반 페이지네이션 (호환성)
        else {
          const skip = (pagination.page - 1) * pagination.limit

          const [comments, totalCount] = await Promise.all([
            prisma.communityComment.findMany({
              where,
              select: communityCommentSelect.list,
              orderBy: { createdAt: 'desc' },
              skip,
              take: pagination.limit,
            }),
            prisma.communityComment.count({ where }),
          ])

          // 응답 데이터 형식화
          const formattedComments = comments.map(formatComment)

          return {
            comments: formattedComments,
            total: totalCount,
          }
        }
      },
      REDIS_TTL.API_SHORT * 3 // 3분 캐싱
    )

    if (!cachedData) {
      throwNotFoundError('게시글을 찾을 수 없습니다')
    }

    // 응답 생성
    if (pagination.type === 'cursor') {
      return successResponse({
        items: cachedData.comments,
        pagination: {
          limit: pagination.limit,
          nextCursor: cachedData.nextCursor,
          hasMore: cachedData.hasMore,
          total: cachedData.total,
        },
      })
    } else {
      return successResponse({
        items: cachedData.comments,
        pagination: {
          total: cachedData.total,
          page: pagination.page,
          limit: pagination.limit,
          totalPages: Math.ceil(cachedData.total / pagination.limit),
        },
      })
    }
  } catch (error) {
    return handleError(error)
  }
}

// 댓글 타입 정의
interface CommentWithReplies {
  id: string
  content: string
  isEdited: boolean
  createdAt: Date
  updatedAt: Date
  authorRole: string
  author: {
    id: string
    name: string | null
    image: string | null
  }
  replies?: CommentWithReplies[]
}

interface FormattedComment {
  id: string
  content: string
  isEdited: boolean
  createdAt: string
  updatedAt: string
  authorRole: string
  author: {
    id: string
    name: string | null
    image: string | null
  }
  timeAgo: string
  replies: FormattedComment[]
}

// 댓글 형식화 헬퍼 함수
function formatComment(comment: CommentWithReplies): FormattedComment {
  return {
    ...comment,
    createdAt: comment.createdAt.toISOString(),
    updatedAt: comment.updatedAt.toISOString(),
    timeAgo: formatTimeAgo(comment.createdAt),
    replies:
      comment.replies?.map((reply) => ({
        ...reply,
        createdAt: reply.createdAt.toISOString(),
        updatedAt: reply.updatedAt.toISOString(),
        timeAgo: formatTimeAgo(reply.createdAt),
        replies: [], // FormattedComment는 항상 replies 배열을 가져야 함
      })) || [],
  }
}

// POST: 커뮤니티 게시글 댓글 작성
const createCommentSchema = z.object({
  content: z.string().min(1, '댓글 내용을 입력해주세요').max(1000),
  parentId: z.string().optional(),
})

async function createCommunityComment(
  req: NextRequest,
  context: { params: Promise<{ id: string; postId: string }> }
) {
  try {
    const { id, postId } = await context.params

    // Body를 미리 읽기 (withSecurity가 body를 읽을 수 있으므로)
    let body: { content?: string; parentId?: string }
    try {
      const clonedReq = req.clone()
      body = await clonedReq.json()
    } catch {
      return validationErrorResponse({ message: ['Invalid JSON body'] })
    }

    // 커뮤니티 찾기 (ID 또는 slug)
    const community = await prisma.community.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
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
      CommunityRole.MODERATOR,
      CommunityRole.ADMIN,
      CommunityRole.OWNER,
    ])
    if (session instanceof Response) {
      return session
    }

    const post = await prisma.communityPost.findUnique({
      where: {
        id: postId,
        communityId: actualCommunityId,
      },
    })

    if (!post) {
      throwNotFoundError('게시글을 찾을 수 없습니다')
    }
    const validation = createCommentSchema.safeParse(body)

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

    const { content, parentId } = validation.data

    // 부모 댓글 확인
    if (parentId) {
      const parentComment = await prisma.communityComment.findUnique({
        where: { id: parentId, postId: postId },
      })

      if (!parentComment) {
        throwValidationError('부모 댓글을 찾을 수 없습니다')
      }

      // 대댓글의 대댓글까지만 허용 (depth 2)
      if (parentComment.parentId) {
        const grandParent = await prisma.communityComment.findUnique({
          where: { id: parentComment.parentId },
        })
        if (grandParent?.parentId) {
          throwValidationError('더 이상 답글을 작성할 수 없습니다')
        }
      }
    }

    // 댓글 생성
    const comment = await prisma.communityComment.create({
      data: {
        content,
        authorId: session.session.user.id,
        authorRole: session.membership.role, // 작성 시점의 역할 저장
        postId: postId,
        parentId,
      },
      include: {
        author: {
          select: { id: true, name: true, email: true, image: true },
        },
        replies: true, // 빈 배열이라도 포함
      },
    })

    // 게시글 댓글 수 증가
    await prisma.communityPost.update({
      where: { id: postId },
      data: { commentCount: { increment: 1 } },
    })

    // createdAt, updatedAt을 string으로 변환
    const formattedComment = {
      ...comment,
      createdAt: comment.createdAt.toISOString(),
      updatedAt: comment.updatedAt.toISOString(),
      replies: [],
    }

    return createdResponse(
      { comment: formattedComment },
      '댓글이 작성되었습니다'
    )
  } catch (error) {
    return handleError(error)
  }
}

// Rate Limiting과 CSRF 보호 적용 - 새로운 Rate Limiting 시스템 사용
export const POST = withSecurity(
  withRateLimiting(createCommunityComment, {
    action: ActionCategory.COMMENT_CREATE,
    enablePatternDetection: true,
    enableAbuseTracking: true,
  }),
  { requireCSRF: true }
)
