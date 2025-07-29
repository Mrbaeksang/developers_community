import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 태그별 게시글 조회
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    const resolvedParams = await params
    const { id } = resolvedParams

    // 태그 존재 확인
    const tag = await prisma.mainTag.findUnique({
      where: { id },
    })

    if (!tag) {
      return NextResponse.json(
        { error: '태그를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 태그별 게시글 조회 (게시된 글만)
    const [posts, totalCount] = await Promise.all([
      prisma.mainPost.findMany({
        where: {
          status: 'PUBLISHED',
          tags: {
            some: {
              tagId: id,
            },
          },
        },
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
              color: true,
            },
          },
          tags: {
            include: {
              tag: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  color: true,
                },
              },
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
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.mainPost.count({
        where: {
          status: 'PUBLISHED',
          tags: {
            some: {
              tagId: id,
            },
          },
        },
      }),
    ])

    // tags 데이터 형식 변환
    const formattedPosts = posts.map((post) => ({
      ...post,
      tags: post.tags.map((postTag) => postTag.tag),
    }))

    return NextResponse.json({
      tag,
      posts: formattedPosts,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    })
  } catch (error) {
    console.error('태그별 게시글 조회 실패:', error)
    return NextResponse.json(
      { error: '태그별 게시글 조회에 실패했습니다.' },
      { status: 500 }
    )
  }
}