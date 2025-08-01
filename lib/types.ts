// 게시물 관련 타입 정의
export interface Post {
  id: string
  title: string
  slug: string
  content: string
  excerpt?: string
  authorId: string
  author: {
    id: string
    name: string | null
    email: string
    image: string | null
  }
  categoryId: string
  category?: {
    id: string
    name: string
    slug: string
    color: string
    icon?: string | null
  }
  type?: 'ARTICLE' | 'QUESTION' | 'DISCUSSION' | 'TUTORIAL' | 'NEWS'
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  viewCount: number
  createdAt: Date | string
  updatedAt: Date | string
  publishedAt?: Date | string
  isPinned?: boolean
  tags: Tag[]
  _count?: {
    comments: number
    likes: number
  }
}

// PostTag 인터페이스는 더 이상 사용되지 않습니다
// API에서 tags를 Tag[] 형태로 직접 반환합니다

export interface Tag {
  id: string
  name: string
  slug: string
  color: string
}

export interface Comment {
  id: string
  content: string
  authorId: string
  author: {
    id: string
    name: string | null
    email: string
    image: string | null
  }
  postId: string
  parentId?: string | null
  createdAt: Date | string
  updatedAt: Date | string
  _count?: {
    replies: number
    commentLikes: number
  }
}

export interface PostLike {
  id: string
  userId: string
  postId: string
  createdAt: Date | string
}

export interface CommentLike {
  id: string
  userId: string
  commentId: string
  createdAt: Date | string
}
