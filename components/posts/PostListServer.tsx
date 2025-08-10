import { PostList } from '@/components/home/PostList'
import { prisma } from '@/lib/core/prisma'
import { redis } from '@/lib/core/redis'
import type { MainPostFormatted } from '@/lib/post/types'
import { Prisma } from '@prisma/client'
import { formatMainPostForResponse } from '@/lib/post/display'
import { Pagination } from '@/components/shared/Pagination'

interface PostListServerProps {
  category?: string
  sort?: string
  page?: string
}

export async function PostListServer({
  category,
  sort = 'latest',
  page = '1',
}: PostListServerProps) {
  // 정렬 옵션에 따른 orderBy 설정 (고정 게시글 제외)
  const getRegularOrderBy = (): Prisma.MainPostOrderByWithRelationInput[] => {
    switch (sort) {
      case 'popular':
      case 'views':
        return [{ viewCount: Prisma.SortOrder.desc }]
      case 'comments':
        return [{ commentCount: Prisma.SortOrder.desc }]
      default: // latest
        return [{ createdAt: Prisma.SortOrder.desc }]
    }
  }

  // 페이지네이션 설정
  const pageNumber = parseInt(page)
  const pageSize = 5 // 테스트를 위해 5개로 줄임
  const skip = (pageNumber - 1) * pageSize

  // 카테고리 필터 설정
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {
    status: 'PUBLISHED',
    ...(category && { category: { slug: category } }),
  }

  // 고정 게시글과 일반 게시글을 분리해서 조회
  const includeOptions = {
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
        icon: true,
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
        likes: true,
        comments: true,
      },
    },
  }

  const [pinnedPosts, regularPosts, totalCount, categories] = await Promise.all(
    [
      // 1. 고정 게시글만 조회 (전체에서)
      prisma.mainPost.findMany({
        where: {
          ...where,
          isPinned: true,
        },
        orderBy: getRegularOrderBy(), // 고정 게시글도 선택한 정렬 방식으로 정렬
        include: includeOptions,
      }),
      // 2. 일반 게시글만 조회 (페이지네이션 적용)
      prisma.mainPost.findMany({
        where: {
          ...where,
          isPinned: false,
        },
        orderBy: getRegularOrderBy(),
        skip,
        take: pageSize,
        include: includeOptions,
      }),
      // 3. 전체 일반 게시글 개수 조회
      prisma.mainPost.count({
        where: {
          ...where,
          isPinned: false,
        },
      }),
      // 4. 카테고리 조회
      prisma.mainCategory.findMany({
        include: {
          posts: {
            where: {
              status: 'PUBLISHED',
            },
            select: {
              id: true,
            },
          },
        },
        orderBy: {
          order: 'asc',
        },
      }),
    ]
  )

  // 고정 게시글과 일반 게시글 합치기 (고정이 항상 먼저)
  const allPosts = [...pinnedPosts, ...regularPosts]

  // Redis에서 실시간 조회수 가져오기
  const postIds = allPosts.map((post) => post.id)
  const redisViewCounts = new Map<string, number>()

  try {
    const redisClient = redis()
    if (redisClient) {
      const pipeline = redisClient.pipeline()

      // 각 게시글의 Redis 조회수 조회
      postIds.forEach((id) => {
        pipeline.get(`post:${id}:views`)
      })

      const results = await pipeline.exec()

      if (results) {
        results.forEach((result, index) => {
          const [err, value] = result
          if (!err && value) {
            redisViewCounts.set(postIds[index], parseInt(value as string))
          }
        })
      }
    }
  } catch (error) {
    console.error('Redis 조회수 조회 실패:', error)
    // Redis 오류 시 빈 Map 사용 (DB 조회수만 표시)
  }

  // 타입 변환 - formatMainPostForResponse 사용
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const formattedPosts = allPosts.map((post: any) => {
    // Redis 조회수 적용
    const postWithRedisViews = {
      ...post,
      viewCount: post.viewCount + (redisViewCounts.get(post.id) || 0),
    }

    // 통합 포맷터 사용
    return formatMainPostForResponse(postWithRedisViews) as MainPostFormatted
  })

  const formattedCategories = categories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    postCount: cat.posts.length,
  }))

  // 총 페이지 수 계산
  const totalPages = Math.ceil(totalCount / pageSize)

  return (
    <>
      <PostList
        initialPosts={formattedPosts}
        categories={formattedCategories}
        isLoading={false}
      />
      <Pagination
        currentPage={pageNumber}
        totalPages={totalPages}
        baseUrl="/main/posts"
        className="mt-8"
      />
    </>
  )
}
