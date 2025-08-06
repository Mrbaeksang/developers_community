import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/core/prisma'
import { z } from 'zod'
import { requireAuthAPI, hasCommunityPermission } from '@/lib/auth/session'
import { CommunityVisibility, CommunityRole } from '@prisma/client'
import { successResponse, validationErrorResponse } from '@/lib/api/response'
import {
  handleError,
  throwNotFoundError,
  throwAuthorizationError,
  throwValidationError,
} from '@/lib/api/errors'
import { withCSRFProtection } from '@/lib/auth/csrf'

// GET: 커뮤니티 게시글 상세 조회
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string; postId: string }> }
) {
  try {
    const { id, postId } = await context.params
    const session = await auth()

    // 먼저 커뮤니티 찾기 (ID 또는 slug로)
    const community = await prisma.community.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      select: { id: true },
    })

    if (!community) {
      throwNotFoundError('커뮤니티를 찾을 수 없습니다')
    }

    // 커뮤니티 및 게시글 확인
    const post = await prisma.communityPost.findUnique({
      where: {
        id: postId,
        communityId: community.id,
      },
      include: {
        author: {
          select: { id: true, name: true, email: true, image: true },
        },
        category: true,
        community: {
          select: {
            id: true,
            name: true,
            slug: true,
            visibility: true,
            ownerId: true,
            members: session?.user?.id
              ? {
                  where: { userId: session.user.id, status: 'ACTIVE' },
                }
              : false,
          },
        },
        _count: {
          select: { comments: true, likes: true },
        },
        likes: session?.user?.id
          ? {
              where: { userId: session.user.id },
            }
          : false,
        bookmarks: session?.user?.id
          ? {
              where: { userId: session.user.id },
            }
          : false,
        files: {
          select: {
            id: true,
            filename: true,
            size: true,
            mimeType: true,
            url: true,
          },
        },
      },
    })

    if (!post) {
      throwNotFoundError('게시글을 찾을 수 없습니다')
    }

    // 비공개 커뮤니티의 경우 멤버만 접근 가능
    if (post.community.visibility === CommunityVisibility.PRIVATE) {
      if (session?.user?.id) {
        const membership = await prisma.communityMember.findUnique({
          where: {
            userId_communityId: {
              userId: session.user.id,
              communityId: community.id,
            },
          },
          select: { status: true },
        })

        if (!membership || membership.status !== 'ACTIVE') {
          if (post.community.ownerId !== session.user.id) {
            throwAuthorizationError('비공개 커뮤니티의 게시글입니다')
          }
        }
      } else {
        throwAuthorizationError('비공개 커뮤니티의 게시글입니다')
      }
    }

    // 조회수 증가는 별도 /view 엔드포인트에서 처리 (Redis 버퍼링)

    // 사용자별 좋아요/북마크 상태 처리
    const formattedPost = {
      ...post,
      isLiked: post.likes && post.likes.length > 0,
      isBookmarked: post.bookmarks && post.bookmarks.length > 0,
      likes: undefined,
      bookmarks: undefined,
    }

    return successResponse(formattedPost)
  } catch (error) {
    return handleError(error)
  }
}

// PATCH: 커뮤니티 게시글 수정
const updatePostSchema = z.object({
  title: z.string().min(1, '제목을 입력해주세요').max(100).optional(),
  content: z.string().min(1, '내용을 입력해주세요').optional(),
  categoryId: z.string().nullable().optional(),
  fileIds: z.array(z.string()).optional(),
})

async function updateCommunityPost(
  req: NextRequest,
  context: { params: Promise<{ id: string; postId: string }> }
) {
  try {
    const { id, postId } = await context.params
    const session = await requireAuthAPI()
    if (session instanceof Response) {
      return session
    }

    // 먼저 커뮤니티 찾기 (ID 또는 slug로)
    const community = await prisma.community.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      select: { id: true },
    })

    if (!community) {
      throwNotFoundError('커뮤니티를 찾을 수 없습니다')
    }

    // 게시글 확인
    const post = await prisma.communityPost.findUnique({
      where: { id: postId, communityId: community.id },
      include: {
        community: {
          select: { allowFileUpload: true },
        },
      },
    })

    if (!post) {
      throwNotFoundError('게시글을 찾을 수 없습니다')
    }

    // 권한 확인 (작성자 본인만 수정 가능)
    if (post.authorId !== session.user.id) {
      throwAuthorizationError('게시글을 수정할 권한이 없습니다')
    }

    const body = await req.json()
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

    const { title, content, categoryId, fileIds } = validation.data

    // 파일 업로드 권한 확인
    if (fileIds && fileIds.length > 0 && !post.community.allowFileUpload) {
      throwAuthorizationError('이 커뮤니티는 파일 업로드를 허용하지 않습니다')
    }

    // 카테고리 확인
    if (categoryId !== undefined) {
      if (categoryId) {
        const category = await prisma.communityCategory.findUnique({
          where: { id: categoryId, communityId: id },
        })

        if (!category) {
          throwValidationError('유효하지 않은 카테고리입니다')
        }
      }
    }

    // 게시글 업데이트
    const updatedPost = await prisma.communityPost.update({
      where: { id: postId },
      data: {
        ...(title && { title }),
        ...(content && { content }),
        ...(categoryId !== undefined && { categoryId }),
        ...(fileIds && {
          files: {
            set: fileIds.map((id) => ({ id })),
          },
        }),
      },
      include: {
        author: {
          select: { id: true, name: true, email: true, image: true },
        },
        category: true,
        _count: {
          select: { comments: true, likes: true },
        },
      },
    })

    return successResponse(updatedPost, '게시글이 수정되었습니다')
  } catch (error) {
    return handleError(error)
  }
}

// DELETE: 커뮤니티 게시글 삭제
async function deleteCommunityPost(
  req: NextRequest,
  context: { params: Promise<{ id: string; postId: string }> }
) {
  try {
    const { id, postId } = await context.params
    const session = await requireAuthAPI()
    if (session instanceof Response) {
      return session
    }

    // 먼저 커뮤니티 찾기 (ID 또는 slug로)
    const community = await prisma.community.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      select: { id: true },
    })

    if (!community) {
      throwNotFoundError('커뮤니티를 찾을 수 없습니다')
    }

    // 게시글 확인
    const post = await prisma.communityPost.findUnique({
      where: { id: postId, communityId: community.id },
      select: { authorId: true },
    })

    if (!post) {
      throwNotFoundError('게시글을 찾을 수 없습니다')
    }

    // 권한 확인 (작성자 본인 또는 ADMIN/OWNER만 삭제 가능)
    const isAuthor = post.authorId === session.user.id
    const hasModeratorPermission = await hasCommunityPermission(
      session.user.id,
      community.id,
      [CommunityRole.ADMIN, CommunityRole.OWNER]
    )

    if (!isAuthor && !hasModeratorPermission) {
      throwAuthorizationError('게시글을 삭제할 권한이 없습니다')
    }

    // 게시글 하드 삭제
    await prisma.communityPost.delete({
      where: { id: postId },
    })

    // 커뮤니티 게시글 수 감소
    await prisma.community.update({
      where: { id },
      data: { postCount: { decrement: 1 } },
    })

    return successResponse({ deleted: true }, '게시글이 삭제되었습니다')
  } catch (error) {
    return handleError(error)
  }
}

// CSRF 보호 적용
export const PATCH = withCSRFProtection(updateCommunityPost)
export const DELETE = withCSRFProtection(deleteCommunityPost)
