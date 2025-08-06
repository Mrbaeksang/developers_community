import { prisma } from '@/lib/core/prisma'
import { paginatedResponse } from '@/lib/api/response'
import { handleError, throwNotFoundError } from '@/lib/api/errors'
import { mainPostSelect } from '@/lib/cache/patterns'
import { applyViewCountsToPosts } from '@/lib/post/viewcount'

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
        select: mainPostSelect.list,
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

    // tags 데이터 형식 변환 및 Redis 조회수 적용
    const formattedPosts = posts.map((post) => ({
      ...post,
      tags: post.tags.map((postTag) => postTag.tag),
    }))

    const postsWithViews = await applyViewCountsToPosts(formattedPosts)

    return paginatedResponse(postsWithViews, page, limit, totalCount)
  } catch (error) {
    return handleError(error)
  }
}
