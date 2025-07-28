import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams

    // 쿼리 파라미터
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const type = searchParams.get('type') as string | null
    const categoryId = searchParams.get('categoryId') as string | null
    const sort = searchParams.get('sort') || 'latest'

    // 필터 조건
    const where = {
      status: 'PUBLISHED' as const,
      ...(type && { type }),
      ...(categoryId && { categoryId }),
    }

    // 정렬 조건
    const orderBy =
      sort === 'popular'
        ? { viewCount: 'desc' as const }
        : { createdAt: 'desc' as const }

    // 전체 개수 조회
    const total = await prisma.mainPost.count({ where })

    // 게시글 조회
    const posts = await prisma.mainPost.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        tags: {
          include: {
            tag: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
        _count: {
          select: {
            comments: true,
            likes: true,
          },
        },
      },
    })

    return NextResponse.json({
      posts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('게시글 목록 조회 실패:', error)
    return NextResponse.json(
      { error: '게시글 목록을 불러오는데 실패했습니다.' },
      { status: 500 }
    )
  }
}
