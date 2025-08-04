import { prisma } from '@/lib/prisma'
import { requireRoleAPI } from '@/lib/auth-utils'
import { deletedResponse } from '@/lib/api-response'
import { handleError, throwNotFoundError } from '@/lib/error-handler'
import { withCSRFProtection } from '@/lib/csrf'

// 커뮤니티 게시글 삭제 (관리자만)
async function deleteCommunityPost(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const result = await requireRoleAPI(['ADMIN'])
    if (result instanceof Response) return result

    const { id } = await params

    // 게시글 존재 확인
    const post = await prisma.communityPost.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            comments: true,
            likes: true,
            bookmarks: true,
            files: true,
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
      prisma.communityComment.deleteMany({
        where: { postId: id },
      }),
      // 좋아요 삭제
      prisma.communityLike.deleteMany({
        where: { postId: id },
      }),
      // 북마크 삭제
      prisma.communityBookmark.deleteMany({
        where: { postId: id },
      }),
      // 태그 연결 삭제
      prisma.communityPostTag.deleteMany({
        where: { postId: id },
      }),
      // 파일 연결 해제 (파일 자체는 삭제하지 않음)
      prisma.file.updateMany({
        where: { postId: id },
        data: { postId: null },
      }),
      // 게시글 삭제
      prisma.communityPost.delete({
        where: { id },
      }),
    ])

    return deletedResponse('커뮤니티 게시글이 삭제되었습니다.')
  } catch (error) {
    return handleError(error)
  }
}

// CSRF 보호 적용
export const DELETE = withCSRFProtection(deleteCommunityPost)
