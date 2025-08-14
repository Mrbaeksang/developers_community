/**
 * API Fetch Helpers
 * 통합 API 호출 유틸리티
 */

import type {
  MainPostFormatted,
  CommunityPostFormatted,
  PostListResponse,
  PostDetailResponse,
  PostPaginationParams,
  PostSearchParams,
  TrendingData,
  PostTag,
  PostAuthor,
} from '@/lib/post/types'

/**
 * API 기본 URL 가져오기
 */
function getAPIBaseUrl(): string {
  // 클라이언트 사이드
  if (typeof window !== 'undefined') {
    return ''
  }

  // 서버 사이드
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000')
  )
}

/**
 * 기본 fetch 옵션
 */
const DEFAULT_FETCH_OPTIONS: RequestInit = {
  headers: {
    'Content-Type': 'application/json',
  },
  cache: 'no-store',
}

/**
 * API 에러 클래스
 */
export class APIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string
  ) {
    super(message)
    this.name = 'APIError'
  }
}

/**
 * fetch with retry logic
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retries = 2
): Promise<Response> {
  let lastError: Error | null = null
  const baseUrl = getAPIBaseUrl()
  const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`

  for (let i = 0; i <= retries; i++) {
    try {
      const response = await fetch(fullUrl, {
        ...DEFAULT_FETCH_OPTIONS,
        ...options,
      })

      if (!response.ok && response.status >= 500 && i < retries) {
        // 서버 에러인 경우 재시도
        await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)))
        continue
      }

      return response
    } catch (error) {
      lastError = error as Error
      if (i < retries) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)))
        continue
      }
    }
  }

  throw lastError || new APIError('Failed to fetch')
}

/**
 * API 응답 처리
 */
async function handleAPIResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: 'An error occurred',
    }))
    throw new APIError(
      error.message || error.error || 'Request failed',
      response.status
    )
  }

  const data = await response.json()

  // 성공 응답 구조 확인
  if (data.success === false) {
    throw new APIError(data.error || 'Request failed')
  }

  return data
}

/**
 * 쿼리 파라미터 생성
 */
function buildQueryParams(params: Record<string, unknown>): string {
  const searchParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        value.forEach((item) => searchParams.append(key, String(item)))
      } else {
        searchParams.append(key, String(value))
      }
    }
  })

  const queryString = searchParams.toString()
  return queryString ? `?${queryString}` : ''
}

// ============================================================================
// Main Posts API
// ============================================================================

/**
 * 메인 게시글 목록 가져오기
 */
export async function fetchMainPosts(
  params: PostPaginationParams & { excludeCategories?: boolean } = {}
): Promise<PostListResponse<MainPostFormatted>> {
  const {
    page = 1,
    limit = 10,
    sort = 'latest',
    category,
    tag,
    excludeCategories,
  } = params

  const queryParams = buildQueryParams({
    page,
    limit,
    sort,
    category,
    tag,
    excludeCategories,
  })

  const response = await fetchWithRetry(`/api/main/posts${queryParams}`)
  return handleAPIResponse<PostListResponse<MainPostFormatted>>(response)
}

/**
 * 메인 게시글 상세 가져오기
 */
export async function fetchMainPostDetail(
  postId: string
): Promise<PostDetailResponse<MainPostFormatted>> {
  const response = await fetchWithRetry(`/api/main/posts/${postId}`)
  return handleAPIResponse<PostDetailResponse<MainPostFormatted>>(response)
}

/**
 * 주간 인기 게시글 가져오기
 */
export async function fetchWeeklyTrending(
  limit = 5
): Promise<MainPostFormatted[]> {
  const queryParams = buildQueryParams({ limit })
  const response = await fetchWithRetry(
    `/api/main/posts/weekly-trending${queryParams}`
  )
  const result =
    await handleAPIResponse<PostListResponse<MainPostFormatted>>(response)
  return result.data?.items || []
}

/**
 * 최근 게시글 가져오기
 */
export async function fetchRecentPosts(
  limit = 10
): Promise<MainPostFormatted[]> {
  const queryParams = buildQueryParams({
    limit,
    sort: 'latest',
  })
  const response = await fetchWithRetry(`/api/main/posts${queryParams}`)
  const result =
    await handleAPIResponse<PostListResponse<MainPostFormatted>>(response)
  return result.data?.items || []
}

/**
 * 게시글 검색
 */
export async function searchPosts(
  params: PostSearchParams
): Promise<PostListResponse<MainPostFormatted>> {
  const response = await fetchWithRetry('/api/main/posts/search', {
    method: 'POST',
    body: JSON.stringify(params),
  })
  return handleAPIResponse<PostListResponse<MainPostFormatted>>(response)
}

// ============================================================================
// Community Posts API
// ============================================================================

/**
 * 커뮤니티 게시글 목록 가져오기
 */
export async function fetchCommunityPosts(
  communityId: string,
  params: PostPaginationParams = {}
): Promise<PostListResponse<CommunityPostFormatted>> {
  const { page = 1, limit = 10, sort = 'latest', category } = params

  const queryParams = buildQueryParams({
    page,
    limit,
    sort,
    category,
  })

  const response = await fetchWithRetry(
    `/api/communities/${communityId}/posts${queryParams}`
  )
  return handleAPIResponse<PostListResponse<CommunityPostFormatted>>(response)
}

/**
 * 커뮤니티 게시글 상세 가져오기
 */
export async function fetchCommunityPostDetail(
  communityId: string,
  postId: string
): Promise<PostDetailResponse<CommunityPostFormatted>> {
  const response = await fetchWithRetry(
    `/api/communities/${communityId}/posts/${postId}`
  )
  return handleAPIResponse<PostDetailResponse<CommunityPostFormatted>>(response)
}

// ============================================================================
// Trending & Statistics API
// ============================================================================

/**
 * 트렌딩 태그 가져오기
 */
export async function fetchTrendingTags(
  limit = 10,
  period: 'daily' | 'weekly' | 'monthly' = 'weekly'
): Promise<Array<PostTag & { trendingScore: number }>> {
  const queryParams = buildQueryParams({ limit, period })

  const response = await fetchWithRetry(`/api/main/tags/trending${queryParams}`)
  const result = await handleAPIResponse<{
    data: Array<PostTag & { trendingScore: number }>
  }>(response)

  return result.data || []
}

/**
 * 주간 MVP 사용자 가져오기
 */
export async function fetchWeeklyMVPUsers(limit = 5): Promise<
  Array<
    PostAuthor & {
      postCount: number
      totalViews: number
      weeklyScore: number
    }
  >
> {
  const queryParams = buildQueryParams({ limit })

  const response = await fetchWithRetry(
    `/api/main/users/weekly-mvp${queryParams}`
  )
  const result = await handleAPIResponse<{
    data: Array<
      PostAuthor & {
        postCount: number
        totalViews: number
        weeklyScore: number
      }
    >
  }>(response)

  return result.data || []
}

/**
 * 전체 트렌딩 데이터 가져오기 (종합)
 */
export async function fetchTrendingData(
  period: 'daily' | 'weekly' | 'monthly' = 'weekly'
): Promise<TrendingData> {
  const [posts, tags, authors] = await Promise.all([
    fetchWeeklyTrending(5),
    fetchTrendingTags(10, period),
    fetchWeeklyMVPUsers(5),
  ])

  return {
    posts,
    tags,
    authors,
    period,
    updatedAt: new Date().toISOString(),
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * 에러 처리 헬퍼
 */
export function isAPIError(error: unknown): error is APIError {
  return error instanceof APIError
}

/**
 * 에러 메시지 추출
 */
export function getErrorMessage(error: unknown): string {
  if (isAPIError(error)) {
    return error.message
  }
  if (error instanceof Error) {
    return error.message
  }
  return '알 수 없는 오류가 발생했습니다'
}

/**
 * 재시도 가능 여부 확인
 */
export function isRetryableError(error: unknown): boolean {
  if (isAPIError(error)) {
    return error.status ? error.status >= 500 : false
  }
  return false
}

/**
 * Export all functions
 */
const fetchHelpers = {
  // Main posts
  fetchMainPosts,
  fetchMainPostDetail,
  fetchWeeklyTrending,
  fetchRecentPosts,
  searchPosts,

  // Community posts
  fetchCommunityPosts,
  fetchCommunityPostDetail,

  // Trending
  fetchTrendingTags,
  fetchWeeklyMVPUsers,
  fetchTrendingData,

  // Utils
  isAPIError,
  getErrorMessage,
  isRetryableError,
}

export default fetchHelpers
