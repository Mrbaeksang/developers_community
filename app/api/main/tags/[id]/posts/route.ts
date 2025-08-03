import { prisma } from '@/lib/prisma'
import { paginatedResponse } from '@/lib/api-response'
import { handleError, throwNotFoundError } from '@/lib/error-handler'

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
      throw throwNotFoundError('태그를 찾을 수 없습니다.')
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

    return paginatedResponse(formattedPosts, page, limit, totalCount)
  } catch (error) {
    return handleError(error)
  }
}
