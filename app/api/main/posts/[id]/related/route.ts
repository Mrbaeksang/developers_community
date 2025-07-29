import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/main/posts/[id]/related - 관련 게시글 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get('limit') || '5')

    // 현재 게시글 정보 가져오기 (태그 포함)
    const currentPost = await prisma.mainPost.findUnique({
      where: { id },
      select: {
        categoryId: true,
        tags: {
          select: {
            tagId: true,
          },
        },
      },
    })

    if (!currentPost) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    const tagIds = currentPost.tags.map((tag) => tag.tagId)

    // 관련 게시글 가져오기
    const relatedPosts = await prisma.mainPost.findMany({
      where: {
        id: { not: id }, // 현재 게시글 제외
        status: 'PUBLISHED',
        OR: [
          // 같은 태그를 가진 게시글
          {
            tags: {
              some: {
                tagId: {
                  in: tagIds,
                },
              },
            },
          },
          // 같은 카테고리의 게시글
          {
            categoryId: currentPost.categoryId,
          },
        ],
      },
      select: {
        id: true,
        title: true,
        slug: true,
        viewCount: true,
        likeCount: true,
        commentCount: true,
        createdAt: true,
        author: {
          select: {
            name: true,
            image: true,
          },
        },
        category: {
          select: {
            name: true,
            slug: true,
            color: true,
          },
        },
      },
      orderBy: [
        // 점수 계산: viewCount + (likeCount * 2) + 최신성
        {
          likeCount: 'desc',
        },
        {
          viewCount: 'desc',
        },
        {
          createdAt: 'desc',
        },
      ],
      take: limit,
    })

    // 중복 제거 및 점수 기반 정렬
    const uniquePosts = Array.from(
      new Map(relatedPosts.map((post) => [post.id, post])).values()
    )

    // 점수 계산 및 재정렬
    const scoredPosts = uniquePosts
      .map((post) => {
        const daysSinceCreated = Math.floor(
          (Date.now() - new Date(post.createdAt).getTime()) /
            (1000 * 60 * 60 * 24)
        )
        const recencyScore = Math.max(0, 30 - daysSinceCreated) // 30일 이내 게시글에 가산점
        const score = post.viewCount + post.likeCount * 2 + recencyScore * 0.5
        return { ...post, score }
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((post) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { score, ...postWithoutScore } = post
        return postWithoutScore
      }) // score 필드 제거

    return NextResponse.json({ posts: scoredPosts })
  } catch (error) {
    console.error('Failed to fetch related posts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch related posts' },
      { status: 500 }
    )
  }
}
