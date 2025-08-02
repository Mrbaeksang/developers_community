import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRoleAPI } from '@/lib/auth-utils'

// 메인 게시글 삭제 (관리자만)
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireRoleAPI(['ADMIN'])
    if (session instanceof NextResponse) {
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
