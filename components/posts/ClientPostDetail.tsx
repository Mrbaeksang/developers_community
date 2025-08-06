'use client'

import { SessionProvider } from 'next-auth/react'
import PostDetail from './PostDetail'
import CommentSection from './CommentSection'
import type { Comment } from '@/lib/types'

interface ClientPostDetailProps {
  post: {
    id: string
    title: string
    content: string
    excerpt?: string | null
    status?: string
    viewCount: number
    likeCount: number
    commentCount: number
    createdAt: string
    updatedAt: string
    author: {
      id: string
      name: string | null
      image: string | null
    }
    category: {
      id: string
      name: string
      slug: string
      color: string
    }
    tags: Array<{
      id: string
      name: string
      slug: string
      color: string
    }>
    _count: {
      comments: number
      likes: number
      bookmarks: number
    }
    comments?: Comment[]
  }
}

export default function ClientPostDetail({ post }: ClientPostDetailProps) {
  return (
    <SessionProvider>
      <div className="space-y-8">
        <PostDetail post={post} />
        <CommentSection
          postId={post.id}
          initialComments={post.comments || []}
        />
      </div>
    </SessionProvider>
  )
}
