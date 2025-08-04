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
    const pipeline = client.pipeline()
    postIds.forEach((postId) => {
      pipeline.get(`${prefix}:${postId}:views`)
    })

    const results = await pipeline.exec()
    if (results) {
      results.forEach((result, index) => {
        const [err, value] = result || [null, null]
        if (!err && value && postIds[index]) {
          viewCountsMap.set(postIds[index], parseInt(value as string))
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
    // 날짜 배열 생성
    const dates: string[] = []
    for (let i = 0; i < days; i++) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      dates.push(date.toISOString().split('T')[0])
    }

    // 파이프라인 생성
    const pipeline = client.pipeline()

    postIds.forEach((postId) => {
      // 각 날짜별 조회수
      dates.forEach((date) => {
        pipeline.get(`${prefix}:${postId}:views:${date}`)
      })
      // 현재 버퍼 조회수
      pipeline.get(`${prefix}:${postId}:views`)
    })

    // 실행
    const results = await pipeline.exec()

    if (results) {
      let resultIndex = 0

      postIds.forEach((postId) => {
        let weeklyViews = 0

        // 날짜별 조회수 합산
        for (let i = 0; i < dates.length; i++) {
          const [err, value] = results[resultIndex++] || [null, null]
          if (!err && value) {
            weeklyViews += parseInt(value as string)
          }
        }

        // 버퍼 조회수 추가
        const [err, bufferValue] = results[resultIndex++] || [null, null]
        if (!err && bufferValue) {
          weeklyViews += parseInt(bufferValue as string)
        }

        weeklyViewsMap.set(postId, weeklyViews)
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
