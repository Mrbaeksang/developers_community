import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// POST: 커뮤니티 게시글 북마크
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string; postId: string }> }
) {
  try {
    const { id, postId } = await context.params
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      )
    }

    // 게시글 존재 확인
    const post = await prisma.communityPost.findUnique({
      where: { id: postId, communityId: id, isDeleted: false },
    })

    if (!post) {
      return NextResponse.json(
        { error: '게시글을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 이미 북마크 했는지 확인
    const existingBookmark = await prisma.communityBookmark.findUnique({
      where: {
        userId_postId: {
          userId: session.user.id,
          postId: postId,
        },
      },
    })

    if (existingBookmark) {
      return NextResponse.json(
        { error: '이미 북마크한 게시글입니다.' },
        { status: 400 }
      )
    }

    // 북마크 생성
    await prisma.communityBookmark.create({
      data: {
        userId: session.user.id,
        postId: postId,
      },
    })

    return NextResponse.json({ message: '북마크에 저장되었습니다.' })
  } catch (error) {
    console.error('Failed to bookmark post:', error)
    return NextResponse.json(
      { error: '북마크 처리에 실패했습니다.' },
      { status: 500 }
    )
  }
}

// DELETE: 커뮤니티 게시글 북마크 취소
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string; postId: string }> }
) {
  try {
    const { id, postId } = await context.params
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      )
    }

    // 북마크 삭제
    const result = await prisma.communityBookmark.deleteMany({
      where: {
        userId: session.user.id,
        postId: postId,
      },
    })

    if (result.count === 0) {
      return NextResponse.json(
        { error: '북마크하지 않은 게시글입니다.' },
        { status: 400 }
      )
    }

    return NextResponse.json({ message: '북마크가 해제되었습니다.' })
  } catch (error) {
    console.error('Failed to unbookmark post:', error)
    return NextResponse.json(
      { error: '북마크 해제에 실패했습니다.' },
      { status: 500 }
    )
  }
}
