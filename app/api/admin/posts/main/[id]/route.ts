import { prisma } from '@/lib/core/prisma'
import { requireRoleAPI } from '@/lib/auth/session'
import { deletedResponse } from '@/lib/api/response'
import { handleError, throwNotFoundError } from '@/lib/api/errors'
import { withCSRFProtection } from '@/lib/auth/csrf'

// 메인 게시글 삭제 (관리자만)
async function deleteMainPost(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireRoleAPI(['ADMIN'])
    if (session instanceof Response) {
      return session
    }

    const { id } = await params

    // 게시글 존재 확인
    const post = await prisma.mainPost.findUnique({
      where: { id },
      include: {
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
      throwNotFoundError('게시글을 찾을 수 없습니다.')
    }

    // 트랜잭션으로 관련 데이터 모두 삭제
    await prisma.$transaction([
      // 댓글 삭제
      prisma.mainComment.deleteMany({
        where: { postId: id },
      }),
      // 좋아요 삭제
      prisma.mainLike.deleteMany({
        where: { postId: id },
      }),
      // 북마크 삭제
      prisma.mainBookmark.deleteMany({
        where: { postId: id },
      }),
      // 태그 연결 삭제
      prisma.mainPostTag.deleteMany({
        where: { postId: id },
      }),
      // 게시글 삭제
      prisma.mainPost.delete({
        where: { id },
      }),
    ])

    return deletedResponse('메인 게시글이 삭제되었습니다.')
  } catch (error) {
    return handleError(error)
  }
}

// CSRF 보호 적용
export const DELETE = withCSRFProtection(deleteMainPost)
