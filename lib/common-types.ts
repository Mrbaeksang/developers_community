/**
 * 공통 데이터 타입 정의
 * MainPost와 CommunityPost의 통합된 인터페이스
 */

// 공통 작성자 인터페이스
export interface CommonAuthor {
  id: string
  name: string | null
  email?: string | null
  image: string | null
  username?: string | null
  role?: string // 글로벌 역할
}

// 공통 카테고리 인터페이스
export interface CommonCategory {
  id: string
  name: string
  slug: string
  color?: string | null
  icon?: string | null
  description?: string | null
}

// 공통 태그 인터페이스 (MainPost만 사용)
export interface CommonTag {
  id: string
  name: string
  slug: string
  color?: string | null
}

// 공통 카운트 인터페이스
export interface CommonCount {
  comments: number
  likes: number
  bookmarks?: number
}

// 기본 게시글 인터페이스 (공통 필드만)
export interface BasePost {
  id: string
  title: string
  content: string
  viewCount: number
  isPinned?: boolean
  createdAt: Date | string
  updatedAt?: Date | string
  author: CommonAuthor
  category?: CommonCategory | null
  _count?: CommonCount

  // 사용자별 상태 (로그인된 사용자에게만 제공)
  isLiked?: boolean
  isBookmarked?: boolean

  // 포맷된 필드 (API에서 추가로 제공)
  timeAgo?: string
}

// 메인 게시글 인터페이스 (BasePost 확장)
export interface CommonMainPost extends BasePost {
  slug: string
  excerpt?: string | null
  status:
    | 'DRAFT'
    | 'PENDING'
    | 'PUBLISHED'
    | 'REJECTED'
    | 'ARCHIVED'
    | 'DELETED'
  approvedAt?: Date | string | null
  tags: CommonTag[]

  // 카테고리는 필수 (하지만 null일 수 있음)
  category: CommonCategory | null
}

// 커뮤니티 게시글 인터페이스 (BasePost 확장)
export interface CommonCommunityPost extends BasePost {
  communityId: string
  authorRole?: 'MEMBER' | 'MODERATOR' | 'ADMIN' | 'OWNER' // 작성 시점의 커뮤니티 역할
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'DELETED'

  // 첨부파일 (커뮤니티 게시글만 지원)
  files?: Array<{
    id: string
    url: string
    filename: string
    fileSize: number
    mimeType: string
    type: 'IMAGE' | 'DOCUMENT' | 'VIDEO' | 'AUDIO' | 'ARCHIVE' | 'OTHER'
  }>
}

// 통합 게시글 타입 (Union type)
export type UnifiedPost = CommonMainPost | CommonCommunityPost

// 타입 가드 함수들
export function isMainPost(post: UnifiedPost): post is CommonMainPost {
  return 'slug' in post && 'tags' in post
}

export function isCommunityPost(
  post: UnifiedPost
): post is CommonCommunityPost {
  return 'communityId' in post
}

// API 응답용 인터페이스들
export interface PostListResponse<T = UnifiedPost> {
  posts: T[]
  total?: number
  pagination?: {
    page: number
    limit: number
    pages: number
    total: number
  }
  categories?: CommonCategory[]
}

export interface CursorPostListResponse<T = UnifiedPost> {
  items: T[]
  total?: number
  pagination: {
    limit: number
    nextCursor: string | null
    hasMore: boolean
    total?: number
  }
}

// 호환성을 위한 확장 인터페이스들 (기존 API에서 사용중)
export interface WeeklyTrendingPost extends CommonMainPost {
  weeklyViews?: number
  weeklyScore?: number
}

export interface RelatedPost extends CommonMainPost {
  // 호환성을 위해 _count 대신 직접 필드도 제공
  likeCount?: number
  commentCount?: number
}

// 검색 결과용 - CommonMainPost와 동일하므로 별칭으로 처리
export type SearchResultPost = CommonMainPost

// 댓글 인터페이스 (MainComment와 CommunityComment 통합)
export interface CommonComment {
  id: string
  content: string
  authorId: string
  author: CommonAuthor
  postId?: string // MainComment용
  communityPostId?: string // CommunityComment용
  parentId?: string | null
  createdAt: Date | string
  updatedAt?: Date | string
  isEdited?: boolean
  authorRole?: string // CommunityComment용 (작성 시점 역할)

  // 대댓글
  replies?: CommonComment[]
  _count?: {
    replies: number
    likes: number
  }

  // 사용자별 상태
  isLiked?: boolean
}

// 좋아요 인터페이스
export interface CommonLike {
  id: string
  userId: string
  postId?: string // MainLike용
  communityPostId?: string // CommunityLike용
  commentId?: string // 댓글 좋아요용
  createdAt: Date | string
}

// 북마크 인터페이스
export interface CommonBookmark {
  id: string
  userId: string
  postId?: string // MainBookmark용
  communityPostId?: string // CommunityBookmark용
  createdAt: Date | string

  // 연관된 게시글 정보
  post?: CommonMainPost
  communityPost?: CommonCommunityPost
}

// 알림 인터페이스
export interface CommonNotification {
  id: string
  type:
    | 'POST_LIKE'
    | 'POST_COMMENT'
    | 'COMMENT_REPLY'
    | 'COMMUNITY_INVITE'
    | 'SYSTEM'
  title: string
  message: string
  isRead: boolean
  createdAt: Date | string
  resourceIds?: {
    postId?: string
    commentId?: string
    communityId?: string
  }
  sender?: CommonAuthor
}

// 활동 인터페이스 (관리자 대시보드용)
export interface CommonActivity {
  id: string
  type:
    | 'post'
    | 'comment'
    | 'like'
    | 'member_join'
    | 'view_milestone'
    | 'error'
    | 'slow_api'
  title: string
  description: string
  userName: string
  timestamp: string
  metadata?: {
    postId?: string
    postTitle?: string
    communityName?: string
    viewCount?: number
    endpoint?: string
    statusCode?: number
    responseTime?: number
  }
}

// 커뮤니티 인터페이스
export interface CommonCommunity {
  id: string
  name: string
  slug: string
  description?: string | null
  avatar?: string | null
  banner?: string | null
  visibility: 'PUBLIC' | 'PRIVATE'
  allowFileUpload?: boolean
  allowChat?: boolean
  maxFileSize?: number
  createdAt: Date | string
  updatedAt?: Date | string

  owner: CommonAuthor
  _count?: {
    members: number
    posts: number
    categories?: number
    announcements?: number
  }

  // 사용자별 상태 (로그인된 사용자에게만 제공)
  membershipStatus?:
    | 'OWNER'
    | 'ADMIN'
    | 'MODERATOR'
    | 'MEMBER'
    | 'PENDING'
    | 'NONE'
  userRole?: string
}

// 사용자 인터페이스
export interface CommonUser {
  id: string
  name: string | null
  username?: string | null
  email: string
  image: string | null
  globalRole?: 'ADMIN' | 'MANAGER' | 'USER'
  bio?: string | null
  showEmail?: boolean
  createdAt: Date | string
  isActive?: boolean
  isBanned?: boolean

  _count?: {
    mainPosts: number
    mainComments: number
    mainLikes: number
    communityPosts: number
    communityComments: number
    communityLikes: number
    ownedCommunities: number
    communityMemberships: number
  }
}

// 타입 변환 유틸리티 함수들 (실제 필요한 것만)
export function convertToCommonMainPost(
  dbPost: Record<string, unknown>
): CommonMainPost {
  return {
    ...dbPost,
    tags:
      (dbPost.tags as Array<{ tag: CommonTag }>)?.map(
        (postTag) => postTag.tag
      ) || [],
  } as CommonMainPost
}

export function convertToCommonCommunityPost(
  dbPost: Record<string, unknown>
): CommonCommunityPost {
  return dbPost as unknown as CommonCommunityPost
}

// 호환성을 위한 기존 Post 타입 별칭
export type Post = CommonMainPost
export type CommunityPost = CommonCommunityPost

// 포맷 유틸리티 함수
export function formatCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`
  }
  return count.toString()
}

// 색상 관련 유틸리티 함수
export function getLuminance(color: string): number {
  // hex 색상을 RGB로 변환
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : { r: 100, g: 100, b: 100 }
  }

  const rgb = hexToRgb(color)
  // 밝기 계산 (0-255)
  return 0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b
}

export function getTextColor(backgroundColor: string): string {
  // 배경색이 밝으면 검은색, 어두우면 흰색 텍스트
  return getLuminance(backgroundColor) > 128 ? '#000000' : '#ffffff'
}
