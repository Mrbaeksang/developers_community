import { redis } from '@/lib/redis'

/**
 * 게시글 조회를 위한 공통 include 패턴
 */
export const postInclude = {
  // 기본 필드들
  basic: {
    author: {
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
      },
    },
    category: true,
    _count: {
      select: {
        comments: true,
        likes: true,
      },
    },
  },

  // 태그 포함
  withTags: {
    author: {
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
      },
    },
    category: true,
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
      },
    },
  },

  // 사용자별 좋아요/북마크 상태 포함
  withUserStatus: (userId?: string) => ({
    author: {
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
      },
    },
    category: true,
    _count: {
      select: {
        comments: true,
        likes: true,
      },
    },
    likes: userId
      ? {
          where: { userId },
          select: { id: true },
        }
      : false,
    bookmarks: userId
      ? {
          where: { userId },
          select: { id: true },
        }
      : false,
  }),

  // 최소 필드만 (리스트용)
  minimal: {
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
  },
}

/**
 * Redis에서 게시글 조회수를 일괄로 가져오는 함수
 * post_views 해시를 사용하여 효율적으로 조회
 */
export async function getBatchViewCounts(
  postIds: string[],
  prefix: 'post' | 'community:post' = 'post'
): Promise<Map<string, number>> {
  const viewCountsMap = new Map<string, number>()

  if (postIds.length === 0) {
    return viewCountsMap
  }

  const client = redis()
  if (!client) {
    return viewCountsMap
  }

  try {
    // post_views 해시에서 한번에 조회
    const pipeline = client.pipeline()
    postIds.forEach((postId) => {
      pipeline.hget('post_views', postId)
    })

    const results = await pipeline.exec()
    if (results) {
      results.forEach((result, index) => {
        const [err, value] = result || [null, null]
        if (!err && value && postIds[index]) {
          viewCountsMap.set(postIds[index], parseInt(value as string))
        } else if (postIds[index]) {
          // Redis에 없으면 0 반환
          viewCountsMap.set(postIds[index], 0)
        }
      })
    }
  } catch (error) {
    console.error('Error fetching batch view counts:', error)
  }

  return viewCountsMap
}

/**
 * 주간 조회수를 일괄로 가져오는 함수
 * 현재 Redis에 저장된 전체 조회수를 사용 (날짜별 분리 안함)
 */
export async function getBatchWeeklyViewCounts(
  postIds: string[],
  days: number = 7,
  prefix: 'post' | 'community:post' = 'post'
): Promise<Map<string, number>> {
  const weeklyViewsMap = new Map<string, number>()

  if (postIds.length === 0) {
    return weeklyViewsMap
  }

  const client = redis()
  if (!client) {
    return weeklyViewsMap
  }

  try {
    // Redis에서 현재 조회수 가져오기 (post_views 해시 사용)
    const pipeline = client.pipeline()
    postIds.forEach((postId) => {
      pipeline.hget('post_views', postId)
    })

    const results = await pipeline.exec()
    if (results) {
      results.forEach((result, index) => {
        const [err, value] = result || [null, null]
        if (!err && value && postIds[index]) {
          weeklyViewsMap.set(postIds[index], parseInt(value as string))
        }
      })
    }
  } catch (error) {
    console.error('Error fetching batch weekly view counts:', error)
  }

  return weeklyViewsMap
}

/**
 * 게시글 정렬 옵션 처리
 */
export function getPostOrderBy(
  sort?: string | null
): Record<string, 'asc' | 'desc'> {
  switch (sort) {
    case 'popular':
      return { viewCount: 'desc' }
    case 'likes':
      return { likeCount: 'desc' }
    case 'bookmarks':
      return { bookmarkCount: 'desc' }
    case 'commented':
      return { commentCount: 'desc' }
    case 'oldest':
      return { createdAt: 'asc' }
    default:
      return { createdAt: 'desc' }
  }
}

/**
 * 페이지네이션 헬퍼
 */
export interface PaginationParams {
  page?: number
  limit?: number
}

export interface RequiredPaginationParams {
  page: number
  limit: number
}

export function getPaginationParams(
  searchParams: URLSearchParams
): RequiredPaginationParams {
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '10')

  return {
    page: Math.max(1, page),
    limit: Math.min(100, Math.max(1, limit)),
  }
}

export function getPaginationSkipTake(params: PaginationParams) {
  const { page = 1, limit = 10 } = params
  return {
    skip: (page - 1) * limit,
    take: limit,
  }
}
