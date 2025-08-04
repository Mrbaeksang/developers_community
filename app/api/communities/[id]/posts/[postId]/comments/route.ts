import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { requireCommunityRoleAPI } from '@/lib/auth-utils'
import { CommunityRole } from '@prisma/client'
import { successResponse, createdResponse } from '@/lib/api-response'
import {
  handleError,
  throwNotFoundError,
  throwValidationError,
} from '@/lib/error-handler'
import { withRateLimit } from '@/lib/rate-limiter'

// GET: 커뮤니티 게시글 댓글 목록 조회
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string; postId: string }> }
) {
  try {
    const { id, postId } = await context.params

    // 게시글 존재 확인
    const post = await prisma.communityPost.findUnique({
      where: {
        id: postId,
        communityId: id,
      },
    })

    if (!post) {
      throwNotFoundError('게시글을 찾을 수 없습니다')
    }

    // 댓글 조회 (계층 구조)
    const comments = await prisma.communityComment.findMany({
      where: {
        postId: postId,
        parentId: null, // 최상위 댓글만
      },
      include: {
        author: {
          select: { id: true, name: true, email: true, image: true },
        },
        replies: {
          include: {
            author: {
              select: { id: true, name: true, email: true, image: true },
            },
            replies: {
              include: {
                author: {
                  select: { id: true, name: true, email: true, image: true },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return successResponse({ comments })
  } catch (error) {
    return handleError(error)
  }
}

// POST: 커뮤니티 게시글 댓글 작성
const createCommentSchema = z.object({
  content: z.string().min(1, '댓글 내용을 입력해주세요').max(1000),
  parentId: z.string().optional(),
})

async function createCommunityComment(
  req: NextRequest,
  context?: { params: Promise<{ id: string; postId: string }> }
) {
  try {
    if (!context) {
      throwValidationError('Invalid request context')
    }
    const { id, postId } = await context.params

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

    const body = await req.json()
    const validation = createCommentSchema.safeParse(body)

    if (!validation.success) {
      throwValidationError(validation.error.issues[0].message)
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
      },
    })

    // 게시글 댓글 수 증가
    await prisma.communityPost.update({
      where: { id: postId },
      data: { commentCount: { increment: 1 } },
    })

    return createdResponse(comment, '댓글이 작성되었습니다')
  } catch (error) {
    return handleError(error)
  }
}

// Rate Limiting 적용 - 커뮤니티 댓글 작성
export const POST = withRateLimit(createCommunityComment, 'comment')
