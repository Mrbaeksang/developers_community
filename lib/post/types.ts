/**
 * Post Type System
 * 게시글 관련 통합 타입 정의
 */

/**
 * 기본 작성자 타입
 */
export interface PostAuthor {
  id: string
  name: string | null
  username?: string | null
  email?: string | null
  image: string | null
  role?: string
}

/**
 * 카테고리 타입
 */
export interface PostCategory {
  id: string
  name: string
  slug: string
  color: string | null
  icon?: string | null
}

/**
 * 태그 타입
 */
export interface PostTag {
  id: string
  name: string
  slug: string
  color?: string | null
  postCount?: number
}

/**
 * 게시글 카운트 타입
 */
export interface PostCount {
  likes?: number
  comments?: number
  bookmarks?: number
}

/**
 * 메인 게시글 기본 타입 (DB에서 직접 가져온 구조)
 */
export interface MainPostRaw {
  id: string
  title: string
  slug: string
  content: string
  excerpt: string | null
  createdAt: Date | string
  updatedAt?: Date | string
  isPinned: boolean
  status?: string
  viewCount: number
  likeCount?: number
  commentCount?: number
  bookmarkCount?: number
  author: PostAuthor
  category: PostCategory
  tags?: Array<{
    tag?: PostTag
    id?: string
    name?: string
    slug?: string
    color?: string | null
  }>
  _count?: PostCount
}

/**
 * 커뮤니티 게시글 기본 타입
 */
export interface CommunityPostRaw {
  id: string
  title: string
  content: string
  createdAt: Date | string
  updatedAt?: Date | string
  viewCount: number
  likeCount?: number
  commentCount?: number
  bookmarkCount?: number
  author: PostAuthor
  category?: PostCategory | null
  community?: {
    id: string
    name: string
    slug: string
  }
  _count?: PostCount
  isLiked?: boolean
  isBookmarked?: boolean
}

/**
 * API 응답용 포맷된 메인 게시글 타입
 * formatMainPostForResponse의 반환 타입
 */
export interface MainPostFormatted {
  id: string
  title: string
  slug: string
  content: string
  excerpt: string | null
  createdAt: string | Date // 옵션에 따라 변경 가능
  isPinned: boolean
  status:
    | 'DRAFT'
    | 'PENDING'
    | 'PUBLISHED'
    | 'REJECTED'
    | 'ARCHIVED'
    | 'DELETED'
  viewCount: number
  likeCount: number
  commentCount: number
  bookmarkCount: number
  author: PostAuthor
  category: PostCategory
  tags: PostTag[]
  // 계산된 필드
  readingTime?: number
  timeAgo?: string
  // 주간 통계
  weeklyViews?: number
  weeklyScore?: number
}

/**
 * API 응답용 포맷된 커뮤니티 게시글 타입
 */
export interface CommunityPostFormatted {
  id: string
  title: string
  content: string
  createdAt: string | Date
  viewCount: number
  likeCount: number
  commentCount: number
  bookmarkCount: number
  author: PostAuthor
  category?: PostCategory | null
  community?: {
    id: string
    name: string
    slug: string
  }
  // 계산된 필드
  readingTime?: number
  // 사용자별 상태
  isLiked: boolean
  isBookmarked: boolean
}

/**
 * 클라이언트 컴포넌트용 확장 타입
 * UI에서 필요한 추가 필드 포함
 */
export interface PostWithUIFields extends MainPostFormatted {
  // UI 계산 필드
  displayDate?: string
  isNew?: boolean
  isHot?: boolean
  rankingBadge?: {
    icon: string | null
    className: string
    showNumber: boolean
  }
}

/**
 * 리스트 응답 타입
 */
export interface PostListResponse<T = MainPostFormatted> {
  data: {
    items: T[]
    totalCount: number
    pageInfo?: {
      currentPage: number
      pageSize: number
      hasNext: boolean
      hasPrev: boolean
    }
  }
  success: boolean
  error?: string
}

/**
 * 단일 게시글 응답 타입
 */
export interface PostDetailResponse<T = MainPostFormatted> {
  data: T
  success: boolean
  error?: string
}

/**
 * 페이지네이션 파라미터
 */
export interface PostPaginationParams {
  page?: number
  limit?: number
  cursor?: string
  sort?: 'latest' | 'popular' | 'views' | 'comments'
  category?: string
  tag?: string
}

/**
 * 필터 옵션
 */
export interface PostFilterOptions {
  status?: 'PUBLISHED' | 'DRAFT' | 'PENDING' | 'REJECTED' | 'ARCHIVED'
  isPinned?: boolean
  hasComments?: boolean
  hasLikes?: boolean
  dateFrom?: Date | string
  dateTo?: Date | string
  authorId?: string
  categoryId?: string
  tagIds?: string[]
}

/**
 * 검색 파라미터
 */
export interface PostSearchParams {
  query: string
  fields?: ('title' | 'content' | 'excerpt' | 'tags')[]
  filters?: PostFilterOptions
  pagination?: PostPaginationParams
}

/**
 * 통계 타입
 */
export interface PostStatistics {
  totalViews: number
  totalLikes: number
  totalComments: number
  totalBookmarks: number
  averageReadingTime: number
  engagementRate: number
}

/**
 * 트렌딩 데이터 타입
 */
export interface TrendingData {
  posts: MainPostFormatted[]
  tags: Array<PostTag & { trendingScore: number }>
  authors: Array<
    PostAuthor & {
      postCount: number
      totalViews: number
      weeklyScore: number
    }
  >
  period: 'daily' | 'weekly' | 'monthly'
  updatedAt: string
}

/**
 * 타입 가드 함수들
 */
export function isMainPost(post: unknown): post is MainPostRaw {
  return (
    typeof post === 'object' &&
    post !== null &&
    'slug' in post &&
    'excerpt' in post &&
    'isPinned' in post
  )
}

export function isCommunityPost(post: unknown): post is CommunityPostRaw {
  return (
    typeof post === 'object' &&
    post !== null &&
    'title' in post &&
    'content' in post &&
    !('slug' in post)
  )
}

export function hasCalculatedFields(
  post: MainPostFormatted | CommunityPostFormatted
): post is MainPostFormatted & { readingTime: number } {
  return 'readingTime' in post && typeof post.readingTime === 'number'
}

/**
 * Legacy 타입 별칭 (하위 호환성)
 */
export type CommonMainPost = MainPostFormatted
export type PostWithCalculatedFields = PostWithUIFields

/**
 * Export all types
 */
export type {
  MainPostRaw as RawMainPost,
  CommunityPostRaw as RawCommunityPost,
  MainPostFormatted as FormattedMainPost,
  CommunityPostFormatted as FormattedCommunityPost,
}
