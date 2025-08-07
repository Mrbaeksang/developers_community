'use client'

import { SessionProvider } from 'next-auth/react'
import { UnifiedPostDetail } from './UnifiedPostDetail'
import CommentSection from './CommentSection'
import { UnifiedPostDetail as PostType } from '@/lib/post/display'

// Comment type defined locally
type Comment = {
  id: string
  content: string
  createdAt: Date
  updatedAt: Date
  userId: string
  author: {
    id: string
    name: string | null
    image: string | null
  }
  isEdited?: boolean
  parentId: string | null
  replies?: Comment[]
}

interface ClientPostDetailProps {
  post: PostType & {
    comments?: Comment[]
  }
}

export default function ClientPostDetail({ post }: ClientPostDetailProps) {
  return (
    <SessionProvider>
      <div className="space-y-8">
        <UnifiedPostDetail post={post} postType="main" />
        <CommentSection
          postId={post.id}
          initialComments={post.comments || []}
        />
      </div>
    </SessionProvider>
  )
}
