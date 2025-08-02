import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRoleAPI } from '@/lib/auth-utils'

// 커뮤니티 게시글 삭제 (관리자만)
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const result = await requireRoleAPI(['ADMIN'])
    if (result instanceof NextResponse) return result

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
      return NextResponse.json(
        { error: '게시글을 찾을 수 없습니다.' },
        { status: 404 }
      )
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

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('커뮤니티 게시글 삭제 실패:', error)
    return NextResponse.json(
      { error: '커뮤니티 게시글 삭제에 실패했습니다.' },
      { status: 500 }
    )
  }
}
