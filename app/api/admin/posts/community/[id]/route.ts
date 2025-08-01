import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

// 커뮤니티 게시글 삭제 (관리자만)
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      )
    }

    // 관리자 권한 확인
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { globalRole: true },
    })

    // ADMIN 권한만 허용 (절대 권력자)
    if (!user || user.globalRole !== 'ADMIN') {
      return NextResponse.json(
        {
          error: '권한이 없습니다. 관리자만 접근 가능합니다.',
        },
        { status: 403 }
      )
    }

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
