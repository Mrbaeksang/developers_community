/**
 * Post Query Hooks
 * React Query를 사용한 게시글 관련 훅
 */

import {
  useQuery,
  useInfiniteQuery,
  useQueryClient,
} from '@tanstack/react-query'
import type {
  UseQueryOptions,
  UseInfiniteQueryOptions,
} from '@tanstack/react-query'
import {
  fetchMainPosts,
  fetchMainPostDetail,
  fetchWeeklyTrending,
  fetchRecentPosts,
  fetchCommunityPosts,
  fetchTrendingTags,
  fetchWeeklyMVPUsers,
  fetchTrendingData,
  searchPosts,
} from '@/lib/api/fetch-helpers'
import type {
  MainPostFormatted,
  CommunityPostFormatted,
  PostListResponse,
  PostPaginationParams,
  PostSearchParams,
  TrendingData,
  PostTag,
  PostAuthor,
} from '@/lib/post/types'

/**
 * 기본 캐싱 전략
 */
const CACHE_CONFIG = {
  // 자주 변경되는 데이터 (30초)
  FREQUENT: {
    staleTime: 30 * 1000,
    gcTime: 60 * 1000,
  },
  // 보통 변경 빈도 (5분)
  NORMAL: {
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  },
  // 거의 변경되지 않는 데이터 (30분)
  STATIC: {
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  },
} as const

/**
 * Query Key Factory
 * 일관된 쿼리 키 생성
 */
export const postQueryKeys = {
  all: ['posts'] as const,

  // Main posts
  mainPosts: (params?: PostPaginationParams) =>
    ['posts', 'main', params] as const,
  mainPostDetail: (id: string) => ['posts', 'main', 'detail', id] as const,
  weeklyTrending: (limit?: number) =>
    ['posts', 'main', 'weekly-trending', limit] as const,
  recentPosts: (limit?: number) => ['posts', 'main', 'recent', limit] as const,
  searchPosts: (params: PostSearchParams) =>
    ['posts', 'main', 'search', params] as const,

  // Community posts
  communityPosts: (communityId: string, params?: PostPaginationParams) =>
    ['posts', 'community', communityId, params] as const,
  communityPostDetail: (communityId: string, postId: string) =>
    ['posts', 'community', communityId, 'detail', postId] as const,

  // Trending
  trendingTags: (limit?: number, period?: string) =>
    ['trending', 'tags', limit, period] as const,
  weeklyMVP: (limit?: number) => ['trending', 'mvp', 'weekly', limit] as const,
  trendingData: (period?: string) => ['trending', 'all', period] as const,
} as const

// ============================================================================
// Main Post Hooks
// ============================================================================

/**
 * 메인 게시글 목록 훅
 */
export function useMainPosts(
  params: PostPaginationParams = {},
  options?: Omit<
    UseQueryOptions<PostListResponse<MainPostFormatted>>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery({
    queryKey: postQueryKeys.mainPosts(params),
    queryFn: () => fetchMainPosts(params),
    ...CACHE_CONFIG.FREQUENT,
    refetchOnMount: true, // 마운트시 항상 refetch
    refetchOnWindowFocus: false, // 포커스시 refetch 비활성화
    ...options,
  })
}

/**
 * 메인 게시글 상세 훅
 */
export function useMainPostDetail(
  postId: string,
  options?: Omit<UseQueryOptions<MainPostFormatted>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: postQueryKeys.mainPostDetail(postId),
    queryFn: async () => {
      const response = await fetchMainPostDetail(postId)
      return response.data
    },
    ...CACHE_CONFIG.NORMAL,
    ...options,
  })
}

/**
 * 주간 인기 게시글 훅
 */
export function useWeeklyTrending(
  limit = 5,
  options?: Omit<UseQueryOptions<MainPostFormatted[]>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: postQueryKeys.weeklyTrending(limit),
    queryFn: () => fetchWeeklyTrending(limit),
    ...CACHE_CONFIG.FREQUENT,
    refetchInterval: 30 * 1000, // 30초마다 자동 새로고침
    ...options,
  })
}

/**
 * 최근 게시글 훅
 */
export function useRecentPosts(
  limit = 10,
  options?: Omit<UseQueryOptions<MainPostFormatted[]>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: postQueryKeys.recentPosts(limit),
    queryFn: () => fetchRecentPosts(limit),
    ...CACHE_CONFIG.FREQUENT,
    refetchInterval: 60 * 1000, // 1분마다 자동 새로고침
    ...options,
  })
}

/**
 * 게시글 검색 훅
 */
export function useSearchPosts(
  params: PostSearchParams,
  options?: Omit<
    UseQueryOptions<PostListResponse<MainPostFormatted>>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery({
    queryKey: postQueryKeys.searchPosts(params),
    queryFn: () => searchPosts(params),
    ...CACHE_CONFIG.NORMAL,
    enabled: !!params.query && params.query.length > 0,
    ...options,
  })
}

/**
 * 무한 스크롤용 메인 게시글 훅
 */
export function useInfiniteMainPosts(
  baseParams: Omit<PostPaginationParams, 'page'> = {},
  options?: Omit<
    UseInfiniteQueryOptions<PostListResponse<MainPostFormatted>>,
    'queryKey' | 'queryFn' | 'getNextPageParam' | 'initialPageParam'
  >
) {
  return useInfiniteQuery({
    queryKey: ['posts', 'main', 'infinite', baseParams],
    queryFn: ({ pageParam }) =>
      fetchMainPosts({ ...baseParams, page: pageParam as number }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const hasNext = lastPage.data?.pageInfo?.hasNext
      return hasNext ? allPages.length + 1 : undefined
    },
    ...CACHE_CONFIG.FREQUENT,
    ...options,
  })
}

// ============================================================================
// Community Post Hooks
// ============================================================================

/**
 * 커뮤니티 게시글 목록 훅
 */
export function useCommunityPosts(
  communityId: string,
  params: PostPaginationParams = {},
  options?: Omit<
    UseQueryOptions<PostListResponse<CommunityPostFormatted>>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery({
    queryKey: postQueryKeys.communityPosts(communityId, params),
    queryFn: () => fetchCommunityPosts(communityId, params),
    ...CACHE_CONFIG.FREQUENT,
    ...options,
  })
}

/**
 * 커뮤니티 게시글 상세 훅
 */
export function useCommunityPostDetail(
  communityId: string,
  postId: string,
  options?: Omit<
    UseQueryOptions<CommunityPostFormatted>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery({
    queryKey: postQueryKeys.communityPostDetail(communityId, postId),
    queryFn: async () => {
      const response = await fetchCommunityPosts(communityId, { limit: 1 })
      return response.data.items[0]
    },
    ...CACHE_CONFIG.NORMAL,
    enabled: !!communityId && !!postId,
    ...options,
  })
}

// ============================================================================
// Trending Hooks
// ============================================================================

/**
 * 트렌딩 태그 훅
 */
export function useTrendingTags(
  limit = 10,
  period: 'daily' | 'weekly' | 'monthly' = 'weekly',
  options?: Omit<
    UseQueryOptions<Array<PostTag & { trendingScore: number }>>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery({
    queryKey: postQueryKeys.trendingTags(limit, period),
    queryFn: () => fetchTrendingTags(limit, period),
    ...CACHE_CONFIG.NORMAL,
    refetchInterval: 5 * 60 * 1000, // 5분마다 새로고침
    ...options,
  })
}

/**
 * 주간 MVP 사용자 훅
 */
export function useWeeklyMVPUsers(
  limit = 5,
  options?: Omit<
    UseQueryOptions<
      Array<
        PostAuthor & {
          postCount: number
          totalViews: number
          weeklyScore: number
        }
      >
    >,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery({
    queryKey: postQueryKeys.weeklyMVP(limit),
    queryFn: () => fetchWeeklyMVPUsers(limit),
    ...CACHE_CONFIG.NORMAL,
    refetchInterval: 10 * 60 * 1000, // 10분마다 새로고침
    ...options,
  })
}

/**
 * 종합 트렌딩 데이터 훅
 */
export function useTrendingData(
  period: 'daily' | 'weekly' | 'monthly' = 'weekly',
  options?: Omit<UseQueryOptions<TrendingData>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: postQueryKeys.trendingData(period),
    queryFn: () => fetchTrendingData(period),
    ...CACHE_CONFIG.NORMAL,
    refetchInterval: 5 * 60 * 1000, // 5분마다 새로고침
    ...options,
  })
}

// ============================================================================
// Utility Hooks
// ============================================================================

/**
 * 쿼리 캐시 무효화 훅
 */
export function useInvalidatePosts() {
  const queryClient = useQueryClient()

  return {
    invalidateAll: () =>
      queryClient.invalidateQueries({ queryKey: postQueryKeys.all }),

    invalidateMainPosts: (params?: PostPaginationParams) =>
      queryClient.invalidateQueries({
        queryKey: postQueryKeys.mainPosts(params),
      }),

    invalidateMainPostDetail: (id: string) =>
      queryClient.invalidateQueries({
        queryKey: postQueryKeys.mainPostDetail(id),
      }),

    invalidateWeeklyTrending: () =>
      queryClient.invalidateQueries({
        queryKey: ['posts', 'main', 'weekly-trending'],
      }),

    invalidateCommunityPosts: (communityId: string) =>
      queryClient.invalidateQueries({
        queryKey: ['posts', 'community', communityId],
      }),

    invalidateTrending: () =>
      queryClient.invalidateQueries({
        queryKey: ['trending'],
      }),
  }
}

/**
 * 프리페치 훅
 */
export function usePrefetchPosts() {
  const queryClient = useQueryClient()

  return {
    prefetchMainPosts: (params: PostPaginationParams = {}) =>
      queryClient.prefetchQuery({
        queryKey: postQueryKeys.mainPosts(params),
        queryFn: () => fetchMainPosts(params),
        ...CACHE_CONFIG.NORMAL,
      }),

    prefetchMainPostDetail: (id: string) =>
      queryClient.prefetchQuery({
        queryKey: postQueryKeys.mainPostDetail(id),
        queryFn: () => fetchMainPostDetail(id),
        ...CACHE_CONFIG.NORMAL,
      }),

    prefetchWeeklyTrending: (limit = 5) =>
      queryClient.prefetchQuery({
        queryKey: postQueryKeys.weeklyTrending(limit),
        queryFn: () => fetchWeeklyTrending(limit),
        ...CACHE_CONFIG.FREQUENT,
      }),
  }
}

/**
 * 페이지 포커스 시 새로고침 훅
 */
export function useRefreshOnFocus(queryKey: readonly unknown[]) {
  const queryClient = useQueryClient()

  if (typeof window !== 'undefined') {
    window.addEventListener('focus', () => {
      queryClient.invalidateQueries({ queryKey })
    })
  }
}

/**
 * Export all hooks
 */
const postQueryHooks = {
  // Main posts
  useMainPosts,
  useMainPostDetail,
  useWeeklyTrending,
  useRecentPosts,
  useSearchPosts,
  useInfiniteMainPosts,

  // Community posts
  useCommunityPosts,
  useCommunityPostDetail,

  // Trending
  useTrendingTags,
  useWeeklyMVPUsers,
  useTrendingData,

  // Utilities
  useInvalidatePosts,
  usePrefetchPosts,
  useRefreshOnFocus,
}

export default postQueryHooks
