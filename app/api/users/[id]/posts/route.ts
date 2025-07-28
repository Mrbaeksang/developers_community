import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 사용자별 게시글 목록 조회 - GET /api/users/[id]/posts
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id
    const { searchParams } = new URL(request.url)

    // 쿼리 파라미터
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(
      50,
      Math.max(1, parseInt(searchParams.get('limit') || '10'))
    )
    const status = searchParams.get('status') as
      | 'PUBLISHED'
      | 'PENDING'
      | 'DRAFT'
      | null
    const categoryId = searchParams.get('categoryId')

    const skip = (page - 1) * limit

    // 사용자 존재 확인
    const userExists = await prisma.user.findUnique({
      where: {
        id: userId,
        isActive: true,
        isBanned: false,
      },
      select: { id: true },
    })

    if (!userExists) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 조건 설정
    const where = {
      authorId: userId,
      ...(status && { status }),
      ...(categoryId && { categoryId }),
    }

    // 게시글 목록 조회
    const [posts, totalCount] = await Promise.all([
      prisma.mainPost.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              name: true,
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
      prisma.mainPost.count({ where }),
    ])

    // 응답 데이터 형식화
    const formattedPosts = posts.map((post) => ({
      id: post.id,
      title: post.title,
      excerpt: post.excerpt,
      slug: post.slug,
      status: post.status,
      isPinned: post.isPinned,
      viewCount: post.viewCount,
      likeCount: post.likeCount,
      commentCount: post.commentCount,
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
      approvedAt: post.approvedAt?.toISOString() || null,
      author: {
        id: post.author.id,
        name: post.author.name || 'Unknown',
        image: post.author.image || undefined,
      },
      category: {
        id: post.category.id,
        name: post.category.name,
        slug: post.category.slug,
        color: post.category.color,
      },
      tags: post.tags.map((tagRelation) => ({
        id: tagRelation.tag.id,
        name: tagRelation.tag.name,
        slug: tagRelation.tag.slug,
        color: tagRelation.tag.color,
      })),
      stats: {
        commentCount: post._count.comments,
        likeCount: post._count.likes,
        bookmarkCount: post._count.bookmarks,
      },
    }))

    const totalPages = Math.ceil(totalCount / limit)

    return NextResponse.json({
      posts: formattedPosts,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    })
  } catch (error) {
    console.error('사용자 게시글 목록 조회 실패:', error)
    return NextResponse.json(
      { error: '사용자 게시글 목록 조회에 실패했습니다.' },
      { status: 500 }
    )
  }
}
