import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// 내 북마크 목록 조회 - GET /api/users/bookmarks
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)

    // 쿼리 파라미터
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(
      50,
      Math.max(1, parseInt(searchParams.get('limit') || '10'))
    )
    const categoryId = searchParams.get('categoryId')

    const skip = (page - 1) * limit

    // 조건 설정
    const where = {
      userId: session.user.id,
      post: {
        status: 'PUBLISHED' as const,
        ...(categoryId && { categoryId }),
      },
    }

    // 북마크 목록 조회
    const [bookmarks, totalCount] = await Promise.all([
      prisma.mainBookmark.findMany({
        where,
        include: {
          post: {
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
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.mainBookmark.count({ where }),
    ])

    // 응답 데이터 형식화
    const formattedBookmarks = bookmarks.map((bookmark) => ({
      bookmarkId: bookmark.id,
      bookmarkedAt: bookmark.createdAt.toISOString(),
      post: {
        id: bookmark.post.id,
        title: bookmark.post.title,
        excerpt: bookmark.post.excerpt,
        slug: bookmark.post.slug,
        status: bookmark.post.status,
        isPinned: bookmark.post.isPinned,
        viewCount: bookmark.post.viewCount,
        likeCount: bookmark.post.likeCount,
        commentCount: bookmark.post.commentCount,
        createdAt: bookmark.post.createdAt.toISOString(),
        updatedAt: bookmark.post.updatedAt.toISOString(),
        approvedAt: bookmark.post.approvedAt?.toISOString() || null,
        author: {
          id: bookmark.post.author.id,
          name: bookmark.post.author.name || 'Unknown',
          image: bookmark.post.author.image || undefined,
        },
        category: {
          id: bookmark.post.category.id,
          name: bookmark.post.category.name,
          slug: bookmark.post.category.slug,
          color: bookmark.post.category.color,
        },
        tags: bookmark.post.tags.map((tagRelation) => ({
          id: tagRelation.tag.id,
          name: tagRelation.tag.name,
          slug: tagRelation.tag.slug,
          color: tagRelation.tag.color,
        })),
        stats: {
          commentCount: bookmark.post._count.comments,
          likeCount: bookmark.post._count.likes,
          bookmarkCount: bookmark.post._count.bookmarks,
        },
      },
    }))

    const totalPages = Math.ceil(totalCount / limit)

    return NextResponse.json({
      bookmarks: formattedBookmarks,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    })
  } catch (error) {
    console.error('북마크 목록 조회 실패:', error)
    return NextResponse.json(
      { error: '북마크 목록 조회에 실패했습니다.' },
      { status: 500 }
    )
  }
}
