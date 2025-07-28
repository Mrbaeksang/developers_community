import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// POST /api/main/posts/[id]/bookmark - 북마크 토글
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const userId = session.user.id

    // 게시글 존재 확인
    const post = await prisma.mainPost.findUnique({
      where: { id },
    })

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // 이미 북마크했는지 확인
    const existingBookmark = await prisma.mainBookmark.findUnique({
      where: {
        userId_postId: {
          userId,
          postId: id,
        },
      },
    })

    if (existingBookmark) {
      // 북마크 취소
      await prisma.mainBookmark.delete({
        where: {
          id: existingBookmark.id,
        },
      })

      return NextResponse.json({ bookmarked: false })
    } else {
      // 북마크 추가
      await prisma.mainBookmark.create({
        data: {
          userId,
          postId: id,
        },
      })

      return NextResponse.json({ bookmarked: true })
    }
  } catch (error) {
    console.error('Failed to toggle bookmark:', error)
    return NextResponse.json(
      { error: 'Failed to toggle bookmark' },
      { status: 500 }
    )
  }
}

// GET /api/main/posts/[id]/bookmark - 북마크 상태 확인
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ bookmarked: false })
    }

    const { id } = await params
    const userId = session.user.id

    const bookmark = await prisma.mainBookmark.findUnique({
      where: {
        userId_postId: {
          userId,
          postId: id,
        },
      },
    })

    return NextResponse.json({ bookmarked: !!bookmark })
  } catch (error) {
    console.error('Failed to check bookmark status:', error)
    return NextResponse.json({ bookmarked: false })
  }
}
