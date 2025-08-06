/**
 * 커서 기반 페이지네이션 타입 정의
 */
export interface CursorPaginationParams {
  cursor?: string | null
  limit?: number
  direction?: 'forward' | 'backward'
}

export interface OffsetPaginationParams {
  page?: number
  limit?: number
}

export interface PaginationResult<T> {
  items: T[]
  nextCursor: string | null
  prevCursor?: string | null
  hasMore: boolean
  total?: number
}

/**
 * 커서 기반 페이지네이션을 위한 where 조건 생성
 * createdAt 필드를 기준으로 커서 처리
 */
export function getCursorCondition(
  cursor: string | null | undefined,
  direction: 'forward' | 'backward' = 'forward'
): { createdAt?: { lt?: Date; gt?: Date } } {
  if (!cursor) return {}

  try {
    const cursorDate = new Date(cursor)
    if (isNaN(cursorDate.getTime())) return {}

    return {
      createdAt:
        direction === 'forward' ? { lt: cursorDate } : { gt: cursorDate },
    }
  } catch {
    return {}
  }
}

/**
 * 오프셋 기반 페이지네이션을 위한 skip/take 계산
 * 기존 API와의 호환성 유지
 */
export function getPaginationSkipTake(params: OffsetPaginationParams) {
  const page = Math.max(1, params.page || 1)
  const limit = Math.min(100, Math.max(1, params.limit || 20))

  return {
    skip: (page - 1) * limit,
    take: limit,
  }
}

/**
 * 커서 기반 페이지네이션을 위한 take 계산
 * 다음 페이지 존재 여부 확인을 위해 limit + 1 반환
 */
export function getCursorTake(limit: number = 20) {
  const safeLimit = Math.min(100, Math.max(1, limit))
  return safeLimit + 1
}

/**
 * 커서 기반 응답 포맷팅
 * 다음/이전 커서와 hasMore 플래그 계산
 */
export function formatCursorResponse<T extends { createdAt: Date }>(
  items: T[],
  requestedLimit: number
): PaginationResult<T> {
  const hasMore = items.length > requestedLimit
  const resultItems = hasMore ? items.slice(0, -1) : items

  return {
    items: resultItems,
    nextCursor:
      hasMore && resultItems.length > 0
        ? resultItems[resultItems.length - 1].createdAt.toISOString()
        : null,
    prevCursor:
      resultItems.length > 0 ? resultItems[0].createdAt.toISOString() : null,
    hasMore,
  }
}

/**
 * 하이브리드 페이지네이션 지원
 * page 파라미터와 cursor 파라미터 동시 지원
 */
export function parseHybridPagination(searchParams: URLSearchParams) {
  const cursor = searchParams.get('cursor')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')

  // cursor가 있으면 커서 기반 사용
  if (cursor) {
    return {
      type: 'cursor' as const,
      cursor,
      limit,
    }
  }

  // 없으면 기존 오프셋 기반 사용
  return {
    type: 'offset' as const,
    page,
    limit,
  }
}

/**
 * 표준 페이지네이션 응답 생성
 * 기존 클라이언트와의 호환성 유지
 */
export function createPaginatedResponse<T>(
  data: T[],
  total: number,
  pagination: { page?: number; limit: number; cursor?: string | null }
): {
  success: boolean
  data: T[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
    cursor?: string | null
    hasMore?: boolean
  }
} {
  const page = pagination.page || 1
  const totalPages = Math.ceil(total / pagination.limit)

  // 커서 기반인 경우 cursor 정보 추가
  if (pagination.cursor !== undefined) {
    const hasMore = data.length > pagination.limit
    const items = hasMore ? data.slice(0, -1) : data

    return {
      success: true,
      data: items,
      pagination: {
        total,
        page,
        limit: pagination.limit,
        totalPages,
        // 커서 정보 추가
        cursor:
          items.length > 0
            ? (
                items[items.length - 1] as T & { createdAt?: Date }
              ).createdAt?.toISOString()
            : null,
        hasMore,
      },
    }
  }

  // 기존 오프셋 기반 응답
  return {
    success: true,
    data,
    pagination: {
      total,
      page,
      limit: pagination.limit,
      totalPages,
    },
  }
}
