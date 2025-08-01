import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

// 메인 게시글 삭제 (관리자만)
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
      return NextResponse.json(
        { error: '게시글을 찾을 수 없습니다.' },
        { status: 404 }
      )
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

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('메인 게시글 삭제 실패:', error)
    return NextResponse.json(
      { error: '메인 게시글 삭제에 실패했습니다.' },
      { status: 500 }
    )
  }
}
