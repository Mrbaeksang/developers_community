import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

// 메인 게시글 목록 조회 (관리자용)
export async function GET() {
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
      select: { globalRole: true, email: true },
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

    const posts = await prisma.mainPost.findMany({
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            globalRole: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
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
      take: 500, // 최대 500개까지만 조회
    })

    return NextResponse.json(posts)
  } catch (error) {
    console.error('메인 게시글 목록 조회 실패:', error)
    return NextResponse.json(
      { error: '메인 게시글 목록 조회에 실패했습니다.' },
      { status: 500 }
    )
  }
}
