// Comment types for unified handling
export interface CommentAuthor {
  id: string
  name: string | null
  image: string | null
  badge?: string // 'ADMIN' | 'MODERATOR' | 'MEMBER' etc
}

export interface CommentPost {
  id: string
  title: string
  slug: string
  type: 'MAIN' | 'COMMUNITY'
  communityId?: string
  communityName?: string
  categoryId?: string
  categoryName?: string
  categorySlug?: string
  categoryColor?: string
  categoryIcon?: string | null
}

export interface CommentStats {
  likeCount: number
  replyCount?: number
  isLiked?: boolean
}

export interface CommentFormatted {
  id: string
  content: string
  createdAt: Date | string
  updatedAt?: Date | string
  author?: CommentAuthor
  post?: CommentPost
  stats?: CommentStats
  parentId?: string | null
  depth?: number
  isEdited?: boolean
  isPinned?: boolean
}
