import { NextRequest } from 'next/server'
import { prisma } from '@/lib/core/prisma'
import { auth } from '@/auth'
import { z } from 'zod'
import { requireAuthAPI } from '@/lib/auth/session'
import { PostStatus, Prisma } from '@prisma/client'
import { canModifyMainContent } from '@/lib/auth/roles'
import { markdownToHtml } from '@/lib/ui/markdown'
import {
  successResponse,
  errorResponse,
  updatedResponse,
  deletedResponse,
  validationErrorResponse,
} from '@/lib/api/response'
import {
  handleError,
  throwValidationError,
  throwNotFoundError,
  throwAuthorizationError,
} from '@/lib/api/errors'
import { formatTimeAgo } from '@/lib/ui/date'
import { withCSRFProtection } from '@/lib/auth/csrf'
import { redisCache, REDIS_TTL, generateCacheKey } from '@/lib/cache/redis'
import { getViewCount } from '@/lib/core/redis'

// GET /api/main/posts/[id] - 게시글 상세 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()

    // Redis 캐시 키 생성 - 사용자별로 다른 캐시 사용
    const cacheKey = generateCacheKey('main:post:detail', {
      id,
      userId: session?.user?.id || 'anonymous',
    })

    // 기본적으로 PUBLISHED만 조회 가능
    let whereClause: Prisma.MainPostWhereInput = {
      id,
      status: 'PUBLISHED',
    }

    // 로그인한 경우 추가 권한 체크
    if (session?.user?.id) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { globalRole: true },
      })

      // ADMIN/MANAGER는 모든 게시글 조회 가능
      if (user?.globalRole === 'ADMIN' || user?.globalRole === 'MANAGER') {
        whereClause = { id }
      } else {
        // 일반 사용자는 자신의 게시글은 상태와 관계없이 조회 가능
        whereClause = {
          id,
          OR: [{ status: 'PUBLISHED' }, { authorId: session.user.id }],
        }
      }
    }

    // Redis 캐싱 적용 - 개별 게시글은 10분 캐싱 (조회수 제외)
    const cachedPost = await redisCache.getOrSet(
      cacheKey,
      async () => {
        const post = await prisma.mainPost.findFirst({
          where: whereClause,
          select: {
            id: true,
            title: true,
            slug: true,
            content: true,
            excerpt: true,
            status: true,
            isPinned: true,
            viewCount: true, // viewCount 필드 추가
            createdAt: true,
            updatedAt: true,
            authorId: true,
            categoryId: true,
            author: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
                color: true,
              },
            },
            tags: {
              include: {
                tag: true,
              },
            },
            _count: {
              select: {
                comments: true,
                likes: true,
                bookmarks: true,
              },
            },
          },
        })

        if (!post) {
          return null
        }

        // 태그 형식 변환 및 마크다운 변환 (조회수 제외)
        return {
          ...post,
          content: markdownToHtml(post.content), // 마크다운을 HTML로 변환
          tags: post.tags.map((postTag) => postTag.tag),
          status: post.status, // 상태 정보 포함
          createdAt: post.createdAt.toISOString(),
          updatedAt: post.updatedAt.toISOString(),
          timeAgo: formatTimeAgo(post.createdAt),
          // viewCount는 캐시하지 않고 나중에 추가
        }
      },
      REDIS_TTL.API_SHORT // 30초 캐싱 (상세 페이지도 조회수 때문에 짧게)
    )

    if (!cachedPost) {
      return errorResponse('Post not found', 404)
    }

    // 캐시된 데이터에 최신 조회수 추가 (항상 DB에서 최신 값 조회)
    const currentPost = await prisma.mainPost.findUnique({
      where: { id },
      select: { viewCount: true },
    })

    // Redis에서 조회수 가져오기 (Redis와 DB 중 더 큰 값 사용)
    const redisViewCount = await getViewCount(id)
    const finalViewCount = Math.max(redisViewCount, currentPost?.viewCount || 0)

    return successResponse({
      ...cachedPost,
      viewCount: finalViewCount, // 최신 조회수로 업데이트
    })
  } catch (error) {
    return handleError(error)
  }
}

// PUT /api/main/posts/[id] - 게시글 수정
const updatePostSchema = z.object({
  title: z.string().min(1, '제목을 입력해주세요').max(100),
  content: z.string().min(1, '내용을 입력해주세요'),
  categoryId: z.string(),
  tagIds: z.array(z.string()).max(5, '태그는 최대 5개까지 가능합니다'),
})

async function updatePost(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // 인증 확인
    const session = await requireAuthAPI()
    if (session instanceof Response) {
      return session
    }

    // 게시글 조회 (작성자 확인)
    const post = await prisma.mainPost.findUnique({
      where: { id },
      select: {
        authorId: true,
        authorRole: true,
        status: true,
      },
    })

    if (!post) {
      throwNotFoundError('게시글을 찾을 수 없습니다.')
    }

    // 현재 사용자의 전역 역할 확인
    const userId = session.user.id
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { globalRole: true },
    })

    if (!user) {
      throwNotFoundError('사용자를 찾을 수 없습니다.')
    }

    // 권한 확인 (역할 계층 기반)
    const isAuthor = post.authorId === userId
    const canModify = canModifyMainContent(
      user.globalRole,
      isAuthor,
      post.authorRole
    )

    if (!canModify) {
      throwAuthorizationError('게시글을 수정할 권한이 없습니다.')
    }

    const body = await request.json()
    const validation = updatePostSchema.safeParse(body)

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

    const { title, content, categoryId, tagIds } = validation.data

    // 카테고리 확인
    const category = await prisma.mainCategory.findUnique({
      where: { id: categoryId },
    })

    if (!category) {
      throwValidationError('유효하지 않은 카테고리입니다.')
    }

    // 태그 확인
    if (tagIds.length > 0) {
      const tags = await prisma.mainTag.findMany({
        where: { id: { in: tagIds } },
      })

      if (tags.length !== tagIds.length) {
        throwValidationError('유효하지 않은 태그가 포함되어 있습니다.')
      }
    }

    // 게시글 수정 (트랜잭션 사용)
    const updatedPost = await prisma.$transaction(async (tx) => {
      // 기존 태그 연결 삭제
      await tx.mainPostTag.deleteMany({
        where: { postId: id },
      })

      // 게시글 수정
      const updated = await tx.mainPost.update({
        where: { id },
        data: {
          title,
          content,
          categoryId,
          // 수정 시 다시 PENDING 상태로 변경 (ADMIN만 상태 유지)
          status:
            user.globalRole === 'ADMIN' ? post.status : PostStatus.PENDING,
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
              color: true,
            },
          },
          _count: {
            select: {
              comments: true,
              likes: true,
              bookmarks: true,
            },
          },
        },
      })

      // 새 태그 연결
      if (tagIds.length > 0) {
        await tx.mainPostTag.createMany({
          data: tagIds.map((tagId) => ({
            postId: id,
            tagId,
          })),
        })
      }

      // 태그 정보 가져오기
      const postTags = await tx.mainPostTag.findMany({
        where: { postId: id },
        include: { tag: true },
      })

      return {
        ...updated,
        tags: postTags.map((pt) => pt.tag),
      }
    })

    // Redis 캐시 무효화 - 해당 게시글 및 목록 캐시 삭제
    await redisCache.delPattern(`api:cache:main:post:detail:*id*${id}*`)
    await redisCache.delPattern('api:cache:main:posts:*')

    return updatedResponse(updatedPost, '게시글이 수정되었습니다.')
  } catch (error) {
    return handleError(error)
  }
}

// DELETE /api/main/posts/[id] - 게시글 삭제
async function deletePost(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // 인증 확인
    const session = await requireAuthAPI()
    if (session instanceof Response) {
      return session
    }

    // 게시글 조회 (작성자 확인)
    const post = await prisma.mainPost.findUnique({
      where: { id },
      select: {
        authorId: true,
        authorRole: true,
      },
    })

    if (!post) {
      throwNotFoundError('게시글을 찾을 수 없습니다.')
    }

    // 현재 사용자의 전역 역할 확인
    const userId = session.user.id
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { globalRole: true },
    })

    if (!user) {
      throwNotFoundError('사용자를 찾을 수 없습니다.')
    }

    // 권한 확인 (역할 계층 기반)
    const isAuthor = post.authorId === userId
    const canDelete = canModifyMainContent(
      user.globalRole,
      isAuthor,
      post.authorRole
    )

    if (!canDelete) {
      throwAuthorizationError('게시글을 삭제할 권한이 없습니다.')
    }

    // 게시글 삭제 (관련 데이터는 CASCADE로 자동 삭제)
    await prisma.mainPost.delete({
      where: { id },
    })

    // Redis 캐시 무효화 - 해당 게시글 및 목록 캐시 삭제
    await redisCache.delPattern(`api:cache:main:post:detail:*id*${id}*`)
    await redisCache.delPattern('api:cache:main:posts:*')

    return deletedResponse('게시글이 삭제되었습니다.')
  } catch (error) {
    return handleError(error)
  }
}

// CSRF 보호 적용
export const PUT = withCSRFProtection(updatePost)
export const DELETE = withCSRFProtection(deletePost)
