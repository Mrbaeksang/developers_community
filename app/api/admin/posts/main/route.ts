import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRoleAPI } from '@/lib/auth-utils'

// 메인 게시글 목록 조회 (관리자용)
export async function GET() {
  try {
    const session = await requireRoleAPI(['ADMIN'])
    if (session instanceof NextResponse) {
      return session // Return error response
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
