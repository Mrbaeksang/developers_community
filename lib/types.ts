// 게시물 관련 타입 정의
export interface Post {
  id: string
  title: string
  slug: string
  content: string
  excerpt?: string
  published: boolean
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
  }
  type: 'ARTICLE' | 'QUESTION' | 'DISCUSSION' | 'TUTORIAL' | 'NEWS'
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  viewCount: number
  createdAt: Date | string
  updatedAt: Date | string
  publishedAt?: Date | string | null
  tags: PostTag[]
  _count?: {
    comments: number
    postLikes: number
  }
}

export interface PostTag {
  id: string
  tag: Tag
}

export interface Tag {
  id: string
  name: string
  slug: string
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
