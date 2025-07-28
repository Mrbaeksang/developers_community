import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '5')

    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    // 이번 주에 가장 많은 게시글을 작성한 사용자 조회
    const activeUsers = await prisma.user.findMany({
      where: {
        mainPosts: {
          some: {
            createdAt: {
              gte: weekAgo,
            },
          },
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        _count: {
          select: {
            mainPosts: {
              where: {
                createdAt: {
                  gte: weekAgo,
                },
              },
            },
          },
        },
      },
      orderBy: {
        mainPosts: {
          _count: 'desc',
        },
      },
      take: limit,
    })

    return NextResponse.json({
      users: activeUsers.map((user) => ({
        id: user.id,
        name: user.name || user.email?.split('@')[0] || 'Unknown',
        image: user.image,
        postCount: user._count.mainPosts,
      })),
    })
  } catch (error) {
    console.error('활발한 사용자 조회 실패:', error)
    return NextResponse.json(
      { error: '활발한 사용자 조회에 실패했습니다.' },
      { status: 500 }
    )
  }
}
